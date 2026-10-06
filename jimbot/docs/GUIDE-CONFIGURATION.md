# Guide de configuration de JimBot

Ordre conseillé : Supabase → OpenAI → Vapi → e-mail → Vercel (prévisualisation) → vérification → production.
Aucun secret ne doit être collé dans une conversation, un ticket ou le dépôt. Les valeurs se saisissent directement dans les tableaux de bord.

## Architecture

```
Navigateur (bulle JimBot, js/jimbot/)
  │  cookie de session HttpOnly (jeton opaque, jamais l'identifiant de conversation)
  ▼
Vercel  /api/jimbot/chat ───────────► Vapi  POST /chat  (assistantId + previousChatId)
        │                                   │ appelle l'outil « rechercher_connaissances_jimbot »
        │                                   ▼
        │                         /api/jimbot/vapi-tool  (Bearer secret)
        │                                   │ embedding de la requête (OpenAI)
        │                                   ▼
        └──────────── Supabase : jimbot_match_documents (corpus JimBot imposé)
                       tables jimbot_* (RLS, accès service_role via fonctions)
/api/jimbot/contact ─► enregistrement ─► notification SMTP Gandi (ou Resend)
/api/jimbot/admin/* ─► Supabase Auth + liste blanche + table jimbot_admins
/api/jimbot/cron/purge ─► purge quotidienne + suppression des chats Vapi
```

