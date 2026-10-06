-- =====================================================================
-- JimBot : schéma initial (migration non destructive)
--
-- * Ne modifie, ne renomme et ne supprime aucun objet existant
--   (en particulier documents_menuiserie et match_documents_menuiserie,
--   utilisés par le démonstrateur « Menuiseries Démo »).
-- * Tous les objets JimBot sont préfixés « jimbot_ » dans le schéma public.
-- * RLS activé partout, aucune politique : anon et authenticated n'ont
--   aucun accès direct. Les fonctions serveur Vercel passent par la clé
--   service_role et uniquement par les fonctions ci-dessous.
-- * Conservation : 6 mois à partir de la création de chaque ligne
--   (jimbot_retention_interval), sans prolongation lors d'une mise à jour.
-- =====================================================================

create extension if not exists vector;

-- ---------------------------------------------------------------------
-- Durée de conservation (règle unique, documentée dans
-- jimbot/docs/CONSERVATION-DONNEES.md)
-- ---------------------------------------------------------------------
create or replace function public.jimbot_retention_interval()
returns interval
language sql
immutable
as $$ select interval '6 months' $$;

-- Fixe created_at (jamais dans le futur) et calcule expires_at à l'insertion.
create or replace function public.jimbot_set_expiry()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.created_at := least(coalesce(new.created_at, now()), now());
  new.expires_at := new.created_at + public.jimbot_retention_interval();
  return new;
end;
$$;

-- Interdit toute modification de created_at / expires_at après insertion :
-- une consultation ou une mise à jour administrative ne prolonge rien.
create or replace function public.jimbot_freeze_expiry()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.created_at := old.created_at;
  new.expires_at := old.expires_at;
  return new;
end;
$$;

create or replace function public.jimbot_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Base de connaissances (alimentée manuellement par Sylvain)
-- Contrat : jimbot/docs/CONTRAT-DOCUMENTS.md
-- ---------------------------------------------------------------------
create table if not exists public.jimbot_documents (
  id               bigint generated always as identity primary key,
  doc_ref          text not null check (doc_ref ~ '^[A-Z0-9][A-Z0-9_-]{2,63}$'),
  chunk_index      integer not null default 0 check (chunk_index >= 0),
  title            text not null check (char_length(title) between 1 and 200),
  category         text not null check (category in (
                     'parcours', 'formation', 'competences', 'realisations',
                     'projets_en_cours', 'offres', 'tarifs', 'disponibilites',
                     'methode', 'faq')),
  content          text not null check (char_length(content) between 1 and 6000),
  source_url       text check (source_url is null or source_url ~ '^https://'),
  visibility       text not null default 'public' check (visibility in ('public', 'brouillon')),
  is_active        boolean not null default true,
  valid_from       date,
  valid_until      date,
  last_reviewed_at date,
  metadata         jsonb not null default '{}'::jsonb,
  embedding        vector(1536),
  embedding_model  text not null default 'text-embedding-3-small',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint jimbot_documents_ref_chunk_key unique (doc_ref, chunk_index),
  constraint jimbot_documents_validity_order check (
    valid_from is null or valid_until is null or valid_from <= valid_until),
  -- Un tarif ou une disponibilité doit porter une date de fin de validité
  -- et une date de dernière vérification : sinon il n'est jamais renvoyé.
  constraint jimbot_documents_dated_facts check (
    category not in ('tarifs', 'disponibilites')
    or (valid_until is not null and last_reviewed_at is not null))
);

create index if not exists jimbot_documents_embedding_idx
  on public.jimbot_documents using hnsw (embedding vector_cosine_ops);

drop trigger if exists jimbot_documents_touch on public.jimbot_documents;
create trigger jimbot_documents_touch
  before update on public.jimbot_documents
  for each row execute function public.jimbot_touch_updated_at();

-- Texte modifié sans nouvel embedding : l'ancien vecteur est effacé pour
-- qu'un contenu périmé ne soit jamais retrouvé (document ignoré tant
-- qu'il n'est pas revectorisé).
create or replace function public.jimbot_documents_stale_embedding()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (new.content is distinct from old.content or new.title is distinct from old.title)
     and new.embedding is not distinct from old.embedding then
    new.embedding := null;
  end if;
  return new;
end;
$$;

