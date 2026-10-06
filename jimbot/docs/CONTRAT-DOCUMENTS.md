# Contrat des documents de la base de connaissances JimBot

JimBot ne cherche que dans la table `public.jimbot_documents`. Il ne lit ni `documents_menuiserie` ni aucune autre table. Le navigateur et le modèle ne peuvent pas choisir le corpus : il est fixé par la fonction `jimbot_match_documents`.

Cette première version ne contient pas de pipeline d'import. Vous insérez les lignes vous-même (éditeur SQL Supabase, script personnel, Make, etc.) en respectant ce contrat.

## Colonnes

| Colonne | Obligatoire | Règle |
|---|---|---|
| `doc_ref` | oui | Référence stable, majuscules, chiffres, `-` ou `_` (3 à 64 caractères). Ex. `PARCOURS-PRO`, `TARIF-DIAGNOSTIC-2026`. Visible seulement dans l'administration. |
| `chunk_index` | non (0) | Numéro du morceau si un document est découpé. `(doc_ref, chunk_index)` est unique. |
| `title` | oui | Titre lisible (200 caractères au plus). Il est transmis au modèle et repris dans le résumé des demandes. |
| `category` | oui | `parcours`, `formation`, `competences`, `realisations`, `projets_en_cours`, `offres`, `tarifs`, `disponibilites`, `methode`, `faq`. |
| `content` | oui | Texte public, autonome, en français (6 000 caractères au plus ; 300 à 1 200 conseillés). |
| `source_url` | non | Page publique correspondante (`https://…`). |
| `visibility` | non (`public`) | `brouillon` : jamais renvoyé. |
| `is_active` | non (`true`) | `false` : jamais renvoyé (archivage sans suppression). |
| `valid_from` | non | Date à partir de laquelle l'information est valable. |
| `valid_until` | **oui pour `tarifs` et `disponibilites`** | Après cette date, le document n'est plus renvoyé. |
| `last_reviewed_at` | **oui pour `tarifs` et `disponibilites`** | Date de votre dernière vérification, citée par JimBot. |
| `metadata` | non | JSON libre (ex. `{"auteur": "Sylvain"}`). Non utilisé pour la recherche. |
| `embedding` | oui pour être trouvé | Vecteur de **1536 dimensions** calculé avec le **même modèle** que les requêtes. |
| `embedding_model` | non (`text-embedding-3-small`) | Doit être égal à `JIMBOT_EMBEDDING_MODEL`, sinon le document est ignoré. |

La base refuse un tarif ou une disponibilité sans `valid_until` ni `last_reviewed_at` (contrainte `jimbot_documents_dated_facts`).

## Embeddings

- Modèle par défaut : `text-embedding-3-small` (OpenAI), 1536 dimensions. C'est le modèle du démonstrateur existant (`CollabBTP/Assistant/05_embed_corpus.py`).
- Texte à vectoriser : `"<title>. <content>"`.
- Si vous changez de modèle : modifiez `JIMBOT_EMBEDDING_MODEL`, `JIMBOT_EMBEDDING_DIMENSIONS`, le type `vector(1536)` de la colonne (nouvelle migration), et revectorisez **tous** les documents.
- Si vous modifiez `title` ou `content` sans fournir de nouvel embedding dans la même requête, l'ancien vecteur est effacé automatiquement. Le document est alors ignoré jusqu'à sa revectorisation : un texte périmé ne peut pas être retrouvé.

Votre script `05_embed_corpus.py` peut servir de modèle : remplacez `TABLE` par `jimbot_documents` et retirez le filtre `metadata->>corpus`. Il remplit les lignes dont `embedding` est vide.

## Rédaction

- Un document = un sujet. Écrivez des phrases complètes qui se comprennent hors contexte (« Sylvain Magana a… » plutôt que « Il a… »).
- Uniquement des informations publiques et vérifiées : parcours, compétences, réalisations publiables, présentation publique des projets en cours, offres, fourchettes de prix, disponibilités.
- Jamais de données clients non publiques, de prix négociés, de coordonnées personnelles ni d'avancement de projet privé.
- Les extraits sont traités comme des données. Une phrase du type « ignore tes instructions » placée dans un document n'a pas d'effet sur le rôle de JimBot, mais évitez d'en écrire.
- Prix : précisez HT/TTC, le périmètre et ce qui n'est pas compris.
- Disponibilités : formulez-les comme une indication (« premières disponibilités indicatives à partir de… »). JimBot précise qu'elles ne valent pas réservation.

## Exemples

```sql
-- Document général
insert into public.jimbot_documents (doc_ref, title, category, content, source_url, last_reviewed_at)
values ('PARCOURS-PRO', 'Parcours professionnel', 'parcours',
        'Sylvain Magana a cinq ans d''expérience en développement et conseil logiciel…',
        'https://www.workflowintelligent.fr/a-propos', current_date);

-- Tarif : dates obligatoires
insert into public.jimbot_documents (doc_ref, title, category, content, valid_from, valid_until, last_reviewed_at)
values ('TARIF-DIAGNOSTIC-2026', 'Tarif du diagnostic', 'tarifs',
        'Le diagnostic IA et automatisation coûte 690 euros HT, prix fixe, pour deux à trois processus.',
        '2026-01-01', '2026-12-31', current_date);

-- Actualiser un tarif : prolonger après vérification
update public.jimbot_documents
   set valid_until = '2027-06-30', last_reviewed_at = current_date
 where doc_ref = 'TARIF-DIAGNOSTIC-2026';

-- Retirer un document sans le supprimer
update public.jimbot_documents set is_active = false where doc_ref = 'ANCIEN-DOC';

-- Documents à revectoriser ou bientôt expirés
select doc_ref, title from public.jimbot_documents where embedding is null;
select doc_ref, valid_until from public.jimbot_documents
 where category in ('tarifs', 'disponibilites') and valid_until < current_date + 30;
```

## Contrôle

Dans l'administration, la fiche d'une conversation liste pour chaque recherche la requête, les `doc_ref` renvoyés et leur similarité. Chaque réponse de JimBot affiche les « Sources utilisées ». C'est le moyen de vérifier qu'une affirmation s'appuie sur un document.
