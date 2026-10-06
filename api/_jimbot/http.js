'use strict';
// Utilitaires HTTP indépendants des aides Vercel (fonctionnent aussi avec
// le serveur de développement local et les tests).

class HttpError extends Error {
  constructor(status, code, userMessage, extra) {
    super(code);
    this.status = status;
    this.code = code;
    this.userMessage = userMessage;
    this.extra = extra || {};
  }
}

const MAX_BODY_BYTES = 32 * 1024;

async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  let raw = '';
  if (typeof req.body === 'string') raw = req.body;
  else if (Buffer.isBuffer(req.body)) raw = req.body.toString('utf8');
  else {
    raw = await new Promise((resolve, reject) => {
      let size = 0;
      const chunks = [];
      req.on('data', (c) => {
        size += c.length;
        if (size > MAX_BODY_BYTES) {
          reject(new HttpError(413, 'body_too_large', 'Le message est trop long.'));
          req.destroy();
          return;
        }
        chunks.push(c);
      });
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      req.on('error', reject);
    });
  }
  if (raw.length > MAX_BODY_BYTES) throw new HttpError(413, 'body_too_large', 'Le message est trop long.');
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
    return parsed;
  } catch {
    throw new HttpError(400, 'invalid_json', 'Requête invalide.');
  }
}

function sendJson(res, status, payload, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(payload));
}

function sendError(res, err, log) {
  if (err instanceof HttpError) {
    const headers = err.extra.retryAfter ? { 'Retry-After': String(err.extra.retryAfter) } : {};
    const payload = { error: err.code, message: err.userMessage };
    if (err.fields) payload.fields = err.fields;
    return sendJson(res, err.status, payload, headers);
  }
  if (log) log.error('unexpected_error', { error: safeErrorName(err) });
  return sendJson(res, 500, {
    error: 'internal_error',
    message: 'Une erreur technique est survenue. Merci de réessayer dans quelques instants.',
  });
}

function safeErrorName(err) {
  if (!err) return 'unknown';
  return String(err.code || err.name || 'Error').slice(0, 60);
}

function header(req, name) {
  const v = req.headers[name.toLowerCase()];
  return Array.isArray(v) ? v[0] : v || '';
}

function parseCookies(req) {
  const out = {};
  for (const part of header(req, 'cookie').split(';')) {
    const i = part.indexOf('=');
    if (i < 1) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    try {
      out[k] = decodeURIComponent(v);
    } catch {
      /* cookie illisible : ignoré */
    }
  }
  return out;
}

function isSecureRequest(req) {
  const proto = header(req, 'x-forwarded-proto');
  if (proto) return proto.split(',')[0].trim() === 'https';
  return Boolean(req.socket && req.socket.encrypted);
}

function serializeCookie(name, value, { maxAge, path = '/', secure = true, httpOnly = true, sameSite = 'Strict' } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${path}`, `SameSite=${sameSite}`];
  if (httpOnly) parts.push('HttpOnly');
  if (secure) parts.push('Secure');
  if (maxAge !== undefined) parts.push(`Max-Age=${Math.max(0, Math.floor(maxAge))}`);
  return parts.join('; ');
}

function appendSetCookie(res, cookie) {
  const prev = res.getHeader('Set-Cookie');
  const list = prev ? (Array.isArray(prev) ? prev : [prev]) : [];
  list.push(cookie);
  res.setHeader('Set-Cookie', list);
}

function clientIp(req) {
  const candidates = [header(req, 'x-vercel-forwarded-for'), header(req, 'x-real-ip'), header(req, 'x-forwarded-for')];
  for (const c of candidates) {
    const ip = c.split(',')[0].trim();
    if (ip) return ip.slice(0, 64);
  }
  return (req.socket && req.socket.remoteAddress) || 'inconnu';
}

// Protection CSRF : les requêtes qui modifient l'état doivent venir du site.
function assertAllowedOrigin(req, cfg) {
  const origin = header(req, 'origin');
  const allowed = new Set(cfg.allowedOrigins);
  const localOk = cfg.localMocks && /^http:\/\/(localhost|127\.0\.0\.1):\d{2,5}$/.test(origin);
  if (!origin || (!allowed.has(origin) && !localOk)) {
    throw new HttpError(403, 'forbidden_origin', 'Requête refusée.');
  }
  const ct = header(req, 'content-type');
  if (req.method === 'POST' && !ct.toLowerCase().startsWith('application/json')) {
    throw new HttpError(415, 'unsupported_media_type', 'Requête refusée.');
  }
}

function assertMethod(req, ...methods) {
  if (!methods.includes(req.method)) {
    throw new HttpError(405, 'method_not_allowed', 'Méthode non autorisée.');
  }
}

function queryParams(req) {
  const url = new URL(req.url || '/', 'http://localhost');
  return url.searchParams;
}

module.exports = {
  HttpError,
  readJson,
  sendJson,
  sendError,
  header,
  parseCookies,
  serializeCookie,
  appendSetCookie,
  isSecureRequest,
  clientIp,
  assertAllowedOrigin,
  assertMethod,
  queryParams,
  safeErrorName,
};
