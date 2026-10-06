'use strict';
const { getContext } = require('./context');
const { sendJson, sendError } = require('./http');
const { log } = require('./log');

function actionFrom(req) {
  if (req.query && typeof req.query.action === 'string') return req.query.action;
  const path = new URL(req.url || '/', 'http://localhost').pathname;
  return path.split('/').filter(Boolean).pop() || '';
}

function createRouter(routes) {
  return async function handler(req, res) {
    const action = actionFrom(req);
    const route = Object.prototype.hasOwnProperty.call(routes, action) ? routes[action] : null;
    if (!route) return sendJson(res, 404, { error: 'not_found', message: 'Ressource introuvable.' });
    let ctx;
    try {
      ctx = await getContext();
      await route(ctx, req, res);
    } catch (err) {
      sendError(res, err, (ctx && ctx.log) || log);
    }
  };
}

module.exports = { createRouter };