drop trigger if exists jimbot_documents_stale on public.jimbot_documents;
create trigger jimbot_documents_stale
  before update on public.jimbot_documents
  for each row execute function public.jimbot_documents_stale_embedding();

-- ---------------------------------------------------------------------
-- Conversations anonymes
-- Le navigateur ne connaît qu'un jeton opaque (cookie HttpOnly) ; seule
-- son empreinte SHA-256 est stockée. L'identifiant interne n'est jamais
-- envoyé au navigateur.
-- ---------------------------------------------------------------------
create table if not exists public.jimbot_conversations (
  id                  uuid primary key default gen_random_uuid(),
  session_token_hash  text not null unique check (session_token_hash ~ '^[0-9a-f]{64}$'),
  status              text not null default 'active' check (status in ('active', 'terminee')),
  vapi_last_chat_id   text,
  vapi_chat_ids       jsonb not null default '[]'::jsonb,
  message_count       integer not null default 0,
  locked_until        timestamptz,
  created_at          timestamptz not null default now(),
  last_activity_at    timestamptz not null default now(),
  expires_at          timestamptz not null
);

create index if not exists jimbot_conversations_expires_idx on public.jimbot_conversations (expires_at);
create index if not exists jimbot_conversations_created_idx on public.jimbot_conversations (created_at desc);

create table if not exists public.jimbot_messages (
  id                 bigint generated always as identity primary key,
  conversation_id    uuid not null references public.jimbot_conversations (id) on delete cascade,
  role               text not null check (role in ('user', 'assistant')),
  content            text not null check (char_length(content) <= 8000),
  client_message_id  text check (client_message_id is null or client_message_id ~ '^[A-Za-z0-9-]{8,64}$'),
  source_refs        jsonb not null default '[]'::jsonb,
  vapi_chat_id       text,
  created_at         timestamptz not null default now(),
  expires_at         timestamptz not null
);

create unique index if not exists jimbot_messages_client_id_key
  on public.jimbot_messages (conversation_id, client_message_id)
  where role = 'user' and client_message_id is not null;
create index if not exists jimbot_messages_conversation_idx on public.jimbot_messages (conversation_id, id);
create index if not exists jimbot_messages_expires_idx on public.jimbot_messages (expires_at);

-- Trace des recherches dans la base de connaissances (références utilisées)
create table if not exists public.jimbot_retrievals (
  id               bigint generated always as identity primary key,
  conversation_id  uuid references public.jimbot_conversations (id) on delete cascade,
  tool_call_id     text,
  vapi_chat_id     text,
  query            text not null check (char_length(query) <= 500),
  results          jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now(),
  expires_at       timestamptz not null
);

create index if not exists jimbot_retrievals_tool_call_idx on public.jimbot_retrievals (tool_call_id);
create index if not exists jimbot_retrievals_chat_idx on public.jimbot_retrievals (vapi_chat_id);
create index if not exists jimbot_retrievals_expires_idx on public.jimbot_retrievals (expires_at);

-- ---------------------------------------------------------------------
-- Demandes de contact explicites
-- ---------------------------------------------------------------------
create table if not exists public.jimbot_contact_requests (
  id                            uuid primary key default gen_random_uuid(),
  conversation_id               uuid references public.jimbot_conversations (id) on delete set null,
  idempotency_key               text not null unique check (idempotency_key ~ '^[A-Za-z0-9-]{16,64}$'),
  last_name                     text not null check (char_length(last_name) between 1 and 100),
  first_name                    text not null check (char_length(first_name) between 1 and 100),
  email                         text not null check (char_length(email) between 3 and 254),
  company                       text check (company is null or char_length(company) between 1 and 150),
  no_company                    boolean not null default false,
  need                          text not null check (char_length(need) between 10 and 3000),
  summary                       text check (summary is null or char_length(summary) <= 2000),
  explicit_request              jsonb not null,
  status                        text not null default 'nouvelle' check (status in ('nouvelle', 'a_traiter', 'traitee')),
  notification_status           text not null default 'en_attente'
                                  check (notification_status in ('en_attente', 'envoi_en_cours', 'envoyee', 'echec')),
  notification_attempts         integer not null default 0,
  notification_last_error       text,
  notification_last_attempt_at  timestamptz,
  notification_sent_at          timestamptz,
  notification_message_id       text,
  notification_locked_until     timestamptz,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now(),
  expires_at                    timestamptz not null,
  constraint jimbot_contact_company_choice check (
    (no_company and company is null) or (not no_company and company is not null))
);

