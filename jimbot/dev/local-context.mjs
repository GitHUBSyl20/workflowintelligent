// Contexte LOCAL de JimBot (JIMBOT_LOCAL_MOCKS=1) pour les tests et le
// serveur de développement. Rien ici n'est déployé (dossier /jimbot exclu
// par .vercelignore) et context.js refuse ce mode sur Vercel.
//
// * Base : vraie migration exécutée sur PGlite (Postgres + pgvector).
// * Embeddings : générateur factice déterministe (mock-hash-1536).
// * Vapi : SIMULATEUR. Il ne reproduit pas le modèle de langage ; il
//   reproduit le contrat d'API (POST /chat, previousChatId, appel de
//   l'outil par webhook authentifié, DELETE /chat/{id}) pour vérifier
//   tout le circuit serveur. Le comportement réel du modèle se teste
//   avec scripts/jimbot-smoke.mjs une fois Vapi configuré.
// * E-mail et Supabase Auth : simulés, avec pannes déclenchables.
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import { createLocalStore } from './pglite-store.mjs';

const require = createRequire(import.meta.url);
const embedder = require('./mock-embeddings.cjs');

function fakeReq({ method = 'POST', url = '/', headers = {}, body }) {
  return { method, url, headers: Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])), body, socket: {} };
}

function fakeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    getHeader(k) { return this.headers[k.toLowerCase()]; },
    end(b) { this.body = b || ''; },
  };
  return res;
}

const INJECTION_RE = /(ignore|oublie|contourne).{0,40}(instruction|consigne|r[eè]gle)|prompt|instructions? (syst[eè]me|interne)|r[ée]v[eè]le.{0,30}(consigne|instruction)/i;

function createVapiSimulator(invokeTool) {
  const chats = new Map();
  const sim = {
    failMode: null, // null | 'timeout' | 'http_500'
    deleted: [],
    chats,
    async chat({ input, previousChatId }) {
      if (sim.failMode) {
        const err = new Error('vapi');
        err.code = sim.failMode === 'timeout' ? 'vapi_timeout' : 'vapi_http_500';
        err.status = sim.failMode === 'timeout' ? 0 : 500;
        throw err;
      }
      let history = [];
      if (previousChatId) {
        if (!chats.has(previousChatId)) {
          const err = new Error('vapi');
          err.code = 'vapi_http_404';
          err.status = 404;
          throw err;
        }
        history = chats.get(previousChatId).history;
      }
      const id = `chat_sim_${crypto.randomUUID()}`;
      const messages = [...history, { role: 'user', content: input }];
      let reply;
      const extra = [];
      if (INJECTION_RE.test(input)) {
        reply = "Je ne peux pas communiquer mes consignes internes ni en changer. Je peux en revanche vous présenter le parcours de Sylvain ou vous aider à préciser votre projet.";
      } else {
        // Question courte de relance : le simulateur s'appuie sur le contexte précédent.
        const lastUser = [...history].reverse().find((m) => m.role === 'user');
        const query = input.length < 45 && lastUser ? `${lastUser.content} ${input}` : input;
        const toolCallId = `call_${crypto.randomUUID().slice(0, 12)}`;
        const toolResult = await invokeTool({
          message: {
            type: 'tool-calls',
            chat: { id },
            toolCallList: [{ id: toolCallId, type: 'function', function: { name: 'rechercher_connaissances_jimbot', arguments: JSON.stringify({ requete: query }) } }],
          },
        });
        const result = (toolResult.results && toolResult.results[0] && toolResult.results[0].result) || '';
        extra.push({ role: 'assistant', tool_calls: [{ id: toolCallId, type: 'function', function: { name: 'rechercher_connaissances_jimbot' } }] });
        extra.push({ role: 'tool', tool_call_id: toolCallId, content: result });
        if (/^(AUCUN_RESULTAT|RECHERCHE_INDISPONIBLE)/.test(result)) {
          reply = "Je n'ai pas cette information dans les contenus dont je dispose, et je préfère ne pas l'inventer. Souhaitez-vous que Sylvain vous recontacte pour en parler ?";
        } else {
          const m = /\[Extrait 1\] « ([^»]+) » \([^)]*\) : (.*?)(?: \[Extrait 2\]| \[Fin des extraits\])/.exec(result);
          const sentence = m ? m[2].split(/(?<=\.)\s/).slice(0, 2).join(' ') : '';
          reply = `D'après les informations disponibles (${m ? m[1] : 'base de connaissances'}) : ${sentence}`;
        }
      }
      const out = { role: 'assistant', content: reply };
      chats.set(id, { history: [...messages, out] });
      return { chatId: id, reply, toolCallIds: extra.filter((x) => x.role === 'tool').map((x) => x.tool_call_id) };
    },
    async deleteChat(chatId) {
      if (sim.failMode === 'http_500') {
        const err = new Error('vapi');
        err.code = 'vapi_http_500';
        throw err;
      }
      chats.delete(chatId);
      sim.deleted.push(chatId);
      return { ok: true };
    },
  };
  return sim;
}

