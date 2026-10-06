'use strict';
// Journal technique : une ligne JSON par événement, sans contenu de message,
// sans coordonnées et sans secret. Seuls les champs listés ici sont acceptés.
const ALLOWED_FIELDS = new Set([
  'action', 'status', 'duration_ms', 'error', 'provider', 'attempt', 'count',
  'results', 'created', 'notification_status', 'reason', 'deleted', 'failed',
]);

function write(level, event, fields) {
  const line = { level, event, at: new Date().toISOString() };
  for (const [k, v] of Object.entries(fields || {})) {
    if (!ALLOWED_FIELDS.has(k)) continue;
    line[k] = typeof v === 'string' ? v.slice(0, 120) : v;
  }
  const out = JSON.stringify(line);
  if (level === 'error') console.error(out);
  else console.log(out);
}

const log = {
  info: (event, fields) => write('info', event, fields),
  warn: (event, fields) => write('warn', event, fields),
  error: (event, fields) => write('error', event, fields),
};

module.exports = { log, ALLOWED_FIELDS };
