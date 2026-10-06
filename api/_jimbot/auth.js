'use strict';
// Supabase Auth (GoTrue) appelé côté serveur avec la clé publique (anon /
// publishable). Le navigateur ne reçoit jamais les jetons : ils sont posés
// en cookies HttpOnly limités à /api/jimbot/admin.
const { authHeaders } = require('./store');

class AuthError extends Error {
  constructor(code) {
    super(`auth_${code}`);
    this.code = `auth_${code}`;
  }
}

function createSupabaseAuth(cfg) {
  const { url, anonKey, timeoutMs } = cfg.supabase;

  async function call(path, { method = 'POST', body, token } = {}) {
    const headers = { apikey: anonKey, 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    else Object.assign(headers, authHeaders(anonKey));
    let res;
    try {
      res = await fetch(`${url}/auth/v1${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new AuthError('unreachable');
    }
    if (!res.ok) {
      await res.text().catch(() => '');
      throw new AuthError(`http_${res.status}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  const session = (d) => ({
    accessToken: d.access_token,
    refreshToken: d.refresh_token,
    expiresIn: d.expires_in,
    user: d.user ? { id: d.user.id, email: d.user.email } : null,
  });

  return {
    async signIn(email, password) {
      return session(await call('/token?grant_type=password', { body: { email, password } }));
    },
    async refresh(refreshToken) {
      return session(await call('/token?grant_type=refresh_token', { body: { refresh_token: refreshToken } }));
    },
    async getUser(accessToken) {
      const u = await call('/user', { method: 'GET', token: accessToken });
      return u && u.id ? { id: u.id, email: u.email } : null;
    },
    async signOut(accessToken) {
      await call('/logout', { token: accessToken }).catch(() => {});
    },
  };
}

module.exports = { createSupabaseAuth, AuthError };
