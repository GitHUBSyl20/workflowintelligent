# Démonstrateurs — mis de côté pour la version salon

Le 29/09/2026, la section « Démonstrateurs IA » a été retirée de `solutions-ia-entreprise.html`. Les démonstrateurs ne sont pas tous prêts et leur fonctionnement doit encore être éprouvé. La page ne contient ni emplacement vide, ni annonce « bientôt disponible », ni lien vers eux.

Ce dossier n'est pas publié : `docs` figure dans `.vercelignore`.

## Ce qui est conservé

| Élément | Emplacement |
|---|---|
| Section d'origine, à l'identique (2 accordéons, textes, bouton, lien de test, bloc vidéo commenté, renvoi vers « Projets & créations ») | `docs/demonstrateurs/section-demonstrateurs-2026-09.html` |
| Styles des démonstrateurs : `.demo-badge`, `.demo-disclaimer`, `.demo-claim`, `.demo-video` | `css/refonte-2026.css` (feuille partagée, inchangée) |
| Accordéon sur fond gris : `.methode-section .accordion-item` | `css/solutions-ia-entreprise.css` |
| Comportement des accordéons (`aria-expanded`, animation) | `js/main.js`, sélecteur `.portfolio-section .accordion .accordion-trigger` (sert aussi à la FAQ) |

Démonstrateurs concernés :

1. **Assistant commercial documentaire** — données fictives (Menuiseries Démo). Pas d'accès libre : présenté en direct lors d'un échange. Une vidéo verticale est prévue (voir plus bas).
2. **Assistant de premier niveau, disponible hors horaires** — démonstration animalerie, testable en ligne (`https://moncompagnon-joyeux-animaux.vercel.app/`).
3. Un troisième démonstrateur est envisagé.

## Orientation pour la réintégration

Ne pas remettre la section telle quelle. Chaque démonstrateur devient une **carte synthétique visible**, sans accordéon principal.

Contenu d'une carte :

- **Titre** formulé comme une tâche ou un bénéfice (« Répondre à partir de vos documents, sources citées »), pas comme un nom de produit.
- **Courte description** : deux ou trois lignes.
- **Statut** « Démonstrateur » (`.demo-badge`) et **nature des données** (« Données fictives », « Données de démonstration »), avec `.demo-disclaimer`.
- **Mode d'accès** écrit en clair : « Accès libre en ligne », « Vidéo de 90 s », « Présenté en direct lors d'un échange ».
- **Un seul bouton principal**, adapté au mode d'accès :
  - « Tester » : lien vers le démonstrateur en ligne ;
  - « Voir la vidéo » : lance la vidéo ;
  - « Demander une démonstration » : `/contact-devis#contact-form` (demande générale, sans `?demande=Audit%20IA`).
- **Optionnel** : un accordéon secondaire « Fonctionnement et limites » (ce que fait l'assistant, où s'arrête son périmètre, scénario). Réutiliser le balisage `.accordion` existant.

Règles d'interaction :

- Le bouton principal ne sert jamais à ouvrir le détail explicatif ; c'est le rôle de l'accordéon secondaire.
- La carte entière n'est pas cliquable dès qu'elle contient plus d'une action (bouton + accordéon).
- Pas de carte vide, pas de « bientôt disponible », pas de lien vers un démonstrateur non prêt : une carte n'apparaît que quand son mode d'accès fonctionne.
- Composants à reprendre : `.case-grid` + `article.case-card` (voir `docs/grammaire-visuelle.md`). Statut près du titre, comme les cartes « Missions réalisées et projets en cours » (`.case-status`).
- Placement suggéré : après « Missions réalisées et projets en cours », dans une section distincte, pour ne pas mêler démonstrateurs et missions clients.

## Vidéo (assistant documentaire)

- Afficher d'abord un **aperçu** : image fixe (`poster`, WebP léger) avec un bouton de lecture explicite.
- **Lecture déclenchée par l'utilisateur** uniquement : pas d'`autoplay`, pas de chargement lourd au départ (`preload="none"`, ou aucun lecteur chargé avant le clic).
- Le choix du lecteur attendra la vidéo et son hébergement. Le bloc commenté dans l'archive propose un `<video>` auto-hébergé. Une iframe YouTube dépose des traceurs tiers avant le consentement géré par la modale cookies du site : si elle est retenue, ne la charger qu'au clic.
- Format prévu dans l'archive : vertical 9:16, muet, moins de 90 s ; styles `.demo-video` déjà présents.