Le contexte de conversation est maintenu par le chaînage `previousChatId` documenté par Vapi ([session management](https://docs.vapi.ai/chat/session-management)). Le serveur garde la correspondance « conversation locale → dernier chat Vapi » dans `jimbot_conversations.vapi_last_chat_id`. Les sessions Vapi (`sessionId`) n'ont pas été retenues : elles expirent par défaut après 24 h et empêchent de préciser l'assistant à chaque requête.

## 1. Supabase

**Projet.** La migration fonctionne dans le projet du démonstrateur comme dans un projet dédié. Elle ne touche pas `documents_menuiserie` ni `match_documents_menuiserie`. Mais la clé `service_role` donnée à Vercel ouvre tout le projet : un **projet dédié** isole mieux JimBot (une fuite de clé n'exposerait pas le démonstrateur). Le plan gratuit autorise deux projets actifs.

1. **Appliquer la migration** : SQL Editor → coller `supabase/migrations/20261006120000_jimbot_init.sql` → Run. Ou, avec la CLI : `supabase link` puis `supabase db push`. La migration est rejouable sans perte de données.
2. **Fermer les inscriptions** : Authentication → Sign In / Providers → désactiver « Allow new users to sign up ». Même ouvertes, elles ne donneraient aucun droit (liste blanche et table `jimbot_admins`), mais il est inutile de les laisser.
3. **Créer le compte administrateur** : Authentication → Users → Add user → e-mail + mot de passe robuste, « Auto Confirm User ». Activer la MFA si votre plan le permet.
4. **Autoriser ce compte** (SQL Editor) :

   ```sql
   insert into public.jimbot_admins (user_id, email)
   select id, email from auth.users where email = 'votre-adresse@workflowintelligent.fr';
   ```
5. **Récupérer** (Project Settings → API Keys) : URL du projet, clé publique (`anon` ou `sb_publishable_…`), clé secrète (`service_role` ou `sb_secret_…`).
6. **Alimenter la base** selon `jimbot/docs/CONTRAT-DOCUMENTS.md`.

Contrôle des droits (doit renvoyer une erreur « permission denied ») :

```sql
set role anon; select * from public.jimbot_contact_requests; reset role;
```

## 2. OpenAI (embeddings des requêtes)

Le modèle doit être celui des documents : `text-embedding-3-small`, 1536 dimensions, comme le démonstrateur existant.

- Créez une clé de projet dédiée, restreinte si possible au seul point d'accès des embeddings, et fixez une limite de dépense mensuelle.
- Variable : `OPENAI_API_KEY`.

## 3. Vapi

Rien n'est modifié sur l'assistant du démonstrateur. Le script refuse de mettre à jour un assistant dont le nom ne commence pas par « JimBot ».

1. **Secret de l'outil** : générez une chaîne aléatoire (ex. `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` dans votre terminal). Elle servira deux fois : credential Vapi et `JIMBOT_VAPI_TOOL_SECRET` dans Vercel.
2. **Credential Vapi** : tableau de bord → Credentials (ou Integrations → Custom Credential) → type **Bearer Token**, en-tête `Authorization`, préfixe « Bearer » activé, jeton = le secret ci-dessus. Notez l'identifiant de la credential ([documentation](https://docs.vapi.ai/server-url/server-authentication)).
3. **Modèle** : choisissez dans Vapi un modèle disponible (fournisseur + nom) et reportez-les dans `JIMBOT_VAPI_MODEL_PROVIDER` / `JIMBOT_VAPI_MODEL`. Une température basse (0,2, déjà réglée) limite les écarts.
4. **Créer l'outil et l'assistant** depuis votre poste. Créez un fichier `.env.jimbot.local` à la racine (ignoré par Git) avec `VAPI_PRIVATE_KEY`, `JIMBOT_VAPI_TOOL_URL`, `JIMBOT_VAPI_CREDENTIAL_ID`, `JIMBOT_VAPI_MODEL_PROVIDER`, `JIMBOT_VAPI_MODEL`, puis :

   ```bash
   node scripts/jimbot-vapi-setup.mjs --env .env.jimbot.local
   ```

   ```bash
   node scripts/jimbot-vapi-setup.mjs --env .env.jimbot.local --apply
   ```
   Le script affiche `JIMBOT_VAPI_TOOL_ID` et `JIMBOT_VAPI_ASSISTANT_ID`. Ajoutez-les au fichier pour les mises à jour suivantes (après chaque modification de `jimbot/prompt-systeme.md`).
5. **Préproduction** : créez un second couple outil/assistant (fichier `.env.jimbot.preview`, `JIMBOT_VAPI_TOOL_URL` pointant vers la prévisualisation). Ainsi l'assistant de production ne dépend jamais d'un déploiement de test.
6. N'associez aucun numéro de téléphone à cet assistant. Seule l'API de chat textuel est appelée ; aucun appel, micro, synthèse vocale ni transcription n'est utilisé.
7. Ne changez pas l'URL serveur au niveau de l'organisation (elle peut servir au démonstrateur).

Le format des appels d'outil (`message.type = "tool-calls"`, `toolCallList`, réponse `{"results":[{"toolCallId","result"}]}` sur une ligne) suit la [documentation des outils personnalisés](https://docs.vapi.ai/tools/custom-tools). La documentation du chat indique que l'assistant garde ses outils en mode texte, et le démonstrateur existant utilise déjà un outil en mode chat. La recherche réelle en chat sera confirmée par `scripts/jimbot-smoke.mjs` (étape 6).

## 4. Notification par e-mail

### Option recommandée : SMTP de la messagerie Gandi

D'après la documentation Gandi : serveur `mail.gandi.net`, port 465 (SSL/TLS) ou 587 (STARTTLS), authentification par l'adresse complète et le mot de passe de la boîte ([réglages](https://docs.gandi.net/en/gandimail/standard_email_settings/)). Limites : 200 messages/minute, 1 000/heure, 8 000/jour ; usage « standard », les envois de masse pouvant entraîner une suspension ([limites](https://docs.gandi.net/en/gandimail/limitations.html)).

Quelques notifications par jour adressées à votre propre boîte relèvent d'un usage normal. Aucun abonnement supplémentaire n'est nécessaire. Points d'attention :

- le mot de passe de la boîte est stocké dans Vercel : si votre offre le permet, utilisez une boîte dédiée à l'envoi plutôt que votre boîte principale ;
- l'expéditeur (`JIMBOT_MAIL_FROM`) doit être l'adresse de la boîte authentifiée (ou un alias de celle-ci), sinon le message peut être refusé ou classé en indésirable ;
- l'adresse du prospect est placée en `Reply-To`, jamais en expéditeur ;
- utilisez le port 465 (ou 587) : le port 25 est souvent bloqué en sortie par les hébergeurs de fonctions et n'est pas chiffré d'emblée.

Variables : `JIMBOT_MAIL_PROVIDER=smtp`, `JIMBOT_SMTP_HOST`, `JIMBOT_SMTP_PORT`, `JIMBOT_SMTP_USER`, `JIMBOT_SMTP_PASSWORD`, `JIMBOT_MAIL_FROM`, `JIMBOT_NOTIFY_TO`.

### Option de repli : Resend (adaptateur prêt)

Le site utilise déjà Resend pour l'envoi du programme PDF (`api/send-pdf-programme.js`). Pour JimBot : vérifiez le domaine `workflowintelligent.fr` dans Resend (enregistrements DNS chez Gandi), puis `JIMBOT_MAIL_PROVIDER=resend`, `RESEND_API_KEY`, `JIMBOT_MAIL_FROM` (adresse du domaine vérifié), `JIMBOT_NOTIFY_TO`. Restez dans l'offre gratuite ; ne souscrivez rien sans le décider.

### En cas d'échec

La demande est toujours enregistrée avant l'envoi. En cas d'échec, l'administration affiche « Échec » avec le code d'erreur et un bouton « Relancer l'envoi » (5 tentatives au plus). Une notification déjà envoyée ne peut pas être renvoyée. Cas limite : si l'envoi réussit mais que l'enregistrement du succès échoue, l'état reste « Envoi en cours » ; une relance manuelle après 2 minutes peut alors produire un doublon.

## 5. Vercel

1. **Variables** (Settings → Environment Variables), à partir de `.env.example`. Cochez « Sensitive » pour toutes les valeurs marquées SECRET. Renseignez séparément Preview et Production si vous utilisez une préproduction Vapi.
2. **Prévisualisation** : poussez la branche `feature/jimbot`. L'intégration Git de Vercel construit une prévisualisation sans toucher la production. Dans l'environnement Preview :
   - `JIMBOT_ALLOWED_ORIGINS` = l'URL de branche (`https://<projet>-git-feature-jimbot-<équipe>.vercel.app`) ;
   - `JIMBOT_SITE_URL` = la même URL ;
   - si la prévisualisation est protégée (Deployment Protection), Vapi ne pourra pas joindre l'outil. Activez « Protection Bypass for Automation » et utilisez pour l'assistant de préproduction une URL d'outil comportant `?x-vercel-protection-bypass=<valeur>` (ce paramètre est alors visible dans la configuration Vapi : réservez-le à la préproduction).
3. **Tâche planifiée** : déclarée dans `vercel.json`, active seulement en production. Définissez `CRON_SECRET` : Vercel l'envoie automatiquement.
4. **Fonctions** : 3 fonctions JimBot (`api/jimbot/[action].js`, `api/jimbot/admin/[action].js`, `api/jimbot/cron/purge.js`) en plus de `api/send-pdf-programme.js`. Le code partagé `api/_jimbot/` n'est pas déployé comme fonction. Les dossiers `jimbot/`, `supabase/`, `scripts/`, `tests/` sont exclus du déploiement (`.vercelignore`).
5. **Administration** : `https://<domaine>/admin-jimbot/` (en-têtes `noindex`, CSP stricte, pas de cache).

## 6. Vérification

En local, sans aucune clé (base PGlite, Vapi et e-mail simulés) :

```bash
npm install
```

```bash
npm run test:jimbot
```

```bash
npm run jimbot:local
```

Puis ouvrir `http://localhost:3002/` (identifiants d'administration de test : `jimbot/dev/local.env`).

Sur la prévisualisation configurée :

```bash
node scripts/jimbot-smoke.mjs https://<url-de-la-previsualisation>
```

Ajoutez `--with-contact` pour créer une vraie demande de test (envoie un e-mail), puis supprimez-la dans l'administration. Relisez les réponses affichées : le script vérifie des signaux simples, pas la qualité.

## 7. Paramètres restant à renseigner

| Paramètre | Où le trouver / le créer |
|---|---|
| Choix du projet Supabase (dédié ou démonstrateur) | Décision |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys |
| Migration appliquée, inscriptions fermées, compte admin créé et inséré dans `jimbot_admins` | Supabase (étapes 1.1 à 1.4) |
| Documents JimBot vectorisés | Vous (contrat des documents) |
| `OPENAI_API_KEY` | OpenAI → API keys |
| `VAPI_PRIVATE_KEY` | Vapi → API Keys (privée) |
| `JIMBOT_VAPI_TOOL_SECRET` + credential Bearer Vapi (`JIMBOT_VAPI_CREDENTIAL_ID`) | Généré par vous, saisi dans Vapi et Vercel |
| `JIMBOT_VAPI_MODEL_PROVIDER`, `JIMBOT_VAPI_MODEL` | Liste des modèles Vapi |
| `JIMBOT_VAPI_ASSISTANT_ID` (et `JIMBOT_VAPI_TOOL_ID`) | Sortie de `scripts/jimbot-vapi-setup.mjs --apply` |
| `JIMBOT_SMTP_USER`, `JIMBOT_SMTP_PASSWORD`, `JIMBOT_MAIL_FROM`, `JIMBOT_NOTIFY_TO` | Boîte Gandi |
| `JIMBOT_ADMIN_EMAILS` | Votre adresse d'administrateur |
| `JIMBOT_HASH_SALT`, `CRON_SECRET` | Chaînes aléatoires générées par vous |
| `JIMBOT_ALLOWED_ORIGINS`, `JIMBOT_SITE_URL` (Preview et Production) | URL du site / de la prévisualisation |
| Relecture du paragraphe JimBot des mentions légales | `mentions-legales.html#jimbot` |
| Décision sur le mode Zero Data Retention de Vapi | Voir `CONSERVATION-DONNEES.md` |