create index if not exists jimbot_contact_requests_created_idx on public.jimbot_contact_requests (created_at desc);
create index if not exists jimbot_contact_requests_expires_idx on public.jimbot_contact_requests (expires_at);
create index if not exists jimbot_contact_requests_conversation_idx on public.jimbot_contact_requests (conversation_id);

-- ---------------------------------------------------------------------
-- Limitation de fréquence (compatible serverless : compteur partagé)
-- ---------------------------------------------------------------------
create table if not exists public.jimbot_rate_limits (
  bucket        text not null check (char_length(bucket) <= 200),
  window_start  timestamptz not null,
  hits          integer not null default 0,
  primary key (bucket, window_start)
);

-- ---------------------------------------------------------------------
-- Administrateurs explicitement autorisés (aucune inscription publique)
-- Ajout manuel : voir jimbot/docs/GUIDE-CONFIGURATION.md
-- ---------------------------------------------------------------------
create table if not exists public.jimbot_admins (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- File de suppression des copies Vapi (chats) et journal des purges
-- ---------------------------------------------------------------------
create table if not exists public.jimbot_vapi_deletions (
  vapi_chat_id  text primary key,
  reason        text not null check (reason in ('expiration', 'suppression_admin')),
  attempts      integer not null default 0,
  last_error    text,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null
);

create table if not exists public.jimbot_purge_runs (
  id          bigint generated always as identity primary key,
  ran_at      timestamptz not null default now(),
  trigger     text not null,
  counts      jsonb not null
);

-- ---------------------------------------------------------------------
-- Déclencheurs d'expiration
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['jimbot_conversations', 'jimbot_messages', 'jimbot_retrievals', 'jimbot_contact_requests']
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_set_expiry', t);
    execute format('create trigger %I before insert on public.%I for each row execute function public.jimbot_set_expiry()', t || '_set_expiry', t);
    execute format('drop trigger if exists %I on public.%I', t || '_freeze_expiry', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.jimbot_freeze_expiry()', t || '_freeze_expiry', t);
  end loop;
end;
$$;

-- La file Vapi garde sa propre limite (60 jours) : au-delà, Vapi a déjà
-- supprimé ses copies selon sa propre durée de conservation, ou l'échec
-- est documenté dans jimbot_purge_runs.
create or replace function public.jimbot_vapi_deletion_expiry()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.created_at := now();
  new.expires_at := now() + interval '60 days';
  return new;
end;
$$;

drop trigger if exists jimbot_vapi_deletions_expiry on public.jimbot_vapi_deletions;
create trigger jimbot_vapi_deletions_expiry
  before insert on public.jimbot_vapi_deletions
  for each row execute function public.jimbot_vapi_deletion_expiry();

drop trigger if exists jimbot_contact_requests_touch on public.jimbot_contact_requests;
create trigger jimbot_contact_requests_touch
  before update on public.jimbot_contact_requests
  for each row execute function public.jimbot_touch_updated_at();

-- ---------------------------------------------------------------------
-- RLS et droits minimaux
-- ---------------------------------------------------------------------
alter table public.jimbot_documents         enable row level security;
alter table public.jimbot_conversations     enable row level security;
alter table public.jimbot_messages          enable row level security;
alter table public.jimbot_retrievals        enable row level security;
alter table public.jimbot_contact_requests  enable row level security;
alter table public.jimbot_rate_limits       enable row level security;
alter table public.jimbot_admins            enable row level security;
alter table public.jimbot_vapi_deletions    enable row level security;
alter table public.jimbot_purge_runs        enable row level security;

revoke all on public.jimbot_documents, public.jimbot_conversations, public.jimbot_messages,
  public.jimbot_retrievals, public.jimbot_contact_requests, public.jimbot_rate_limits,
  public.jimbot_admins, public.jimbot_vapi_deletions, public.jimbot_purge_runs
  from public, anon, authenticated;

grant select, insert, update, delete on public.jimbot_documents, public.jimbot_conversations,
  public.jimbot_messages, public.jimbot_retrievals, public.jimbot_contact_requests,
  public.jimbot_rate_limits, public.jimbot_admins, public.jimbot_vapi_deletions,
  public.jimbot_purge_runs
  to service_role;

-- =====================================================================
-- Fonctions appelées par les fonctions serveur (service_role uniquement)
-- =====================================================================

-- Recherche vectorielle limitée au corpus JimBot public et valide.
create or replace function public.jimbot_match_documents(
  p_query_embedding text,
  p_match_count integer default 6,
  p_min_similarity double precision default 0.3,
  p_embedding_model text default 'text-embedding-3-small'
)
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  select coalesce(jsonb_agg(to_jsonb(s) order by s.similarity desc), '[]'::jsonb)
  from (
    select d.doc_ref, d.chunk_index, d.title, d.category, d.content, d.source_url,
           d.valid_until, d.last_reviewed_at,
           1 - (d.embedding <=> p_query_embedding::vector) as similarity
    from public.jimbot_documents d
    where d.is_active
      and d.visibility = 'public'
      and d.embedding is not null
      and d.embedding_model = p_embedding_model
      and (d.valid_from is null or d.valid_from <= current_date)
      and (d.valid_until is null or d.valid_until >= current_date)
    order by d.embedding <=> p_query_embedding::vector
    limit least(greatest(coalesce(p_match_count, 6), 1), 10)
  ) s
  where s.similarity >= coalesce(p_min_similarity, 0);
$$;

create or replace function public.jimbot_log_retrieval(
  p_tool_call_id text,
  p_vapi_chat_id text,
  p_query text,
  p_results jsonb
)
returns jsonb
language sql
set search_path = public
as $$
  insert into public.jimbot_retrievals (tool_call_id, vapi_chat_id, query, results)
  values (left(p_tool_call_id, 100), left(p_vapi_chat_id, 100), left(coalesce(p_query, ''), 500), coalesce(p_results, '[]'::jsonb))
  returning jsonb_build_object('id', id);
$$;

create or replace function public.jimbot_conversation_create(p_token_hash text)
returns jsonb
language sql
set search_path = public
as $$
  insert into public.jimbot_conversations (session_token_hash)
  values (p_token_hash)
  returning jsonb_build_object('id', id, 'vapi_last_chat_id', vapi_last_chat_id,
                               'message_count', message_count, 'created_at', created_at);
$$;

create or replace function public.jimbot_conversation_by_token(p_token_hash text)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object('id', c.id, 'vapi_last_chat_id', c.vapi_last_chat_id,
                            'message_count', c.message_count, 'created_at', c.created_at)
  from public.jimbot_conversations c
  where c.session_token_hash = p_token_hash
    and c.status = 'active'
    and c.expires_at > now();
$$;

create or replace function public.jimbot_conversation_lock(p_conversation_id uuid, p_seconds integer)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_ok boolean;
begin
  update public.jimbot_conversations
     set locked_until = now() + make_interval(secs => p_seconds)
   where id = p_conversation_id
     and (locked_until is null or locked_until < now())
  returning true into v_ok;
  return coalesce(v_ok, false);
end;
$$;

create or replace function public.jimbot_conversation_unlock(p_conversation_id uuid)
returns boolean
language sql
set search_path = public
as $$
  update public.jimbot_conversations set locked_until = null where id = p_conversation_id
  returning true;
$$;

create or replace function public.jimbot_conversation_end(p_conversation_id uuid)
returns boolean
language sql
set search_path = public
as $$
  update public.jimbot_conversations set status = 'terminee', locked_until = null
  where id = p_conversation_id
  returning true;
$$;

-- Rejeu d'un même message (double clic, requête rejouée) : renvoie la
-- réponse déjà enregistrée au lieu de relancer le modèle.
create or replace function public.jimbot_turn_lookup(p_conversation_id uuid, p_client_message_id text)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'found', true,
    'reply', (select a.content from public.jimbot_messages a
               where a.conversation_id = u.conversation_id and a.role = 'assistant' and a.id > u.id
               order by a.id limit 1))
  from public.jimbot_messages u
  where u.conversation_id = p_conversation_id
    and u.role = 'user'
    and u.client_message_id = p_client_message_id;
$$;

create or replace function public.jimbot_turn_save(
  p_conversation_id uuid,
  p_client_message_id text,
  p_user_content text,
  p_assistant_content text,
  p_vapi_chat_id text,
  p_tool_call_ids jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_refs jsonb;
begin
  -- Rattache les recherches effectuées pendant ce tour à la conversation
  update public.jimbot_retrievals r
     set conversation_id = p_conversation_id
   where r.conversation_id is null
     and ((r.tool_call_id is not null and r.tool_call_id in (select jsonb_array_elements_text(coalesce(p_tool_call_ids, '[]'::jsonb))))
          or (p_vapi_chat_id is not null and r.vapi_chat_id = p_vapi_chat_id));

  select coalesce(jsonb_agg(distinct x.ref), '[]'::jsonb) into v_refs
  from public.jimbot_retrievals r,
       lateral (select e ->> 'doc_ref' as ref from jsonb_array_elements(r.results) e) x
  where r.conversation_id = p_conversation_id
    and ((r.tool_call_id is not null and r.tool_call_id in (select jsonb_array_elements_text(coalesce(p_tool_call_ids, '[]'::jsonb))))
         or (p_vapi_chat_id is not null and r.vapi_chat_id = p_vapi_chat_id))
    and x.ref is not null;

  insert into public.jimbot_messages (conversation_id, role, content, client_message_id)
  values (p_conversation_id, 'user', p_user_content, p_client_message_id);

  insert into public.jimbot_messages (conversation_id, role, content, source_refs, vapi_chat_id)
  values (p_conversation_id, 'assistant', p_assistant_content, v_refs, p_vapi_chat_id);

  update public.jimbot_conversations
     set vapi_last_chat_id = coalesce(p_vapi_chat_id, vapi_last_chat_id),
         vapi_chat_ids = case
           when p_vapi_chat_id is null or vapi_chat_ids ? p_vapi_chat_id then vapi_chat_ids
           else vapi_chat_ids || jsonb_build_array(p_vapi_chat_id) end,
         message_count = message_count + 2,
         last_activity_at = now(),
         locked_until = null
   where id = p_conversation_id;

  return jsonb_build_object('source_refs', v_refs);
end;
$$;

create or replace function public.jimbot_messages_for_conversation(p_conversation_id uuid, p_limit integer default 100)
returns jsonb
language sql
stable
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('role', m.role, 'content', m.content, 'created_at', m.created_at) order by m.id), '[]'::jsonb)
  from (
    select * from public.jimbot_messages
    where conversation_id = p_conversation_id
    order by id desc
    limit least(greatest(coalesce(p_limit, 100), 1), 200)
  ) m;
