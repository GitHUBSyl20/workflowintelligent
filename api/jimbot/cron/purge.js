'use strict';
// Purge quotidienne des données JimBot arrivées à expiration (6 mois).
// Appelée par Vercel Cron (vercel.json) avec « Authorization: Bearer $CRON_SECRET ».
// Peut être déclenchée à la main avec le même en-tête pour vérification.
const { getContext, requireConfigured } = require('../../_jimbot/context');
const { sendJson, sendError, header, HttpError } = require('../../_jimbot/http');
const { safeEqual } = require('../../_jimbot/security');
const { runPurge } = require('../../_jimbot/maintenance');
const { log } = require('../../_jimbot/log');

module.exports = async function handler(req, res) {
  let ctx;
  try {
    if (req.method !== 'GET' && req.method !== 'POST') throw new HttpError(405, 'method_not_allowed', 'Méthode non autorisée.');
    ctx = await getContext();
    const auth = header(req, 'authorization');
    if (!ctx.cfg.cronSecret || !safeEqual(auth, `Bearer ${ctx.cfg.cronSecret}`)) {
      throw new HttpError(401, 'unauthorized', 'Non autorisé.');
    }
    requireConfigured(ctx, 'cron');
    const result = await runPurge(ctx, header(req, 'user-agent').startsWith('vercel-cron') ? 'vercel_cron' : 'manuel');
    return sendJson(res, 200, { ok: true, ...result });
  } catch (err) {
    return sendError(res, err, (ctx && ctx.log) || log);
  }
};
