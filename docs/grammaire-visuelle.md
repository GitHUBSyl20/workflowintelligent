# Grammaire visuelle — pages commerciales

Relevée le 29/09/2026 sur `index.html`, `formations-ia.html` et `solutions-ia-entreprise.html` (mesures DOM à 1440, 768 et 390 px).
Pour harmoniser une autre page, réutiliser les classes ci-dessous. N'inventer ni couleur ni effet.

## Feuilles de style

| Feuille | Chargée par | Rôle |
|---|---|---|
| `shared.css`, `responsive-overrides.css`, `clean-shared.css`, `footer.css` | toutes | base Webflow, navigation, pied de page |
| `refonte-2026.css` | Accueil, Solutions, Offres, À propos, Produits | bibliothèque de composants, copiés à l'identique de `formations-ia.css` |
| `formations-ia.css` | Formation seulement | contient des règles globales (`a { text-decoration: none }`, `body { padding-bottom }` en mobile) : **ne pas la lier ailleurs** |
| `portfolio-accordion.css` | pages à accordéon | accordéon FAQ / démonstrateurs |
| `solutions-ia-entreprise.css` | Solutions seulement | largeurs de la page Formations, bandeau |

## Fondamentaux

- **Police** : Lato (300 à 900), corps 16 px, interligne 1,6, texte #222.
- **Couleurs** : orange #FF4B1F (accent, puces, liserés), orange foncé #d63c13 (libellés, texte du bouton blanc), bleu nuit #192a56 (prix, métas, liseré secondaire), gris de fond #f8f9fa, bordure #e6e6e6, filet interne #eee, textes secondaires #444 / #555 / #666.
- **Titres** : H1 48 px, graisse 400, blanc sur orange. H2 `.h2-heading` 34 px, graisse 400, #0a0a0a. H3 de carte 1,05 à 1,2 rem, graisse 700. Sur mobile : H1 31 px, H2 22 px.
- **Arrondis** : 12 px pour les cartes et les bandeaux de chiffres, 10 px pour les encadrés, 8 px pour les boutons, 999 px pour les pastilles.
- **Ombres** : `0 2px 8px rgba(0,0,0,.05–.06)` sur les cartes ; `0 2px 10px rgba(0,0,0,.06)` sur les offres.

## Structure de page

1. **Navigation** `.main-navbar` : collante, 59 px de haut, fond blanc, logo à gauche, liens puis bouton orange `.nav-cta` « Demander un diagnostic ». Le lien de la page courante reçoit `.active` et `aria-current="page"` (`js/main.js`, qui compare sans l'extension `.html`).
2. **Bandeau** `header.section.accent-primary-section` + grille `.hero-no-visual` (une colonne, bloc centré, texte aligné à gauche). Ordre : `h1.h1-heading`, `.hero-subtitle` (24 px, graisse 600), `.hero-lede` (1,1 rem, 48rem max), `ul.hero-facts` (pastilles), `.hero-actions` (bouton sombre translucide, puis bouton blanc `.secondary-button-on-accent-primary`, 48 px de haut). Marges internes : 16 px en haut, 40 px en bas (`.formation-hero` / `.solutions-hero`). L'accueil centre le texte avec `.hero-centered`.
3. **Sections** `section.section` : 24 px de marge verticale, conteneur de 1296 px. Les fonds alternent blanc et gris (#f8f9fa, via `.methode-section`, `.tools-section` ou `.security-section`). Deux sections blanches consécutives au plus, sauf en fin de page (FAQ puis CTA).
4. **En-tête de section** `.section-head` : centré, H2 + chapeau à 1,05 rem en #444. Largeur 46rem sur Formation et Solutions, 42rem sur l'accueil. Aligné à gauche en mobile.
5. **CTA final** `.final-cta-section > .final-cta-block` : centré, 44rem, un bouton, puis `.final-cta-note` / `.final-cta-secondary` si besoin.
6. **Pied de page** `footer.footer.inverse-footer` : fond noir, colonnes Navigation / Ressources / Contact + LinkedIn. Même balisage sur toutes les pages.

## Composants

| Besoin | Classes | Aspect |
|---|---|---|
| Chiffres de preuve | `section.proof-section` + `ul.proof-band` (`.proof-band-2`) | fond gris, liseré gauche orange, 4 colonnes (2 en tablette, 1 en mobile), chiffre bleu nuit |
| Références, familles d'offres | `.case-grid` (3 col.) / `.case-grid-2` + `article.case-card` | carte blanche, liseré haut orange 4 px, `.case-context` (surtitre orange en capitales), pied `.case-meta` ou `.offer-meta` collé en bas |
| Listes thématiques, exemples | `.skills-grid` + `article.skill-card` | carte blanche sans liseré, H3 souligné d'un trait orange de 2 px. Dans Solutions : `dl.example-facts`, avec `dt` en libellé capitales #d63c13 |
| Étapes numérotées | `ol.method-steps-4` (ou `.method-steps` sur Formation), variante `.method-steps-3` | cartes blanches sur fond gris, pastille ronde orange numérotée |
| Offre / tarif | `.offer-grid` (`-1`, `-3`) + `article.offer-card` (`.offer-card-featured`) | liseré haut bleu nuit (orange si mise en avant), `.offer-price`, `.offer-meta` |
| Liste à puces mise en valeur | `ul.marked-list` | encadré blanc, puces rondes orange |
| Encadré de texte | `.highlight-block` (liseré orange) · `.case-inline` (liseré bleu nuit) | fond gris, arrondi 10 px |
| Phrase de transition, lien | `p.bridge-note`, `p.formats-note` | centrée, 0,95 rem, #555, lien orange graisse 600 |
| Bouton centré | `div.cta-centered > a.button.w-button` | pleine largeur en mobile |
| FAQ, démonstrateurs | `section.portfolio-section > .container.small-container > .accordion > .accordion-item > button.accordion-trigger` | bordure orange 2 px, en-tête orange quand il est ouvert ; `aria-expanded`, animation et réduction des animations gérées par `js/main.js` |
| Badge | `span.demo-badge` | pastille bleu nuit en capitales |
| Statut de mission | `p.case-status` (réalisé, plein) / `.case-status-ongoing` (en cours, contour), au-dessus du H3 d'une `.case-card` | valeurs de `.demo-badge` ; défini dans `solutions-ia-entreprise.css` |

## Réactif

- ≤ 1024 px : les grilles de 3 ou 4 colonnes passent à 2 colonnes.
- ≤ 767 px : une colonne ; bandeau centré ; boutons en pleine largeur (24rem max) ; `.section-head` et notes alignés à gauche ; marges internes des cartes à 1,25 rem ; pastilles du bandeau centrées et autorisées à passer à la ligne.
- `responsive-overrides.css` impose `p { margin: .3em !important }` en mobile.

## Règles de travail

- Nouveau composant partagé : le recopier valeur pour valeur dans `refonte-2026.css`, sans règle globale, et vérifier qu'aucune page qui charge cette feuille n'emploie déjà la classe.
- Écart propre à une page : feuille de page chargée après `refonte-2026.css` (modèle : `solutions-ia-entreprise.css`). Pas de style inline.
- Ancres sous la navigation collante : `scroll-margin-top: 80px`.