$$;

-- Limitation de fréquence à fenêtre fixe
create or replace function public.jimbot_rate_limit_hit(p_bucket text, p_window_seconds integer, p_max integer)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_start timestamptz;
  v_hits integer;
begin
  v_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.jimbot_rate_limits as rl (bucket, window_start, hits)
  values (p_bucket, v_start, 1)
  on conflict (bucket, window_start) do update set hits = rl.hits + 1
  returning hits into v_hits;
  return jsonb_build_object(
    'allowed', v_hits <= p_max,
    'hits', v_hits,
    'retry_after', greatest(1, ceil(extract(epoch from (v_start + make_interval(secs => p_window_seconds) - now())))::integer));
end;
$$;

-- Création idempotente d'une demande de contact
create or replace function public.jimbot_contact_create(
  p_conversation_id uuid,
  p_idempotency_key text,
  p_last_name text,
  p_first_name text,
  p_email text,
  p_company text,
  p_no_company boolean,
  p_need text,
  p_summary text,
  p_explicit_request jsonb
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_row public.jimbot_contact_requests;
begin
  -- 1. Même clé d'idempotence : même demande (double clic, requête rejouée)
  select * into v_row from public.jimbot_contact_requests where idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('id', v_row.id, 'created', false, 'notification_status', v_row.notification_status);
  end if;

  -- 2. Même adresse et même besoin dans les 10 dernières minutes : doublon
  select * into v_row from public.jimbot_contact_requests
   where lower(email) = lower(p_email)
     and md5(need) = md5(p_need)
     and created_at > now() - interval '10 minutes'
   order by created_at desc
   limit 1;
  if found then
    return jsonb_build_object('id', v_row.id, 'created', false, 'notification_status', v_row.notification_status);
  end if;

  insert into public.jimbot_contact_requests (
    conversation_id, idempotency_key, last_name, first_name, email, company, no_company,
    need, summary, explicit_request)
  values (
    p_conversation_id, p_idempotency_key, p_last_name, p_first_name, p_email,
    case when p_no_company then null else p_company end, p_no_company,
    p_need, p_summary, p_explicit_request)
  on conflict (idempotency_key) do nothing
  returning * into v_row;

  if not found then
    select * into v_row from public.jimbot_contact_requests where idempotency_key = p_idempotency_key;
    return jsonb_build_object('id', v_row.id, 'created', false, 'notification_status', v_row.notification_status);
  end if;

  return jsonb_build_object('id', v_row.id, 'created', true, 'notification_status', v_row.notification_status);
end;
$$;

-- Réserve l'envoi d'une notification : une seule exécution à la fois,
-- jamais de nouvel envoi après un succès.
create or replace function public.jimbot_notification_claim(
  p_request_id uuid,
  p_lock_seconds integer,
  p_max_attempts integer,
  p_allow_retry boolean
)
returns jsonb
language sql
set search_path = public
as $$
  update public.jimbot_contact_requests r
     set notification_status = 'envoi_en_cours',
         notification_locked_until = now() + make_interval(secs => p_lock_seconds),
         notification_attempts = r.notification_attempts + 1,
         notification_last_attempt_at = now()
   where r.id = p_request_id
     and r.notification_attempts < p_max_attempts
     and (
       r.notification_status = 'en_attente'
       or (p_allow_retry and r.notification_status = 'echec')
       or (p_allow_retry and r.notification_status = 'envoi_en_cours' and r.notification_locked_until < now())
     )
  returning jsonb_build_object(
    'id', r.id, 'last_name', r.last_name, 'first_name', r.first_name, 'email', r.email,
    'company', r.company, 'no_company', r.no_company, 'need', r.need, 'summary', r.summary,
    'created_at', r.created_at, 'attempt', r.notification_attempts);
$$;

create or replace function public.jimbot_notification_finish(
  p_request_id uuid,
  p_success boolean,
  p_error text,
  p_message_id text
)
returns jsonb
language sql
set search_path = public
as $$
  update public.jimbot_contact_requests
     set notification_status = case when p_success then 'envoyee' else 'echec' end,
         notification_sent_at = case when p_success then now() else notification_sent_at end,
         notification_last_error = case when p_success then null else left(p_error, 500) end,
         notification_message_id = case when p_success then left(p_message_id, 300) else notification_message_id end,
         notification_locked_until = null
   where id = p_request_id
     and notification_status = 'envoi_en_cours'
  returning jsonb_build_object('id', id, 'notification_status', notification_status);
$$;

create or replace function public.jimbot_contact_draft(p_conversation_id uuid)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'user_messages', coalesce(jsonb_agg(m.content order by m.id), '[]'::jsonb),
    'message_count', (select message_count from public.jimbot_conversations where id = p_conversation_id))
  from (
    select id, content from public.jimbot_messages
    where conversation_id = p_conversation_id and role = 'user'
    order by id desc limit 3
  ) m;
