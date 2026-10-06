'use strict';
// Routes publiques de JimBot :
//   POST /api/jimbot/chat           message du visiteur -> réponse
//   GET  /api/jimbot/history        historique de la conversation en cours
//   POST /api/jimbot/reset          nouvelle conversation
//   GET  /api/jimbot/contact-draft  préremplissage du besoin
//   POST /api/jimbot/contact        demande explicite d'être recontacté
//   POST /api/jimbot/vapi-tool      outil de recherche appelé par Vapi (authentifié)
const { createRouter } = require('../_jimbot/router');
const { routes } = require('../_jimbot/handlers/public');

module.exports = createRouter(routes);
