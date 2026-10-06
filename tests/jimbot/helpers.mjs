// Aides de test : contexte local isolé et appels HTTP simulés.
import { createRequire } from 'node:module';
import { createLocalContext, fakeReq, fakeRes } from '../../jimbot/dev/local-context.mjs';

const require = createRequire(import.meta.url);
const config = require('../../api/_jimbot/config.js');
const { log } = require('../../api/_jimbot/log.js');
const publicHandlers = require('../../api/_jimbot/handlers/public.js');
const adminHandlers = require('../../api/_jimbot/handlers/admin.js');
const contextModule = require('../../api/_jimbot/context.js');

export const ORIGIN = 'https://www.workflowintelligent.fr';
export const ADMIN = { email: 'admin.test@example.test', password: 'mot-de-passe-test-admin' };
export const INTRUDER = { email: 'intrus.test@example.test', password: 'mot-de-passe-test-intrus' };

const silentLog = { info() {}, warn() {}, error() {} };

export async function makeContext() {
  process.env.JIMBOT_LOCAL_MOCKS = '1';
  process.env.JIMBOT_ADMIN_EMAILS = `${ADMIN.email},${INTRUDER.email}`;
  process.env.JIMBOT_LOCAL_ADMIN_PASSWORD = ADMIN.password;
  process.env.JIMBOT_LOCAL_INTRUDER_PASSWORD = INTRUDER.password;
  process.env.JIMBOT_HASH_SALT = 'sel-de-test';
  process.env.JIMBOT_SITE_URL = ORIGIN;
  const cfg = config.load();
  const ctx = await createLocalContext(cfg, process.env.JIMBOT_TEST_VERBOSE ? log : silentLog);
  contextModule.setContext(ctx);
  return ctx;
}

// Navigateur minimal : conserve les cookies posés par le serveur.
let ipCounter = 0;
export function makeClient(ctx, { origin = ORIGIN, ip = `203.0.113.${(ipCounter += 1) % 250}` } = {}) {
  const jar = new Map();
  async function call(kind, action, { method = 'GET', body, query = '', headers = {}, noOrigin = false } = {}) {
    const routes = kind === 'admin' ? adminHandlers.routes : publicHandlers.routes;
    const prefix = kind === 'admin' ? '/api/jimbot/admin/' : '/api/jimbot/';
    const h = {
      'x-forwarded-proto': 'https',
      'x-real-ip': ip,
      cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; '),
      ...headers,
    };
    if (!noOrigin) h.origin = origin;
    if (body !== undefined) h['content-type'] = 'application/json';
    const req = fakeReq({ method, url: `${prefix}${action}${query}`, headers: h, body });
    const res = fakeRes();
    try {
      await routes[action](ctx, req, res);
    } catch (err) {
      require('../../api/_jimbot/http.js').sendError(res, err, silentLog);
    }
    const setCookie = res.headers['set-cookie'];
    for (const c of setCookie ? [].concat(setCookie) : []) {
      const [pair, ...attrs] = c.split(';');
      const i = pair.indexOf('=');
      const name = pair.slice(0, i);
      const value = pair.slice(i + 1);
      if (attrs.some((a) => a.trim() === 'Max-Age=0')) jar.delete(name);
      else jar.set(name, value);
    }
    return { status: res.statusCode, data: res.body ? JSON.parse(res.body) : null, headers: res.headers };
  }
  return {
    jar,
    pub: (action, opts) => call('public', action, opts),
    admin: (action, opts) => call('admin', action, opts),
    say: (message, id) => call('public', 'chat', { method: 'POST', body: { message, clientMessageId: id || crypto.randomUUID() } }),
  };
}

export function contactBody(overrides = {}) {
  return {
    lastName: 'Durand',
    firstName: 'Camille',
    email: 'camille.durand@example.test',
    company: 'Atelier Exemple',
    noCompany: false,
    need: "Automatiser la saisie des commandes reçues par e-mail dans notre logiciel.",
    confirmed: true,
    idempotencyKey: crypto.randomUUID(),
    ...overrides,
  };
}

export async function adminClient(ctx, who = ADMIN) {
  const c = makeClient(ctx);
  const r = await c.admin('login', { method: 'POST', body: { email: who.email, password: who.password } });
  return { client: c, login: r };
}