$$;

-- Thèmes consultés (titres des documents) pour le résumé de la demande
create or replace function public.jimbot_conversation_topics(p_conversation_id uuid)
returns jsonb
language sql
stable
set search_path = public
as $$
  select coalesce(jsonb_agg(distinct e ->> 'title'), '[]'::jsonb)
  from public.jimbot_retrievals r, jsonb_array_elements(r.results) e
  where r.conversation_id = p_conversation_id and e ->> 'title' is not null;
$$;

-- ---------------------------------------------------------------------
-- Administration (appelées après vérification du jeton Supabase Auth
-- ET de l'appartenance à jimbot_admins, côté serveur)
-- ---------------------------------------------------------------------
create or replace function public.jimbot_is_admin(p_user_id uuid, p_email text)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from public.jimbot_admins a
    where a.user_id = p_user_id and lower(a.email) = lower(p_email));
$$;

create or replace function public.jimbot_admin_list_requests(
  p_search text,
  p_status text,
  p_notification_status text,
  p_limit integer,
  p_offset integer
)
returns jsonb
language sql
stable
set search_path = public
as $$
  with f as (
    select r.* from public.jimbot_contact_requests r
    where (p_status is null or r.status = p_status)
      and (p_notification_status is null or r.notification_status = p_notification_status)
      and (p_search is null or p_search = '' or
           position(lower(p_search) in lower(concat_ws(' ', r.last_name, r.first_name, r.email, r.company, r.need))) > 0)
  )
  select jsonb_build_object(
    'total', (select count(*) from f),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', x.id, 'last_name', x.last_name, 'first_name', x.first_name, 'email', x.email,
        'company', x.company, 'no_company', x.no_company, 'need_preview', left(x.need, 160),
        'status', x.status, 'notification_status', x.notification_status,
        'created_at', x.created_at, 'expires_at', x.expires_at) order by x.created_at desc)
      from (select * from f order by created_at desc
            limit least(greatest(coalesce(p_limit, 50), 1), 100) offset greatest(coalesce(p_offset, 0), 0)) x
    ), '[]'::jsonb));
