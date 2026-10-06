'use strict';
// Administration privée. Chaque requête vérifie :
//  1. le jeton Supabase Auth (cookie HttpOnly) auprès de Supabase ;
//  2. l'adresse dans JIMBOT_ADMIN_EMAILS ;
//  3. la présence du compte dans la table jimbot_admins.
// Aucune inscription n'est proposée ; un compte Supabase quelconque n'a aucun droit.
const {
  HttpError, readJson, sendJson, parseCookies, serializeCookie, appendSetCookie,
  isSecureRequest, clientIp, assertAllowedOrigin, assertMethod, queryParams,
} = require('../http');
const { hashWithSalt, isUuid } = require('../security');
const { cleanText } = require('../validation');
const { requireConfigured, enforceRateLimit } = require('../context');
const { notifyRequest } = require('../notifications');
const { processVapiDeletions } = require('../maintenance');

const AT_COOKIE = 'jimbot_adm_at';
const RT_COOKIE = 'jimbot_adm_rt';
const COOKIE_PATH = '/api/jimbot/admin';
const MAX_SESSION_SECONDS = 8 * 3600;

const DENIED = 'Identifiants invalides ou accès non autorisé.';

function setSessionCookies(req, res, session) {
  const secure = isSecureRequest(req);
  appendSetCookie(res, serializeCookie(AT_COOKIE, session.accessToken, { path: COOKIE_PATH, secure, maxAge: Math.min(session.expiresIn || 3600, 3600) }));
  appendSetCookie(res, serializeCookie(RT_COOKIE, session.refreshToken, { path: COOKIE_PATH, secure, maxAge: MAX_SESSION_SECONDS }));
}

function clearSessionCookies(req, res) {
  const secure = isSecureRequest(req);
  appendSetCookie(res, serializeCookie(AT_COOKIE, '', { path: COOKIE_PATH, secure, maxAge: 0 }));
  appendSetCookie(res, serializeCookie(RT_COOKIE, '', { path: COOKIE_PATH, secure, maxAge: 0 }));
}

async function isAllowed(ctx, user) {
  if (!user || !user.id || !user.email) return false;
  if (!ctx.cfg.admin.emails.includes(String(user.email).toLowerCase())) return false;
  return Boolean(await ctx.store.rpc('jimbot_is_admin', { p_user_id: user.id, p_email: user.email }));
}

async function requireAdmin(ctx, req, res) {
  requireConfigured(ctx, 'admin');
  const cookies = parseCookies(req);
  let user = null;
  if (cookies[AT_COOKIE]) user = await ctx.auth.getUser(cookies[AT_COOKIE]).catch(() => null);
  if (!user && cookies[RT_COOKIE]) {
    const session = await ctx.auth.refresh(cookies[RT_COOKIE]).catch(() => null);
    if (session) {
      user = await ctx.auth.getUser(session.accessToken).catch(() => null);
      if (user) setSessionCookies(req, res, session);
    }
  }
  if (!(await isAllowed(ctx, user))) {
    clearSessionCookies(req, res);
    throw new HttpError(401, 'unauthorized', 'Session expirée ou accès non autorisé. Reconnectez-vous.');
  }
  return user;
}

function uuidParam(value) {
  if (!isUuid(value)) throw new HttpError(400, 'invalid_id', 'Identifiant invalide.');
  return value;
}

// --- Session ----------------------------------------------------------
async function login(ctx, req, res) {
  assertMethod(req, 'POST');
  assertAllowedOrigin(req, ctx.cfg);
  requireConfigured(ctx, 'admin');
  const ip = hashWithSalt(ctx.cfg.hashSalt, `ip:${clientIp(req)}`).slice(0, 32);
  await enforceRateLimit(ctx, `admin-login:${ip}`, 900, ctx.cfg.limits.adminLoginPer15MinPerIp, 'Trop de tentatives. Réessayez dans quelques minutes.');
  const body = await readJson(req);
  const email = cleanText(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password || password.length > 200) throw new HttpError(401, 'unauthorized', DENIED);
  // Adresse hors liste : même réponse, sans interroger Supabase.
  if (!ctx.cfg.admin.emails.includes(email)) throw new HttpError(401, 'unauthorized', DENIED);

  const session = await ctx.auth.signIn(email, password).catch(() => null);
  if (!session || !(await isAllowed(ctx, session.user))) {
    if (session) await ctx.auth.signOut(session.accessToken);
    ctx.log.warn('admin_login', { status: 'refused' });
    throw new HttpError(401, 'unauthorized', DENIED);
  }
  setSessionCookies(req, res, session);
  ctx.log.info('admin_login', { status: 'ok' });
  return sendJson(res, 200, { email: session.user.email });
}

async function logout(ctx, req, res) {
  assertMethod(req, 'POST');
  assertAllowedOrigin(req, ctx.cfg);
  const at = parseCookies(req)[AT_COOKIE];
  if (at && ctx.auth) await ctx.auth.signOut(at);
  clearSessionCookies(req, res);
  return sendJson(res, 200, { ok: true });
}

async function me(ctx, req, res) {
  assertMethod(req, 'GET');
  const user = await requireAdmin(ctx, req, res);
  return sendJson(res, 200, { email: user.email });
}

