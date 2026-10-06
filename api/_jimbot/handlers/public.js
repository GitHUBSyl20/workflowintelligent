'use strict';
const {
  HttpError, readJson, sendJson, header, parseCookies, serializeCookie, appendSetCookie,
  isSecureRequest, clientIp, assertAllowedOrigin, assertMethod,
} = require('../http');
const { randomToken, hashWithSalt, safeEqual, isSessionToken } = require('../security');
const { validateChatMessage, validateContact, cleanText } = require('../validation');
const { createKnowledge } = require('../knowledge');
const { buildSummary, notifyRequest } = require('../notifications');
const { requireConfigured, enforceRateLimit } = require('../context');

const SESSION_COOKIE = 'jimbot_sid';
const COOKIE_PATH = '/api/jimbot';
const TOOL_NAME = 'rechercher_connaissances_jimbot';

// Marqueur présent dans le prompt système (jimbot/prompt-systeme.md) :
// s'il apparaît dans une réponse, le prompt est en train de fuiter.
const PROMPT_CANARY = 'JB-CANARI-7Q2X';

const FALLBACK_REPLY =
  "Je ne peux pas répondre à cela. Je peux en revanche vous présenter le parcours de Sylvain, ses réalisations, ou vous aider à préciser votre projet. Que souhaitez-vous savoir ?";
const EMPTY_REPLY =
  "Je n'ai pas réussi à formuler une réponse fiable. Pouvez-vous reformuler votre question ? Vous pouvez aussi demander à être recontacté par Sylvain.";

// ---------------------------------------------------------------------
// Session anonyme
// ---------------------------------------------------------------------
async function currentConversation(ctx, req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!isSessionToken(token)) return null;
  return ctx.store.rpc('jimbot_conversation_by_token', { p_token_hash: hashWithSalt(ctx.cfg.hashSalt, token) });
}

async function createConversation(ctx, req, res) {
  const token = randomToken(32);
  const conv = await ctx.store.rpc('jimbot_conversation_create', { p_token_hash: hashWithSalt(ctx.cfg.hashSalt, token) });
  // Cookie de session (pas de Max-Age) : HttpOnly, limité aux routes JimBot.
  appendSetCookie(res, serializeCookie(SESSION_COOKIE, token, { path: COOKIE_PATH, secure: isSecureRequest(req) }));
  return conv;
}

function clearSession(req, res) {
  appendSetCookie(res, serializeCookie(SESSION_COOKIE, '', { path: COOKIE_PATH, secure: isSecureRequest(req), maxAge: 0 }));
}

const ipKey = (ctx, req) => hashWithSalt(ctx.cfg.hashSalt, `ip:${clientIp(req)}`).slice(0, 32);

// ---------------------------------------------------------------------
// POST /api/jimbot/chat
// ---------------------------------------------------------------------
function sanitizeReply(text) {
  if (!text) return EMPTY_REPLY;
  if (text.includes(PROMPT_CANARY)) return FALLBACK_REPLY;
  return text.replace(/\u0000/g, '').slice(0, 6000);
}

async function chat(ctx, req, res) {
  assertMethod(req, 'POST');
  assertAllowedOrigin(req, ctx.cfg);
  requireConfigured(ctx, 'chat');
  const body = await readJson(req);
  const { message, clientMessageId } = validateChatMessage(body, ctx.cfg);
  const ip = ipKey(ctx, req);
  const busy = 'Vous envoyez beaucoup de messages. Merci de patienter un instant avant de réessayer.';
  await enforceRateLimit(ctx, `chat-min:${ip}`, 60, ctx.cfg.limits.chatPerMinutePerIp, busy);
  await enforceRateLimit(ctx, `chat-day:${ip}`, 86400, ctx.cfg.limits.chatPerDayPerIp, 'Limite quotidienne de messages atteinte. Vous pouvez demander à être recontacté.');

  let conv = await currentConversation(ctx, req);
  if (!conv) conv = await createConversation(ctx, req, res);

  if (conv.message_count >= ctx.cfg.limits.maxMessagesPerConversation) {
    throw new HttpError(409, 'conversation_full', 'Cette conversation a atteint sa longueur maximale. Démarrez une nouvelle conversation ou demandez à être recontacté.');
  }

  // Requête rejouée : on renvoie la réponse déjà produite.
  const previous = await ctx.store.rpc('jimbot_turn_lookup', { p_conversation_id: conv.id, p_client_message_id: clientMessageId });
  if (previous && previous.found) {
    if (previous.reply) return sendJson(res, 200, { reply: previous.reply, replayed: true });
    throw new HttpError(409, 'already_processing', 'Votre message est déjà en cours de traitement.');
  }

  const locked = await ctx.store.rpc('jimbot_conversation_lock', { p_conversation_id: conv.id, p_seconds: ctx.cfg.limits.conversationLockSeconds });
  if (!locked) throw new HttpError(409, 'already_processing', 'Une réponse est déjà en cours. Merci de patienter.');

  const started = Date.now();
  try {
    let result;
    try {
      result = await ctx.vapi.chat({ input: message, previousChatId: conv.vapi_last_chat_id || undefined });
    } catch (err) {
      // Chat précédent introuvable chez Vapi (supprimé, expiré) : on repart sans contexte Vapi.
      if (conv.vapi_last_chat_id && (err.status === 400 || err.status === 404)) {
        ctx.log.warn('vapi_previous_chat_reset', { error: err.code });
        result = await ctx.vapi.chat({ input: message });
      } else {
        throw err;
      }
    }
    const reply = sanitizeReply(result.reply);
    await ctx.store.rpc('jimbot_turn_save', {
      p_conversation_id: conv.id,
      p_client_message_id: clientMessageId,
      p_user_content: message,
      p_assistant_content: reply,
      p_vapi_chat_id: result.chatId,
      p_tool_call_ids: result.toolCallIds,
    });
    ctx.log.info('chat_turn', { duration_ms: Date.now() - started, status: 'ok' });
    return sendJson(res, 200, { reply });
  } catch (err) {
    await ctx.store.rpc('jimbot_conversation_unlock', { p_conversation_id: conv.id }).catch(() => {});
    if (err && typeof err.code === 'string' && err.code.startsWith('vapi_')) {
      ctx.log.error('chat_turn', { duration_ms: Date.now() - started, error: err.code });
      const timeout = err.code === 'vapi_timeout';
      throw new HttpError(timeout ? 504 : 502, timeout ? 'assistant_timeout' : 'assistant_unavailable',
        timeout
          ? "JimBot met trop de temps à répondre. Merci de renvoyer votre message dans quelques instants."
          : "JimBot est momentanément indisponible. Réessayez plus tard ou demandez à être recontacté.");
    }
    throw err;
  }
}

