'use strict';
// Suppression des copies de conversations conservées chez Vapi
// (DELETE https://api.vapi.ai/chat/{id}), à partir de la file
// jimbot_vapi_deletions alimentée par la purge et par l'administration.
const config = require('./config');

async function processVapiDeletions(ctx, limit = 50) {
  if (!ctx.cfg.localMocks && !ctx.cfg.vapi.privateKey) return { deleted: 0, failed: 0, skipped: 'vapi_non_configure' };
  const ids = (await ctx.store.rpc('jimbot_vapi_deletions_pending', { p_limit: limit })) || [];
  let deleted = 0;
  let failed = 0;
  for (const id of ids) {
    try {
      await ctx.vapi.deleteChat(id);
      await ctx.store.rpc('jimbot_vapi_deletion_result', { p_vapi_chat_id: id, p_success: true, p_error: null });
      deleted += 1;
    } catch (err) {
      await ctx.store.rpc('jimbot_vapi_deletion_result', { p_vapi_chat_id: id, p_success: false, p_error: (err && err.code) || 'error' });
      failed += 1;
    }
  }
  if (ids.length) ctx.log.info('vapi_deletions', { deleted, failed });
  return { deleted, failed };
}

async function runPurge(ctx, trigger) {
  const before = await processVapiDeletions(ctx, 100);
  const counts = await ctx.store.rpc('jimbot_purge_expired', {
    p_trigger: trigger,
    p_extra: { vapi_chats_deleted_before: before.deleted || 0, vapi_chats_failed_before: before.failed || 0 },
  });
  const after = await processVapiDeletions(ctx, 100);
  ctx.log.info('purge', { count: Object.values(counts || {}).reduce((a, b) => a + (Number(b) || 0), 0) });
  return { counts, vapi_after: after, vapi_configured: config.missing(ctx.cfg, 'chat').length === 0 };
}

module.exports = { processVapiDeletions, runPurge };
