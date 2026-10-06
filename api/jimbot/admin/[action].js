'use strict';
// Routes de l'administration privée (/admin-jimbot/).
// Authentification et droits vérifiés à chaque appel : voir handlers/admin.js.
const { createRouter } = require('../../_jimbot/router');
const { routes } = require('../../_jimbot/handlers/admin');

module.exports = createRouter(routes);
