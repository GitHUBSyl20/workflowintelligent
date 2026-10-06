'use strict';
// Notification d'une demande de contact à Sylvain.
// Fournisseurs : « smtp » (messagerie Gandi, mail.gandi.net) ou « resend ».
// L'e-mail contient les coordonnées, le besoin validé, un résumé et un lien
// vers la fiche d'administration ; jamais la conversation complète.

class MailError extends Error {
  constructor(code) {
    super(`mail_${code}`);
    this.code = `mail_${code}`;
  }
}

const escapeHtml = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const oneLine = (s) => String(s == null ? '' : s).replace(/[\r\n]+/g, ' ').trim();

function buildNotification(cfg, request) {
  const fullName = oneLine(`${request.first_name} ${request.last_name}`);
  const company = request.no_company ? 'Sans entreprise' : oneLine(request.company);
  const adminUrl = `${cfg.siteUrl}${cfg.adminPath}#/demandes/${request.id}`;
  const created = new Date(request.created_at).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

  const subject = `[JimBot] Demande de contact : ${fullName} (${company})`.slice(0, 180);
  const text = [
    'Nouvelle demande de contact envoyée depuis JimBot.',
    '',
    `Nom : ${oneLine(request.last_name)}`,
    `Prénom : ${oneLine(request.first_name)}`,
    `E-mail : ${oneLine(request.email)}`,
    `Entreprise : ${company}`,
    `Date : ${created}`,
    '',
    'Besoin validé par le visiteur :',
    request.need,
    '',
    'Résumé :',
    request.summary || '(aucun)',
    '',
    `Fiche dans l'administration : ${adminUrl}`,
    '',
    'Répondre à ce message écrit directement au visiteur (Reply-To).',
  ].join('\n');

  const row = (k, v) =>
    `<tr><th align="left" style="padding:4px 12px 4px 0;color:#555;font-weight:600">${escapeHtml(k)}</th><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;color:#222">
<p>Nouvelle demande de contact envoyée depuis JimBot.</p>
<table style="border-collapse:collapse">${row('Nom', request.last_name)}${row('Prénom', request.first_name)}${row('E-mail', request.email)}${row('Entreprise', company)}${row('Date', created)}</table>
<h3 style="margin:20px 0 6px">Besoin validé par le visiteur</h3>
<p style="white-space:pre-wrap;margin:0">${escapeHtml(request.need)}</p>
<h3 style="margin:20px 0 6px">Résumé</h3>
<p style="white-space:pre-wrap;margin:0">${escapeHtml(request.summary || '(aucun)')}</p>
<p style="margin-top:24px"><a href="${escapeHtml(adminUrl)}">Ouvrir la fiche dans l'administration</a></p>
<p style="color:#777;font-size:12px">Répondre à ce message écrit directement au visiteur (Reply-To).</p>
</div>`;

  return { from: cfg.mail.from, to: cfg.mail.to, replyTo: oneLine(request.email), subject, text, html };
}

function createSmtpTransport(cfg) {
  const nodemailer = require('nodemailer');
  const { host, port, user, pass } = cfg.mail.smtp;
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 : TLS implicite ; 587 : STARTTLS exigé ci-dessous
    requireTLS: port !== 465,
    auth: { user, pass },
    connectionTimeout: cfg.mail.timeoutMs,
    greetingTimeout: cfg.mail.timeoutMs,
    socketTimeout: cfg.mail.timeoutMs,
  });
  return {
    name: 'smtp',
    async send(message) {
      try {
        const info = await transporter.sendMail(message);
        return { messageId: info.messageId || null };
      } catch (err) {
        throw new MailError(String(err && (err.code || err.responseCode) ? err.code || err.responseCode : 'send_failed').toLowerCase());
      }
    },
  };
}

function createResendTransport(cfg) {
  const { Resend } = require('resend');
  const client = new Resend(cfg.mail.resendApiKey);
  return {
    name: 'resend',
    async send(message) {
      let result;
      try {
        result = await Promise.race([
          client.emails.send({
            from: message.from,
            to: message.to,
            reply_to: message.replyTo,
            subject: message.subject,
            text: message.text,
            html: message.html,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new MailError('timeout')), cfg.mail.timeoutMs)),
        ]);
      } catch (err) {
        throw err instanceof MailError ? err : new MailError('send_failed');
      }
      if (result && result.error) throw new MailError(String(result.error.name || 'rejected').toLowerCase());
      return { messageId: (result && result.data && result.data.id) || null };
    },
  };
}

function createMailer(cfg) {
  return cfg.mail.provider === 'resend' ? createResendTransport(cfg) : createSmtpTransport(cfg);
}

module.exports = { createMailer, buildNotification, escapeHtml, MailError };
