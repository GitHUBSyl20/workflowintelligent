'use strict';
const path = require('node:path');
const config = require('./config');
const { log } = require('./log');
const { createSupabaseStore } = require('./store');
const { createVapiClient } = require('./vapi');
const { createOpenAiEmbedder } = require('./embeddings');
const { createMailer } = require('./mailer');
const { createSupabaseAuth } = require('./auth');
const { HttpError } = require('./http');

let cached = null;

// Contexte des fonctions serveur. Les doublures locales (base PGlite,
// Vapi simulé, e-mail simulé) ne sont chargées qu'avec JIMBOT_LOCAL_MOCKS=1
// et jamais sur Vercel.
async function getContext() {
  if (cached) return cached;
  const cfg = config.load();
  if (cfg.localMocks) {
    if (process.env.VERCEL) throw new Error('JIMBOT_LOCAL_MOCKS est interdit sur Vercel');
    // Chemin construit à l'exécution : les doublures ne sont pas embarquées dans le déploiement.
    const devDir = path.join(process.cwd(), 'jimbot', 'dev');
    const { createLocalContext } = await import(require('node:url').pathToFileURL(path.join(devDir, 'local-context.mjs')).href);
    cached = await createLocalContext(cfg, log);
    return cached;
  }
  cached = {
    cfg,
    log,
    store: createSupabaseStore(cfg),
    vapi: createVapiClient(cfg),
    embedder: createOpenAiEmbedder(cfg),
    auth: createSupabaseAuth(cfg),
    get mailer() {
      return createMailer(cfg);
    },
  };
  return cached;
}

// Pour les tests : contexte fourni explicitement.
function setContext(ctx) {
  cached = ctx;
}

function requireConfigured(ctx, feature) {
  const absent = config.missing(ctx.cfg, feature);
  if (absent.length) {
    ctx.log.error('not_configured', { reason: feature, count: absent.length });
    throw new HttpError(503, 'not_configured', "JimBot n'est pas encore disponible. Vous pouvez écrire à contact@workflowintelligent.fr.");
  }
}

async function enforceRateLimit(ctx, bucket, windowSeconds, max, message) {
  const r = await ctx.store.rpc('jimbot_rate_limit_hit', {
    p_bucket: bucket,
    p_window_seconds: windowSeconds,
    p_max: max,
  });
  if (!r || !r.allowed) {
    throw new HttpError(429, 'rate_limited', message || 'Trop de requêtes. Merci de patienter un instant.', {
      retryAfter: (r && r.retry_after) || windowSeconds,
    });
  }
}

module.exports = { getContext, setContext, requireConfigured, enforceRateLimit };
