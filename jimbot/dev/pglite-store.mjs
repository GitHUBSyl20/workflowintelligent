// Base Postgres locale (PGlite + pgvector) qui exécute la vraie migration
// JimBot. Sert aux tests et au serveur de développement local.
// Expose la même interface que le client Supabase serveur : rpc(nom, args).
// Jamais utilisé sur Vercel.
import { PGlite } from '@electric-sql/pglite';
import { vector } from '@electric-sql/pglite-pgvector';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Rôles et schéma auth tels qu'ils existent dans un projet Supabase
const SUPABASE_STUB = `
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
    if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
  end $$;
  create schema if not exists auth;
  create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text);
  grant usage on schema public to anon, authenticated, service_role;
  -- Comportement par défaut de Supabase : droits larges accordés aux rôles
  -- d'API sur les nouveaux objets. La migration doit les retirer elle-même.
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`;

export async function createLocalStore({ seed = true } = {}) {
  const db = new PGlite({ extensions: { vector } });
  await db.exec(SUPABASE_STUB);
  const dir = path.join(ROOT, 'supabase', 'migrations');
  for (const file of (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort()) {
    await db.exec(await readFile(path.join(dir, file), 'utf8'));
  }
  if (seed) {
    await db.exec(await readFile(path.join(ROOT, 'jimbot', 'dev', 'seed-local.sql'), 'utf8'));
    const embedder = require('./mock-embeddings.cjs');
    const { rows } = await db.query('select id, title, content from public.jimbot_documents where embedding is null');
    for (const row of rows) {
      const v = await embedder.embed(`${row.title}. ${row.content}`);
      await db.query('update public.jimbot_documents set embedding = $1::vector where id = $2', [JSON.stringify(v), row.id]);
    }
  }

  // Appelle une fonction comme PostgREST le ferait avec la clé service_role
  async function rpc(name, args = {}) {
    if (!/^jimbot_[a-z_]+$/.test(name)) throw new Error('Nom de fonction invalide');
    const keys = Object.keys(args);
    const params = keys.map((k) => {
      const v = args[k];
      if (v !== null && typeof v === 'object') return JSON.stringify(v);
      return v === undefined ? null : v;
    });
    const named = keys.map((k, i) => `${k} => $${i + 1}`).join(', ');
    await db.exec('set role service_role');
    try {
      const res = await db.query(`select public.${name}(${named}) as r`, params);
      return res.rows[0] ? res.rows[0].r : null;
    } finally {
      await db.exec('reset role');
    }
  }

  return { db, rpc, close: () => db.close() };
}
