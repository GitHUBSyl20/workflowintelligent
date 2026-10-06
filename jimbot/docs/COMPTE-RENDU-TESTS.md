# Compte rendu des tests JimBot (6 octobre 2026)

Environnement : Windows 11, Node 24.18, branche `feature/jimbot`. Aucun accès à Vapi, Supabase, OpenAI, Vercel ni à la messagerie Gandi n'était disponible : aucun service réel n'a été appelé.

## 1. Tests réellement exécutés

### Tests automatisés : 37/37 réussis (`npm run test:jimbot`)

Ils s'exécutent sur la **vraie migration SQL**, appliquée à un Postgres local (PGlite 0.5.8 + pgvector), avec les rôles `anon`, `authenticated` et `service_role` recréés comme dans Supabase. Vapi, l'e-mail, Supabase Auth et les embeddings sont **simulés** (voir limites).

| Parcours demandé | Test | Résultat |
|---|---|---|
| Question sur le parcours, réponse étayée | réponse construite à partir d'un extrait ; références `PARCOURS-*` enregistrées sur le message ; référence absente du texte visiteur | réussi |
| Information absente → contact | « pas cette information » + proposition d'être recontacté | réussi |
| Tarif / disponibilité non renseignés | disponibilité absente → aucune invention ; tarif périmé et brouillon jamais renvoyés ; tarif sans dates refusé par la base | réussi |
| Tarif renseigné | renvoyé avec « valable jusqu'au… vérifié le… », résultat sur une ligne | réussi |
| Continuité | 2ᵉ message envoyé à Vapi avec `previousChatId` du 1ᵉʳ ; historique de 4 messages | réussi |
| Invention / divulgation | demande de révéler les instructions → refus ; réponse contenant le marqueur du prompt → remplacée côté serveur | réussi (simulateur) |
| Outil Vapi | secret obligatoire (401 sinon) ; arguments `table` / `corpus` ignorés | réussi |
| Contact avec entreprise | 201, lien conversation, résumé, trace de la demande explicite, e-mail avec Reply-To et lien admin, sans la conversation | réussi |
| Contact sans entreprise | `company` vide, `no_company` vrai, sans conversation | réussi |
| Validation des champs | 6 erreurs de champ ; entreprise + « Sans entreprise » refusés ensemble ; rien d'enregistré | réussi |
| Doublons | 2 envois simultanés + rejeu + même contenu avec nouvelle clé → 1 seule ligne, 1 seul e-mail | réussi |
| Mention d'e-mail dans le chat | aucune demande créée | réussi |
| Échec de notification | demande enregistrée, statut « échec » + code ; relance admin → « envoyée » ; 2ᵉ relance refusée (409) | réussi |
| Accès à une autre conversation | historique vide pour un autre visiteur, avec l'ID interne en cookie, avec un faux jeton, en paramètre d'URL ; jeton stocké haché | réussi |
| Accès à l'administration | 401 sans session, pour un compte Auth valide absent de `jimbot_admins`, avec un mauvais mot de passe, avec un cookie visiteur | réussi |
| Droits en base | `anon` et `authenticated` : permission refusée sur tables et fonctions | réussi |
| Suppression après expiration | lignes antidatées de 200 jours purgées ; données récentes conservées ; mise à jour sans prolongation ; chat Vapi supprimé ; purge refusée sans secret ; exécution journalisée | réussi |
| Robustesse | double envoi d'un même message ; Vapi en délai dépassé (504) puis reprise ; message trop long (400) ; limite de fréquence (429 + Retry-After) ; origine étrangère ou absente (403) ; document modifié sans nouvel embedding ignoré | réussi |
| Adaptateurs réels contre un faux serveur HTTP | requêtes Vapi (`POST /chat`, `DELETE /chat/{id}`), Supabase REST (clés `sb_secret_` et JWT), Supabase Auth, OpenAI (dimensions vérifiées), SMTP injoignable, échappement HTML de l'e-mail | réussi |

Autres vérifications exécutées :

- migration rejouée deux fois sans erreur ; table `documents_menuiserie` simulée intacte ;
- recherche d'éventuels secrets dans le diff et de `console.*` hors du journal filtré : rien trouvé.

