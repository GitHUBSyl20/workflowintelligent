'use strict';
const { HttpError } = require('./http');

// Retire les caractères de contrôle (sauf saut de ligne) et normalise.
function cleanText(value, { multiline = false } = {}) {
  if (typeof value !== 'string') return '';
  let v = value.normalize('NFC').replace(/\r\n?/g, '\n');
  v = multiline ? v.replace(/[\u0000-\u0009\u000b-\u001f\u007f​-‏‪-‮⁦-⁩]/g, '') : v.replace(/[\u0000-\u001f\u007f​-‏‪-‮⁦-⁩]/g, ' ');
  if (multiline) v = v.replace(/\n{3,}/g, '\n\n');
  return v.replace(/[ \t]+/g, ' ').trim();
}

const CLIENT_ID_RE = /^[A-Za-z0-9-]{8,64}$/;
const IDEMPOTENCY_RE = /^[A-Za-z0-9-]{16,64}$/;
// Volontairement simple : une partie locale, un @, un domaine avec un point.
const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

function validateChatMessage(body, cfg) {
  const message = cleanText(body.message, { multiline: true });
  if (!message) throw new HttpError(400, 'empty_message', 'Votre message est vide.');
  if (message.length > cfg.limits.maxMessageChars) {
    throw new HttpError(400, 'message_too_long', `Votre message dépasse ${cfg.limits.maxMessageChars} caractères. Merci de le raccourcir.`);
  }
  const clientMessageId = typeof body.clientMessageId === 'string' ? body.clientMessageId : '';
  if (!CLIENT_ID_RE.test(clientMessageId)) throw new HttpError(400, 'invalid_message_id', 'Requête invalide.');
  return { message, clientMessageId };
}

function validateContact(body) {
  const errors = {};
  const lastName = cleanText(body.lastName);
  const firstName = cleanText(body.firstName);
  const email = cleanText(body.email).toLowerCase();
  const noCompany = body.noCompany === true;
  const company = noCompany ? null : cleanText(body.company);
  const need = cleanText(body.need, { multiline: true });
  const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey : '';

  if (!lastName) errors.lastName = 'Indiquez votre nom.';
  else if (lastName.length > 100) errors.lastName = 'Le nom est trop long (100 caractères au plus).';
  if (!firstName) errors.firstName = 'Indiquez votre prénom.';
  else if (firstName.length > 100) errors.firstName = 'Le prénom est trop long (100 caractères au plus).';
  if (!email) errors.email = 'Indiquez votre adresse e-mail.';
  else if (email.length > 254 || !EMAIL_RE.test(email)) errors.email = "L'adresse e-mail ne semble pas valide.";
  if (!noCompany) {
    if (body.noCompany !== false && body.noCompany !== undefined) errors.company = 'Choix invalide.';
    else if (!company) errors.company = 'Indiquez votre entreprise ou cochez « Sans entreprise ».';
    else if (company.length > 150) errors.company = "Le nom de l'entreprise est trop long (150 caractères au plus).";
  } else if (cleanText(body.company)) {
    errors.company = 'Laissez ce champ vide si vous cochez « Sans entreprise ».';
  }
  if (!need) errors.need = 'Décrivez votre besoin.';
  else if (need.length < 10) errors.need = 'Décrivez votre besoin en quelques mots de plus (10 caractères au moins).';
  else if (need.length > 3000) errors.need = 'Le besoin est trop long (3 000 caractères au plus).';
  if (body.confirmed !== true) errors.confirmed = 'Confirmez votre demande en cliquant sur « Envoyer ma demande ».';
  if (!IDEMPOTENCY_RE.test(idempotencyKey)) errors.form = 'Formulaire invalide. Rechargez la fenêtre et réessayez.';

  if (Object.keys(errors).length) {
    const err = new HttpError(422, 'invalid_fields', 'Certains champs sont à corriger.');
    err.fields = errors;
    throw err;
  }
  return { lastName, firstName, email, company, noCompany, need, idempotencyKey };
}

module.exports = { cleanText, validateChatMessage, validateContact };
