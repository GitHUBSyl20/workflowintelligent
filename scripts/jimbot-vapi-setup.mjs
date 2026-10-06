// Crée ou met à jour l'outil et l'assistant Vapi de JimBot à partir des
// fichiers versionnés (jimbot/vapi/*.json, jimbot/prompt-systeme.md).
//
//   node scripts/jimbot-vapi-setup.mjs --env .env.jimbot.local            (simulation)
//   node scripts/jimbot-vapi-setup.mjs --env .env.jimbot.local --apply    (écrit chez Vapi)
//
// Garde-fous :
// * ne modifie qu'un outil nommé « rechercher_connaissances_jimbot » et un
//   assistant dont le nom commence par « JimBot » : l'assistant du
//   démonstrateur « Menuiseries Démo » ne peut pas être touché ;
// * n'affiche jamais de clé ; le fichier --env doit rester hors du dépôt.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const envIndex = args.indexOf('--env');

if (envIndex >= 0) {
  const file = path.resolve(args[envIndex + 1] || '');
  for (const line of (await readFile(file, 'utf8')).split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const env = (k) => process.env[k] || '';
const required = ['VAPI_PRIVATE_KEY', 'JIMBOT_VAPI_TOOL_URL', 'JIMBOT_VAPI_CREDENTIAL_ID', 'JIMBOT_VAPI_MODEL_PROVIDER', 'JIMBOT_VAPI_MODEL'];
const absent = required.filter((k) => !env(k));
if (absent.length) {
  console.error(`Paramètres manquants : ${absent.join(', ')} (voir .env.example).`);
  process.exit(1);
}
if (!/^https:\/\/[^/]+\/api\/jimbot\/vapi-tool$/.test(env('JIMBOT_VAPI_TOOL_URL'))) {
  console.error('JIMBOT_VAPI_TOOL_URL doit être de la forme https://<domaine>/api/jimbot/vapi-tool');
  process.exit(1);
}

const API = (env('VAPI_API_URL') || 'https://api.vapi.ai').replace(/\/+$/, '');
async function vapi(method, p, body) {
  const res = await fetch(`${API}${p}`, {
    method,
    headers: { Authorization: `Bearer ${env('VAPI_PRIVATE_KEY')}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Vapi ${method} ${p} : HTTP ${res.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

function fill(template, values) {
  return JSON.parse(JSON.stringify(template), (k, v) =>
    typeof v === 'string' ? v.replace(/\{\{([A-Z_]+)\}\}/g, (_, name) => (name in values ? values[name] : `{{${name}}}`)) : v
  );
}

const prompt = await readFile(path.join(ROOT, 'jimbot', 'prompt-systeme.md'), 'utf8');
const toolTpl = JSON.parse(await readFile(path.join(ROOT, 'jimbot', 'vapi', 'tool.json'), 'utf8'));
const assistantTpl = JSON.parse(await readFile(path.join(ROOT, 'jimbot', 'vapi', 'assistant.json'), 'utf8'));

const tool = fill(toolTpl, {
  JIMBOT_VAPI_TOOL_URL: env('JIMBOT_VAPI_TOOL_URL'),
  JIMBOT_VAPI_CREDENTIAL_ID: env('JIMBOT_VAPI_CREDENTIAL_ID'),
});

let toolId = env('JIMBOT_VAPI_TOOL_ID');
if (toolId) {
  const existing = await vapi('GET', `/tool/${toolId}`);
  if (existing?.function?.name !== 'rechercher_connaissances_jimbot') {
    console.error("JIMBOT_VAPI_TOOL_ID ne désigne pas l'outil JimBot : arrêt.");
    process.exit(1);
  }
}

console.log(`Mode : ${APPLY ? 'APPLICATION' : 'simulation (ajoutez --apply pour écrire chez Vapi)'}`);
if (APPLY) {
  const { type, ...toolUpdate } = tool; // le type n'est pas modifiable
  const saved = toolId ? await vapi('PATCH', `/tool/${toolId}`, toolUpdate) : await vapi('POST', '/tool', tool);
  toolId = saved.id;
  console.log(`Outil ${env('JIMBOT_VAPI_TOOL_ID') ? 'mis à jour' : 'créé'} : JIMBOT_VAPI_TOOL_ID=${toolId}`);
} else {
  console.log(`Outil : ${toolId ? `mise à jour de ${toolId}` : 'création'} (${tool.function.name} -> ${tool.server.url})`);
  toolId = toolId || '<id créé>';
}

const assistant = fill(assistantTpl, {
  JIMBOT_VAPI_MODEL_PROVIDER: env('JIMBOT_VAPI_MODEL_PROVIDER'),
  JIMBOT_VAPI_MODEL: env('JIMBOT_VAPI_MODEL'),
  JIMBOT_VAPI_TOOL_ID: toolId,
  PROMPT_SYSTEME: prompt,
});

let assistantId = env('JIMBOT_VAPI_ASSISTANT_ID');
if (assistantId) {
  const existing = await vapi('GET', `/assistant/${assistantId}`);
  if (!String(existing?.name || '').startsWith('JimBot')) {
    console.error("JIMBOT_VAPI_ASSISTANT_ID ne désigne pas l'assistant JimBot (nom différent) : arrêt, rien n'est modifié.");
    process.exit(1);
  }
}
if (APPLY) {
  const saved = assistantId ? await vapi('PATCH', `/assistant/${assistantId}`, assistant) : await vapi('POST', '/assistant', assistant);
  console.log(`Assistant ${assistantId ? 'mis à jour' : 'créé'} : JIMBOT_VAPI_ASSISTANT_ID=${saved.id}`);
  console.log('Reportez ces identifiants dans les variables d’environnement Vercel (ils ne sont pas secrets).');
} else {
  console.log(`Assistant : ${assistantId ? `mise à jour de ${assistantId}` : 'création'} (« ${assistant.name} », ${assistant.model.provider}/${assistant.model.model}, prompt de ${prompt.length} caractères)`);
}
