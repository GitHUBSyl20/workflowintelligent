# Conservation des données JimBot

Ce document décrit ce qui est mis en œuvre techniquement. Il ne constitue pas une analyse de conformité juridique (RGPD) : la base légale, le registre des traitements et le texte des mentions légales restent à valider par Sylvain.

## Règle appliquée dans Supabase

**Durée : six mois à partir de la création de chaque ligne.** Fonction unique : `jimbot_retention_interval()` (`interval '6 months'`).

| Données | Table | Point de départ | À l'échéance |
|---|---|---|---|
| Conversation (jeton haché, identifiants de chats Vapi) | `jimbot_conversations` | création de la conversation | supprimée, avec ses messages et recherches (cascade) |
| Message visiteur ou JimBot, références utilisées | `jimbot_messages` | création du message | supprimé (ou plus tôt, avec sa conversation) |
| Trace de recherche (requête, références) | `jimbot_retrievals` | création | supprimée (ou plus tôt, avec sa conversation) |
| Demande de contact (coordonnées, besoin, résumé, trace de la demande explicite, statut de notification) | `jimbot_contact_requests` | envoi de la demande | supprimée ; sa durée est indépendante de la conversation |
| Compteurs de limitation (empreinte d'IP) | `jimbot_rate_limits` | fenêtre | supprimés après 2 jours |
| File de suppression Vapi (identifiants de chats seulement) | `jimbot_vapi_deletions` | mise en file | supprimée après succès, abandonnée après 60 jours |
| Journal des purges (nombres uniquement) | `jimbot_purge_runs` | exécution | supprimé après 13 mois |

Garanties techniques :

- `expires_at` est calculé par un déclencheur à l'insertion ; un second déclencheur interdit toute modification de `created_at` et `expires_at`. Une consultation, un changement de statut ou une nouvelle activité ne prolongent rien.
- Une demande de contact survit à la suppression de sa conversation (lien remis à vide), puis expire selon sa propre date.

## Tâche planifiée vérifiable

- Vercel Cron (`vercel.json`) appelle `GET /api/jimbot/cron/purge` chaque jour vers 03 h 17 UTC avec `Authorization: Bearer $CRON_SECRET`. Les tâches Vercel Cron ne s'exécutent que sur le déploiement de **production**.
- Chaque exécution enregistre les nombres de lignes supprimées dans `jimbot_purge_runs` :

  ```sql
  select ran_at, trigger, counts from public.jimbot_purge_runs order by ran_at desc limit 10;
  ```
- Déclenchement manuel (vérification) :

  ```bash
  curl -H "Authorization: Bearer <CRON_SECRET>" https://www.workflowintelligent.fr/api/jimbot/cron/purge
  ```
- Prochaines échéances :

  ```sql
  select 'conversations' as t, min(expires_at) from public.jimbot_conversations
  union all select 'demandes', min(expires_at) from public.jimbot_contact_requests;
  ```

Si la tâche Vercel ne convient pas, l'extension `pg_cron` de Supabase peut appeler `select public.jimbot_purge_expired('pg_cron');` chaque jour. Elle ne supprime alors pas les copies Vapi (appel d'API nécessaire) : ces identifiants restent en file jusqu'au prochain appel de `/api/jimbot/cron/purge`.

## Données hors de Supabase : limites et actions manuelles

Une suppression dans Supabase **n'efface pas automatiquement** les copies ci-dessous.

| Prestataire | Ce qu'il reçoit | Ce qui est automatisé | Reste à faire / limite |
|---|---|---|---|
| **Vapi** | Chaque message, le prompt système, les extraits renvoyés par l'outil, la réponse. Copie conservée côté Vapi sous forme de « chats ». | À l'expiration (purge) et à la suppression d'une conversation dans l'administration, `DELETE /chat/{id}` est appelé pour chaque chat de la conversation (file avec reprises, 10 tentatives). | La documentation officielle consultée ne précise pas la durée de conservation des chats ni leur présence dans les journaux du tableau de bord. Le mode **Zero Data Retention** s'active seulement depuis le tableau de bord, au niveau de l'organisation (pas par API) ; la documentation ne dit pas s'il couvre le chat textuel. Il s'appliquerait aussi au démonstrateur « Menuiseries Démo » de la même organisation. À vérifier avec Vapi avant de l'activer. Les sauvegardes internes de Vapi ne sont pas maîtrisées. |
| **Fournisseur du modèle** (choisi dans l'assistant Vapi, ex. OpenAI) | Les mêmes contenus, via Vapi. | Rien (pas d'API exposée par Vapi pour cela). | Politique de conservation du fournisseur, à vérifier selon le modèle choisi et la clé utilisée (clé de Vapi ou la vôtre). |
| **OpenAI (embeddings)** | La requête de recherche formulée par le modèle (300 caractères au plus), pas la conversation. | Rien. | Conservation selon la politique API d'OpenAI (conservation temporaire pour la détection d'abus, d'après ses conditions publiées ; à vérifier). |
| **Supabase** | Toutes les tables JimBot. | Purge quotidienne. | Les **sauvegardes** (quotidiennes ou PITR selon le plan) conservent les lignes supprimées jusqu'à leur rotation. Les journaux d'API ne contiennent pas les corps des requêtes RPC par défaut. |
| **Vercel** | Requêtes HTTP. | Les journaux applicatifs JimBot ne contiennent ni messages, ni coordonnées, ni secrets (liste blanche de champs dans `api/_jimbot/log.js`). | Durée de rétention des journaux selon le plan Vercel. Les erreurs de plateforme peuvent contenir des URL (sans contenu de message). |
| **Messagerie Gandi** (ou Resend) | L'e-mail de notification : coordonnées, besoin, résumé, lien. Pas la conversation. | Rien. | **Les e-mails reçus restent dans la boîte** au-delà de six mois. Action manuelle : supprimer ou archiver hors ligne les notifications de plus de six mois (un filtre « [JimBot] » dans l'objet facilite le tri). Avec Resend, le contenu des e-mails reste aussi visible dans son tableau de bord pendant sa propre durée de conservation. |

## Information du visiteur

La fenêtre de chat affiche : « Vos échanges sont enregistrés et conservés six mois au plus, puis supprimés automatiquement. Évitez d'y indiquer des données sensibles. » avec un lien vers `/mentions-legales#jimbot`. Le formulaire « Être recontacté » précise que les informations sont transmises à Sylvain Magana.

Point d'attention : la section « IV. Données personnelles » des mentions légales indique une durée de **3 ans** pour les demandes de contact du site. Le paragraphe JimBot ajouté précise six mois pour les échanges et demandes faits via JimBot. Vérifiez que les deux durées correspondent bien à votre intention.