### Vérifications dans le navigateur (serveur local `npm run jimbot:local`, doublures)

- Bulle présente sur les pages, sans erreur console ; ouverture au clavier (Entrée), focus dans le champ, envoi par Entrée, réponse affichée.
- Session conservée d'une page à l'autre, historique rechargé ; cookie de session et cookies d'administration illisibles en JavaScript (HttpOnly).
- Formulaire : focus sur le titre à l'ouverture, besoin prérempli à partir des messages et modifiable, « Sans entreprise » désactive le champ, erreurs serveur affichées par champ avec `aria-invalid`, confirmation affichée seulement après la réponse du serveur, focus rendu au champ de saisie.
- Affichage sûr : une réponse contenant `<img onerror>`, `<script>` et un lien `javascript:` s'affiche en texte ; aucun élément créé, aucun script exécuté ; gras et listes reconstruits.
- Mobile (émulation 375×812) : fenêtre plein écran, `aria-modal`, défilement de la page bloqué, focus maintenu dans la fenêtre (Maj+Tab boucle), Échap ferme et rend le focus à la bulle ; sur la page Formations, la bulle se place au-dessus du bouton collant ; pas de défilement horizontal.
- Administration : compte non autorisé refusé, administrateur connecté, liste, fiche (coordonnées, besoin, résumé, trace de la demande, échéance), changement de statut, conversation liée avec « Sources utilisées » et recherches.

Défaut trouvé et corrigé pendant ces essais : la zone de saisie pouvait prendre sa hauteur maximale après le formulaire (hauteur calculée pendant qu'elle était masquée).

## 2. Points observés non résolus

- **Perte de session non reproduite** : lors du tout premier essai dans le panneau navigateur, l'historique est revenu vide après un premier message (cookie non renvoyé). Tous les essais suivants (navigateur et `curl`) ont fonctionné, y compris d'une page à l'autre. Cause non identifiée ; à surveiller lors de la recette sur la prévisualisation.
- **Limite connue** : deux tout premiers messages envoyés simultanément, avant que le cookie existe, ouvrent deux conversations distinctes (chacune reste isolée). Le widget empêche ce double envoi.

## 3. Tests bloqués par des accès manquants

| Test | Bloqué par | Comment le lancer |
|---|---|---|
| Comportement réel du modèle : réponses étayées, refus d'inventer une réalisation, résistance à l'extraction du prompt, vouvoiement, une question à la fois | Vapi (clé, assistant), modèle | `node scripts/jimbot-smoke.mjs <url>` puis relecture |
| Appel effectif de l'outil par Vapi **en mode chat**, emplacement de l'identifiant de chat dans la charge utile | Vapi | idem ; vérifier dans l'admin que les « Sources utilisées » apparaissent |
| Migration dans le vrai projet Supabase, PostgREST, Supabase Auth (GoTrue), RLS avec les vrais rôles, index HNSW | Supabase | Guide §1, puis requête de contrôle `set role anon` |
| Compatibilité des embeddings avec vos documents (modèle, dimensions, seuil de similarité 0,3) | OpenAI + documents | Questions de recette ; ajuster `JIMBOT_MIN_SIMILARITY` |
| Envoi SMTP Gandi réel (authentification, délivrabilité) ou Resend | Messagerie | `jimbot-smoke.mjs --with-contact` |
| Routage Vercel des fonctions `[action].js`, en-têtes et CSP, variables, prévisualisation | Vercel (pas de CLI ni d'accès) | Pousser `feature/jimbot` |
| Exécution de la tâche planifiée Vercel Cron | Vercel production | `jimbot_purge_runs` après la première nuit |
| Suppression réelle des chats chez Vapi, mode ZDR | Vapi | Supprimer une conversation de test dans l'admin, vérifier dans le tableau de bord Vapi |
| Lecteurs d'écran (NVDA, VoiceOver) et vrais téléphones | Matériel | Recette manuelle |

Les tests exécutés valident le circuit serveur, la base, les protections et l'interface. Ils **ne valident pas** la qualité des réponses du vrai modèle : le simulateur Vapi reproduit le contrat d'API, pas le raisonnement.
