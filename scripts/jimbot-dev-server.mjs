// Serveur LOCAL de vérification de JimBot : sert le site statique et les
// fonctions /api/jimbot/* avec les doublures locales (base PGlite, Vapi
// simulé, e-mail simulé). Usage : npm run jimbot:local  ->  http://localhost:3002
// Aucune clé réelle n'est utilisée. Pour tester avec les vrais services,
// utiliser une prévisualisation Vercel (voir jimbot/docs/GUIDE-CONFIGURATION.md).
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 3002);

// Variables locales de test
for (const line of (await readFile(path.join(ROOT, 'jimbot', 'dev', 'local.env'), 'utf8')).split(/\r?\n/)) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}
process.env.JIMBOT_SITE_URL = `http://localhost:${PORT}`;
process.chdir(ROOT);

const publicRouter = require(path.join(ROOT, 'api', 'jimbot', '[action].js'));
const adminRouter = require(path.join(ROOT, 'api', 'jimbot', 'admin', '[action].js'));
const purge = require(path.join(ROOT, 'api', 'jimbot', 'cron', 'purge.js'));
const vercel = JSON.parse(await readFile(path.join(ROOT, 'vercel.json'), 'utf8'));

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
};
// Dossiers exclus du déploiement (.vercelignore) : jamais servis.
const BLOCKED = /^\/(api|jimbot|supabase|scripts|tests|node_modules|docs|backup_webflow|\.)/;

async function serveStatic(req, res, pathname) {
  let p = decodeURIComponent(pathname);
  const rewrite = (vercel.rewrites || []).find((r) => r.source === p);
  if (rewrite) p = rewrite.destination;
  if (p.endsWith('/')) p += 'index.html';
  if (BLOCKED.test(p)) return notFound(res);
  let file = path.join(ROOT, path.normalize(p));
  if (!file.startsWith(ROOT)) return notFound(res);
  try {
    if (!(await stat(file)).isFile()) throw new Error();
  } catch {
    try {
      file += '.html';
      await stat(file);
    } catch {
      return notFound(res);
    }
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(await readFile(file));
}

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404');
}

http
  .createServer(async (req, res) => {
    const { pathname } = new URL(req.url, `http://localhost:${PORT}`);
    try {
      if (pathname === '/api/jimbot/cron/purge') return await purge(req, res);
      let m = /^\/api\/jimbot\/admin\/([a-z-]+)$/.exec(pathname);
      if (m) return await adminRouter(Object.assign(req, { query: { action: m[1] } }), res);
      m = /^\/api\/jimbot\/([a-z-]+)$/.exec(pathname);
      if (m) return await publicRouter(Object.assign(req, { query: { action: m[1] } }), res);
      if (pathname.startsWith('/api/')) return notFound(res);
      return await serveStatic(req, res, pathname);
    } catch (err) {
      console.error(err);
      res.statusCode = 500;
      res.end();
    }
  })
  .listen(PORT, () => {
    console.log(`JimBot local (doublures) : http://localhost:${PORT}/`);
    console.log(`Administration locale : http://localhost:${PORT}/admin-jimbot/ (identifiants de test : jimbot/dev/local.env)`);
  });