$$;

create or replace function public.jimbot_admin_get_request(p_id uuid)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'request', to_jsonb(r) - 'idempotency_key' - 'notification_locked_until',
    'messages', case when r.conversation_id is null then '[]'::jsonb else (
      select coalesce(jsonb_agg(jsonb_build_object('role', m.role, 'content', m.content,
               'created_at', m.created_at, 'source_refs', m.source_refs) order by m.id), '[]'::jsonb)
      from public.jimbot_messages m where m.conversation_id = r.conversation_id) end)
  from public.jimbot_contact_requests r
  where r.id = p_id;
$$;

create or replace function public.jimbot_admin_set_status(p_id uuid, p_status text)
returns jsonb
language sql
set search_path = public
as $$
  update public.jimbot_contact_requests set status = p_status where id = p_id
  returning jsonb_build_object('id', id, 'status', status);
$$;

create or replace function public.jimbot_admin_delete_request(p_id uuid)
returns boolean
language sql
set search_path = public
as $$
  delete from public.jimbot_contact_requests where id = p_id returning true;
$$;

create or replace function public.jimbot_admin_list_conversations(p_limit integer, p_offset integer)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'total', (select count(*) from public.jimbot_conversations),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'status', c.status, 'message_count', c.message_count,
        'created_at', c.created_at, 'last_activity_at', c.last_activity_at, 'expires_at', c.expires_at,
        'request_count', (select count(*) from public.jimbot_contact_requests r where r.conversation_id = c.id),
        'preview', (select left(m.content, 140) from public.jimbot_messages m
                    where m.conversation_id = c.id and m.role = 'user' order by m.id limit 1)
      ) order by c.created_at desc)
      from (select * from public.jimbot_conversations order by created_at desc
            limit least(greatest(coalesce(p_limit, 50), 1), 100) offset greatest(coalesce(p_offset, 0), 0)) c
    ), '[]'::jsonb));