// ---------------------------------------------------------------------
// GET /api/jimbot/history
// ---------------------------------------------------------------------
async function history(ctx, req, res) {
  assertMethod(req, 'GET');
  requireConfigured(ctx, 'session');
  const conv = await currentConversation(ctx, req);
  if (!conv) return sendJson(res, 200, { messages: [] });
  const messages = await ctx.store.rpc('jimbot_messages_for_conversation', { p_conversation_id: conv.id, p_limit: 100 });
  return sendJson(res, 200, {
    messages: (messages || []).map((m) => ({ role: m.role, content: m.content })),
  });
}

// ---------------------------------------------------------------------
// POST /api/jimbot/reset : nouvelle conversation
// ---------------------------------------------------------------------
async function reset(ctx, req, res) {
  assertMethod(req, 'POST');
  assertAllowedOrigin(req, ctx.cfg);
  requireConfigured(ctx, 'session');
  const conv = await currentConversation(ctx, req);
  if (conv) await ctx.store.rpc('jimbot_conversation_end', { p_conversation_id: conv.id });
  clearSession(req, res);
  return sendJson(res, 200, { ok: true });
}

// ---------------------------------------------------------------------
// GET /api/jimbot/contact-draft : préremplissage du besoin
// ---------------------------------------------------------------------
async function contactDraft(ctx, req, res) {
  assertMethod(req, 'GET');
  requireConfigured(ctx, 'session');
  const conv = await currentConversation(ctx, req);
  if (!conv) return sendJson(res, 200, { need: '' });
  const draft = await ctx.store.rpc('jimbot_contact_draft', { p_conversation_id: conv.id });
  const msgs = (draft && draft.user_messages) || [];
  const need = msgs.map((m) => cleanText(m, { multiline: true })).join('\n\n').slice(0, 1500);
  return sendJson(res, 200, { need });
}

// ---------------------------------------------------------------------
// POST /api/jimbot/contact : demande explicite d'être recontacté
// ---------------------------------------------------------------------
const CONSENT_NOTICE_VERSION = '2026-10-06';

