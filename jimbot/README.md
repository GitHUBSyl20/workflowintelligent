# JimBot

Assistant IA textuel du site : présente le parcours de Sylvain Magana, aide à qualifier une demande, propose des pistes. Chat Vapi, connaissances et données dans Supabase, notification e-mail des demandes de contact, administration privée.

Ce dossier n'est pas déployé (`.vercelignore`).

| Livrable | Emplacement |
|---|---|
| Interface (bulle, fenêtre, formulaire) | `js/jimbot/jimbot.js`, `js/jimbot/jimbot-config.js` (libellés), `css/jimbot.css` (couleurs, dimensions) |
| Fonctions serveur Vercel | `api/jimbot/[action].js`, `api/jimbot/admin/[action].js`, `api/jimbot/cron/purge.js`, code partagé `api/_jimbot/` |
| Administration privée | `admin-jimbot/` → `/admin-jimbot/` |
| Migration et règles d'accès | `supabase/migrations/20261006120000_jimbot_init.sql` |
| Prompt système | `jimbot/prompt-systeme.md` |
| Configuration Vapi (outil, assistant) | `jimbot/vapi/*.json`, `scripts/jimbot-vapi-setup.mjs` |
| Variables d'environnement | `.env.example` |
| Guide de configuration | `jimbot/docs/GUIDE-CONFIGURATION.md` |
| Contrat des documents | `jimbot/docs/CONTRAT-DOCUMENTS.md` |
| Conservation des données | `jimbot/docs/CONSERVATION-DONNEES.md` |
| Compte rendu des tests | `jimbot/docs/COMPTE-RENDU-TESTS.md` |
| Tests, serveur local, vérification réelle | `tests/jimbot/`, `scripts/jimbot-dev-server.mjs`, `scripts/jimbot-smoke.mjs`, doublures `jimbot/dev/` |

Commandes :

```bash
npm run test:jimbot
```

```bash
npm run jimbot:local
```

Pour désactiver la bulle sans retirer le code : `enabled: false` dans `js/jimbot/jimbot-config.js`.