$$;

create or replace function public.jimbot_admin_get_conversation(p_id uuid)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'conversation', jsonb_build_object('id', c.id, 'status', c.status, 'message_count', c.message_count,
                      'created_at', c.created_at, 'last_activity_at', c.last_activity_at, 'expires_at', c.expires_at),
    'messages', (select coalesce(jsonb_agg(jsonb_build_object('role', m.role, 'content', m.content,
                   'created_at', m.created_at, 'source_refs', m.source_refs) order by m.id), '[]'::jsonb)
                 from public.jimbot_messages m where m.conversation_id = c.id),
    'retrievals', (select coalesce(jsonb_agg(jsonb_build_object('query', r.query, 'results', r.results,
                     'created_at', r.created_at) order by r.id), '[]'::jsonb)
                   from public.jimbot_retrievals r where r.conversation_id = c.id),
    'requests', (select coalesce(jsonb_agg(jsonb_build_object('id', q.id, 'status', q.status,
                   'created_at', q.created_at)), '[]'::jsonb)
                 from public.jimbot_contact_requests q where q.conversation_id = c.id))
  from public.jimbot_conversations c
  where c.id = p_id;
$$;

-- Suppression d'une conversation : messages et recherches en cascade,
-- demandes liées conservées (lien remis à null), copies Vapi mises en file.
create or replace function public.jimbot_admin_delete_conversation(p_id uuid)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_ids jsonb;
begin
  select vapi_chat_ids into v_ids from public.jimbot_conversations where id = p_id;
  if not found then
    return false;
  end if;
  insert into public.jimbot_vapi_deletions (vapi_chat_id, reason)
  select x, 'suppression_admin' from jsonb_array_elements_text(v_ids) x
  on conflict (vapi_chat_id) do nothing;
  delete from public.jimbot_conversations where id = p_id;
  return true;