function createMailerSimulator() {
  const sim = {
    name: 'simulateur',
    failMode: process.env.JIMBOT_MOCK_MAIL_FAIL === '1' ? 'smtp_down' : null,
    sent: [],
    async send(message) {
      if (sim.failMode) {
        const err = new Error('mail');
        err.code = 'mail_econnection';
        throw err;
      }
      sim.sent.push(message);
      return { messageId: `<sim-${sim.sent.length}@localhost>` };
    },
  };
  return sim;
}

function createAuthSimulator(users) {
  const tokens = new Map();
  const issue = (user) => {
    const accessToken = crypto.randomBytes(24).toString('hex');
    const refreshToken = crypto.randomBytes(24).toString('hex');
    tokens.set(accessToken, { user, kind: 'access' });
    tokens.set(refreshToken, { user, kind: 'refresh' });
    return { accessToken, refreshToken, expiresIn: 3600, user: { id: user.id, email: user.email } };
  };
  return {
    users,
    async signIn(email, password) {
      const u = users.find((x) => x.email === email && x.password === password);
      if (!u) {
        const err = new Error('auth');
        err.code = 'auth_http_400';
        throw err;
      }
      return issue(u);
    },
    async refresh(token) {
      const t = tokens.get(token);
      if (!t || t.kind !== 'refresh') throw Object.assign(new Error('auth'), { code: 'auth_http_400' });
      tokens.delete(token);
      return issue(t.user);
    },
    async getUser(token) {
      const t = tokens.get(token);
      return t && t.kind === 'access' ? { id: t.user.id, email: t.user.email } : null;
    },
    async signOut(token) {
      tokens.delete(token);
    },
    expireAccessTokens() {
      for (const [k, v] of tokens) if (v.kind === 'access') tokens.delete(k);
    },
  };
}

export async function createLocalContext(cfg, log) {
  const local = await createLocalStore();
  const { routes } = require('../../api/_jimbot/handlers/public.js');

  // Comptes de test locaux : administrateur autorisé + compte sans droit.
  const adminEmail = cfg.admin.emails[0] || 'admin.local@example.test';
  const users = [
    { id: crypto.randomUUID(), email: adminEmail, password: process.env.JIMBOT_LOCAL_ADMIN_PASSWORD || crypto.randomBytes(12).toString('hex') },
    { id: crypto.randomUUID(), email: 'intrus.local@example.test', password: process.env.JIMBOT_LOCAL_INTRUDER_PASSWORD || crypto.randomBytes(12).toString('hex') },
  ];
  for (const u of users) await local.db.query('insert into auth.users (id, email) values ($1, $2)', [u.id, u.email]);
  await local.db.query('insert into public.jimbot_admins (user_id, email) values ($1, $2)', [users[0].id, users[0].email]);

  const ctx = {
    cfg: {
      ...cfg,
      hashSalt: cfg.hashSalt || 'sel-local-de-test',
      vapi: { ...cfg.vapi, toolSecret: cfg.vapi.toolSecret || 'secret-outil-local' },
      cronSecret: cfg.cronSecret || 'secret-cron-local',
      admin: { emails: cfg.admin.emails.length ? cfg.admin.emails : [adminEmail, 'intrus.local@example.test'] },
      retrieval: { ...cfg.retrieval, minSimilarity: Number(process.env.JIMBOT_MIN_SIMILARITY || 0.15) },
    },
    log,
    store: { rpc: local.rpc },
    embedder,
    auth: createAuthSimulator(users),
    mailer: createMailerSimulator(),
    db: local.db,
  };
  ctx.vapi = createVapiSimulator(async (payload) => {
    const req = fakeReq({ url: '/api/jimbot/vapi-tool', headers: { authorization: `Bearer ${ctx.cfg.vapi.toolSecret}`, 'content-type': 'application/json' }, body: payload });
    const res = fakeRes();
    await routes['vapi-tool'](ctx, req, res);
    return JSON.parse(res.body || '{}');
  });
  return ctx;
}

export { fakeReq, fakeRes };
