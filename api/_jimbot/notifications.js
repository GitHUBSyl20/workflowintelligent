'use strict';
const { buildNotification } = require('./mailer');

// Résumé factuel, construit sans modèle : il ne peut rien inventer.
function buildSummary({ request, messageCount, topics, firstQuestion }) {
  const lines = [];
  lines.push(
    request.noCompany
      ? `Demande d'un particulier ou indépendant (sans entreprise).`
      : `Demande au nom de l'entreprise « ${request.company} ».`
  );
  if (messageCount > 0) {
    lines.push(`Échange préalable avec JimBot : ${messageCount} message(s).`);
    if (firstQuestion) lines.push(`Première question posée : « ${firstQuestion.slice(0, 280)} ».`);
    if (topics.length) lines.push(`Thèmes consultés dans la base : ${topics.slice(0, 8).join(' ; ')}.`);
  } else {
    lines.push('Aucun échange préalable avec JimBot.');
  }
  return lines.join('\n').slice(0, 2000);
}

// Envoie la notification d'une demande déjà enregistrée.
// La réservation atomique (jimbot_notification_claim) empêche deux envois
// simultanés et tout nouvel envoi après un succès.
async function notifyRequest(ctx, requestId, { allowRetry }) {
  const { cfg, store, mailer, log } = ctx;
  const claimed = await store.rpc('jimbot_notification_claim', {
    p_request_id: requestId,
    p_lock_seconds: 120,
    p_max_attempts: cfg.mail.maxAttempts,
    p_allow_retry: Boolean(allowRetry),
  });
  if (!claimed) return { status: 'non_reserve' };

  const started = Date.now();
  try {
    const sent = await mailer.send(buildNotification(cfg, claimed));
    await store.rpc('jimbot_notification_finish', {
      p_request_id: requestId,
      p_success: true,
      p_error: null,
      p_message_id: sent.messageId,
    });
    log.info('notification_sent', { provider: mailer.name, attempt: claimed.attempt, duration_ms: Date.now() - started });
    return { status: 'envoyee' };
  } catch (err) {
    const code = (err && err.code) || 'mail_error';
    await store.rpc('jimbot_notification_finish', {
      p_request_id: requestId,
      p_success: false,
      p_error: code,
      p_message_id: null,
    });
    log.warn('notification_failed', { provider: mailer.name, attempt: claimed.attempt, error: code });
    return { status: 'echec' };
  }
}

module.exports = { buildSummary, notifyRequest };