end;
$$;

-- ---------------------------------------------------------------------
-- Purge des données expirées (appelée chaque jour par Vercel Cron)
-- ---------------------------------------------------------------------
create or replace function public.jimbot_vapi_deletions_pending(p_limit integer)
returns jsonb
language sql
stable
set search_path = public
as $$
  select coalesce(jsonb_agg(d.vapi_chat_id), '[]'::jsonb)
  from (select vapi_chat_id from public.jimbot_vapi_deletions
        where attempts < 10 order by created_at limit least(greatest(coalesce(p_limit, 50), 1), 200)) d;
$$;

create or replace function public.jimbot_vapi_deletion_result(p_vapi_chat_id text, p_success boolean, p_error text)
returns boolean
language plpgsql
set search_path = public
as $$
begin
  if p_success then
    delete from public.jimbot_vapi_deletions where vapi_chat_id = p_vapi_chat_id;
  else
    update public.jimbot_vapi_deletions
       set attempts = attempts + 1, last_error = left(p_error, 300)
     where vapi_chat_id = p_vapi_chat_id;
  end if;
  return true;
end;
$$;

create or replace function public.jimbot_purge_expired(p_trigger text, p_extra jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_messages integer;
  v_retrievals integer;
  v_requests integer;
  v_conversations integer;
  v_rate integer;
  v_vapi_queued integer;
  v_vapi_abandoned integer;
  v_counts jsonb;
begin
  -- Copies Vapi des conversations expirées : mises en file avant suppression
  insert into public.jimbot_vapi_deletions (vapi_chat_id, reason)
  select x, 'expiration'
  from public.jimbot_conversations c, jsonb_array_elements_text(c.vapi_chat_ids) x
  where c.expires_at <= now()
  on conflict (vapi_chat_id) do nothing;
  get diagnostics v_vapi_queued = row_count;

  delete from public.jimbot_messages where expires_at <= now();
  get diagnostics v_messages = row_count;
  delete from public.jimbot_retrievals where expires_at <= now();
  get diagnostics v_retrievals = row_count;
  delete from public.jimbot_contact_requests where expires_at <= now();
  get diagnostics v_requests = row_count;
  delete from public.jimbot_conversations where expires_at <= now();
  get diagnostics v_conversations = row_count;
  delete from public.jimbot_rate_limits where window_start < now() - interval '2 days';
  get diagnostics v_rate = row_count;
  delete from public.jimbot_vapi_deletions where expires_at <= now();
  get diagnostics v_vapi_abandoned = row_count;
  delete from public.jimbot_purge_runs where ran_at < now() - interval '13 months';

  v_counts := jsonb_build_object(
    'messages', v_messages, 'retrievals', v_retrievals, 'contact_requests', v_requests,
    'conversations', v_conversations, 'rate_limits', v_rate,
    'vapi_chats_queued', v_vapi_queued, 'vapi_deletions_abandoned', v_vapi_abandoned) || coalesce(p_extra, '{}'::jsonb);

  insert into public.jimbot_purge_runs (trigger, counts) values (left(coalesce(p_trigger, 'inconnu'), 40), v_counts);
  return v_counts;
end;
$$;

-- ---------------------------------------------------------------------
-- Droits d'exécution : service_role uniquement
-- (Supabase accorde par défaut EXECUTE à anon et authenticated)
-- ---------------------------------------------------------------------
do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'jimbot\_%'
  loop
    execute format('revoke all on function %s from public', f.sig);
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('revoke all on function %s from anon', f.sig);
    end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute format('revoke all on function %s from authenticated', f.sig);
    end if;
    execute format('grant execute on function %s to service_role', f.sig);
  end loop;
end;
$$;
