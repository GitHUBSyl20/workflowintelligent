'use strict';
// Accès Supabase côté serveur : uniquement des appels RPC aux fonctions
// jimbot_* (voir supabase/migrations). Clé service_role jamais exposée.

class StoreError extends Error {
  constructor(code) {
    super(`store_${code}`);
    this.code = `store_${code}`;
  }
}

// Clés « sb_secret_… » (nouveau format) : en-tête apikey seul.
// Clés JWT historiques (service_role) : apikey + Authorization.
function authHeaders(key) {
  const h = { apikey: key };
  if (!key.startsWith('sb_')) h.Authorization = `Bearer ${key}`;
  return h;
}

function createSupabaseStore(cfg) {
  const { url, serviceRoleKey, timeoutMs } = cfg.supabase;

  async function rpc(name, args = {}) {
    if (!/^jimbot_[a-z_]+$/.test(name)) throw new StoreError('invalid_function');
    let res;
    try {
      res = await fetch(`${url}/rest/v1/rpc/${name}`, {
        method: 'POST',
        headers: { ...authHeaders(serviceRoleKey), 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(args),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      throw new StoreError(err && err.name === 'TimeoutError' ? 'timeout' : 'unreachable');
    }
    if (!res.ok) {
      // Le corps peut contenir des valeurs (contraintes) : il n'est pas journalisé.
      await res.text().catch(() => '');
      throw new StoreError(`http_${res.status}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  return { rpc };
}

module.exports = { createSupabaseStore, StoreError, authHeaders };
