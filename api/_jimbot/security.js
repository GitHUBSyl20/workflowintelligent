'use strict';
const crypto = require('node:crypto');

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

// Empreinte salée : le jeton de session et l'adresse IP ne sont jamais stockés en clair.
function hashWithSalt(salt, value) {
  return crypto.createHash('sha256').update(`${salt}:${value}`).digest('hex');
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a || ''), 'utf8');
  const bb = Buffer.from(String(b || ''), 'utf8');
  if (ba.length === 0 || ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v);

const SESSION_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const isSessionToken = (v) => typeof v === 'string' && SESSION_TOKEN_RE.test(v);

module.exports = { randomToken, hashWithSalt, safeEqual, isUuid, isSessionToken };