async function contact(ctx, req, res) {
  assertMethod(req, 'POST');
  assertAllowedOrigin(req, ctx.cfg);
  requireConfigured(ctx, 'session');
  const body = await readJson(req);
  const ip = ipKey(ctx, req);
  await enforceRateLimit(ctx, `contact-h:${ip}`, 3600, ctx.cfg.limits.contactPerHourPerIp,
    'Trop de demandes envoyées. Merci de réessayer plus tard ou d’écrire à contact@workflowintelligent.fr.');
  const data = validateContact(body);

  const conv = await currentConversation(ctx, req);
  let messageCount = 0;
  let topics = [];
  let firstQuestion = null;
  if (conv) {
    messageCount = conv.message_count || 0;
    topics = (await ctx.store.rpc('jimbot_conversation_topics', { p_conversation_id: conv.id })) || [];
    const msgs = (await ctx.store.rpc('jimbot_messages_for_conversation', { p_conversation_id: conv.id, p_limit: 200 })) || [];
    const first = msgs.find((m) => m.role === 'user');
    firstQuestion = first ? cleanText(first.content) : null;
  }
  const summary = buildSummary({ request: data, messageCount, topics, firstQuestion });

  const created = await ctx.store.rpc('jimbot_contact_create', {
    p_conversation_id: conv ? conv.id : null,
    p_idempotency_key: data.idempotencyKey,
    p_last_name: data.lastName,
    p_first_name: data.firstName,
    p_email: data.email,
    p_company: data.company,
    p_no_company: data.noCompany,
    p_need: data.need,
    p_summary: summary,
    p_explicit_request: {
      action: 'bouton_envoyer_ma_demande',
      confirmed: true,
      notice_version: CONSENT_NOTICE_VERSION,
      submitted_at: new Date().toISOString(),
      from_conversation: Boolean(conv),
    },
  });
  ctx.log.info('contact_request', { created: Boolean(created && created.created) });

  // La demande est enregistrée : la notification est tentée ensuite.
  // Un échec d'envoi ne fait pas perdre la demande (voir l'administration).
  let notification = created.notification_status;
  if (created.created || notification === 'en_attente') {
    if (ctx.cfg.localMocks || require('../config').missing(ctx.cfg, 'mail').length === 0) {
      notification = (await notifyRequest(ctx, created.id, { allowRetry: false })).status;
    } else {
      ctx.log.error('not_configured', { reason: 'mail' });
    }
  }
  return sendJson(res, created.created ? 201 : 200, {
    saved: true,
    duplicate: !created.created,
    message: 'Votre demande est bien enregistrée. Sylvain vous répondra par e-mail.',
    notified: notification === 'envoyee',
  });
}

// ---------------------------------------------------------------------
// POST /api/jimbot/vapi-tool : outil appelé par Vapi pendant le chat
// ---------------------------------------------------------------------
function toolAuthorized(ctx, req) {
  const expected = ctx.cfg.vapi.toolSecret;
  if (!expected) return false;
  const auth = header(req, 'authorization');
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return safeEqual(bearer, expected) || safeEqual(header(req, 'x-vapi-secret'), expected);
}

function parseArguments(raw) {
  if (raw && typeof raw === 'object') return raw;
  if (typeof raw === 'string') {
    try {
      const v = JSON.parse(raw);
      return v && typeof v === 'object' ? v : {};
    } catch {
      return {};
    }
  }
  return {};
}

function extractToolCalls(message) {
  const calls = [];
  for (const tc of message.toolCallList || []) {
    if (tc && tc.id) calls.push({ id: tc.id, name: tc.function && tc.function.name, args: tc.function && tc.function.arguments });
  }
  if (!calls.length) {
    for (const item of message.toolWithToolCallList || []) {
      const tc = item && item.toolCall;
      if (tc && tc.id) calls.push({ id: tc.id, name: (tc.function && tc.function.name) || (item.function && item.function.name), args: tc.function && tc.function.arguments });
    }
  }
  return calls.slice(0, 5);
}

async function vapiTool(ctx, req, res) {
  assertMethod(req, 'POST');
  if (!toolAuthorized(ctx, req)) throw new HttpError(401, 'unauthorized', 'Non autorisé.');
  requireConfigured(ctx, 'tool');
  await enforceRateLimit(ctx, 'tool-global', 60, ctx.cfg.limits.toolPerMinute);
  const body = await readJson(req);
  const message = body.message && typeof body.message === 'object' ? body.message : {};
  if (message.type !== 'tool-calls') return sendJson(res, 200, {});

  const chatId = [message.chat && message.chat.id, body.chat && body.chat.id, message.call && message.call.id]
    .find((v) => typeof v === 'string') || null;
  const knowledge = createKnowledge(ctx);
  const results = [];
  for (const call of extractToolCalls(message)) {
    if (call.name !== TOOL_NAME) {
      results.push({ toolCallId: call.id, error: 'Outil inconnu.' });
      continue;
    }
    const args = parseArguments(call.args);
    try {
      const found = await knowledge.search(args.requete);
      await ctx.store.rpc('jimbot_log_retrieval', {
        p_tool_call_id: call.id,
        p_vapi_chat_id: chatId,
        p_query: found.query,
        p_results: found.rows.map((r) => ({ doc_ref: r.doc_ref, chunk: r.chunk_index, title: r.title, similarity: Math.round(r.similarity * 1000) / 1000 })),
      });
      ctx.log.info('knowledge_search', { results: found.rows.length });
      results.push({ toolCallId: call.id, result: found.text });
    } catch (err) {
      ctx.log.error('knowledge_search', { error: (err && err.code) || 'error' });
      results.push({
        toolCallId: call.id,
        result: "RECHERCHE_INDISPONIBLE : la base de connaissances n'a pas pu être consultée. N'invente rien ; dis au visiteur que l'information n'est pas disponible pour le moment et propose-lui d'être recontacté.",
      });
    }
  }
  return sendJson(res, 200, { results });
}

module.exports = {
  routes: {
    chat,
    history,
    reset,
    'contact-draft': contactDraft,
    contact,
    'vapi-tool': vapiTool,
  },
  SESSION_COOKIE,
  TOOL_NAME,
  PROMPT_CANARY,
};