// --- Demandes ---------------------------------------------------------
const STATUSES = ['nouvelle', 'a_traiter', 'traitee'];
const NOTIF_STATUSES = ['en_attente', 'envoi_en_cours', 'envoyee', 'echec'];

async function requests(ctx, req, res) {
  assertMethod(req, 'GET');
  await requireAdmin(ctx, req, res);
  const q = queryParams(req);
  const status = q.get('status');
  const notification = q.get('notification');
  const page = Math.max(1, Number.parseInt(q.get('page') || '1', 10) || 1);
  const data = await ctx.store.rpc('jimbot_admin_list_requests', {
    p_search: cleanText(q.get('q') || '').slice(0, 100) || null,
    p_status: STATUSES.includes(status) ? status : null,
    p_notification_status: NOTIF_STATUSES.includes(notification) ? notification : null,
    p_limit: 25,
    p_offset: (page - 1) * 25,
  });
  return sendJson(res, 200, { ...data, page, page_size: 25 });
}

async function request(ctx, req, res) {
  assertMethod(req, 'GET');
  await requireAdmin(ctx, req, res);
  const data = await ctx.store.rpc('jimbot_admin_get_request', { p_id: uuidParam(queryParams(req).get('id')) });
  if (!data) throw new HttpError(404, 'not_found', 'Demande introuvable (supprimée ou expirée).');
  return sendJson(res, 200, data);
}

async function requestStatus(ctx, req, res) {
  assertMethod(req, 'POST');
  assertAllowedOrigin(req, ctx.cfg);
  await requireAdmin(ctx, req, res);
  const body = await readJson(req);
  if (!STATUSES.includes(body.status)) throw new HttpError(400, 'invalid_status', 'Statut invalide.');
  const data = await ctx.store.rpc('jimbot_admin_set_status', { p_id: uuidParam(body.id), p_status: body.status });
  if (!data) throw new HttpError(404, 'not_found', 'Demande introuvable.');
  return sendJson(res, 200, data);
}

async function requestRetry(ctx, req, res) {
  assertMethod(req, 'POST');
  assertAllowedOrigin(req, ctx.cfg);
  await requireAdmin(ctx, req, res);
  requireConfigured(ctx, 'mail');
  const body = await readJson(req);
  const result = await notifyRequest(ctx, uuidParam(body.id), { allowRetry: true });
  if (result.status === 'non_reserve') {
    throw new HttpError(409, 'not_retryable', "Nouvel envoi impossible : notification déjà envoyée, en cours, ou nombre maximal de tentatives atteint.");
  }
  return sendJson(res, 200, { notification_status: result.status });
}

async function requestDelete(ctx, req, res) {
  assertMethod(req, 'POST');
  assertAllowedOrigin(req, ctx.cfg);
  await requireAdmin(ctx, req, res);
  const body = await readJson(req);
  const ok = await ctx.store.rpc('jimbot_admin_delete_request', { p_id: uuidParam(body.id) });
  if (!ok) throw new HttpError(404, 'not_found', 'Demande introuvable.');
  ctx.log.info('admin_delete', { reason: 'request' });
  return sendJson(res, 200, { deleted: true });
}

// --- Conversations ----------------------------------------------------
async function conversations(ctx, req, res) {
  assertMethod(req, 'GET');
  await requireAdmin(ctx, req, res);
  const page = Math.max(1, Number.parseInt(queryParams(req).get('page') || '1', 10) || 1);
  const data = await ctx.store.rpc('jimbot_admin_list_conversations', { p_limit: 25, p_offset: (page - 1) * 25 });
  return sendJson(res, 200, { ...data, page, page_size: 25 });
}

async function conversation(ctx, req, res) {
  assertMethod(req, 'GET');
  await requireAdmin(ctx, req, res);
  const data = await ctx.store.rpc('jimbot_admin_get_conversation', { p_id: uuidParam(queryParams(req).get('id')) });
  if (!data) throw new HttpError(404, 'not_found', 'Conversation introuvable (supprimée ou expirée).');
  return sendJson(res, 200, data);
}

async function conversationDelete(ctx, req, res) {
  assertMethod(req, 'POST');
  assertAllowedOrigin(req, ctx.cfg);
  await requireAdmin(ctx, req, res);
  const body = await readJson(req);
  const ok = await ctx.store.rpc('jimbot_admin_delete_conversation', { p_id: uuidParam(body.id) });
  if (!ok) throw new HttpError(404, 'not_found', 'Conversation introuvable.');
  // Copies Vapi : tentative immédiate, sinon reprise par la purge quotidienne.
  const vapi = await processVapiDeletions(ctx, 20).catch(() => ({ deleted: 0, failed: 0 }));
  ctx.log.info('admin_delete', { reason: 'conversation', deleted: vapi.deleted, failed: vapi.failed });
  return sendJson(res, 200, { deleted: true, vapi });
}

module.exports = {
  routes: {
    login,
    logout,
    me,
    requests,
    request,
    'request-status': requestStatus,
    'request-retry': requestRetry,
    'request-delete': requestDelete,
    conversations,
    conversation,
    'conversation-delete': conversationDelete,
  },
};
