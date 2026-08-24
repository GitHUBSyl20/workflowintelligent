# Reprise — Refonte de la page « Formations IA »

Dernière mise à jour : 24 août 2026
Page concernée : `formations-ia.html` → https://workflowintelligent.fr/formations-ia

---

## 1. Ce qui a été fait

### Repositionnement
La page ne vend plus « une formation ChatGPT / prompting » mais **des formations-action construites à partir du travail réel des équipes**, pour des TPE/PME de Lyon et d'Auvergne-Rhône-Alpes.

- Cible : dirigeants, responsables de service, responsables formation/RH, managers, équipes métier.
- Le ciblage **étudiants** a été entièrement retiré.
- Les organismes de formation ne sont plus qu'une mention courte (FAQ).

### Ordre des sections (conforme au brief)
1. Hero
2. Preuves d'expérience
3. Exemples de formations réalisées (`#references`)
4. Formation-action / méthode (`#methode`)
5. Compétences travaillées (`#competences`)
6. Environnements IA (badges outils)
7. Formats et tarifs (`#formats`)
8. Pourquoi 10 participants maximum
9. Sécurité / fiabilité
10. FAQ (`#faq`)
11. CTA final

### Concision
Texte visible réduit de **33,6 %** (2 140 → 1 421 mots hors nav/footer/head), mesuré contre la version d'origine (`git show HEAD:formations-ia.html`).

### Véracité (contraintes respectées)
Aucun nom de client, logo, témoignage, citation, taux de satisfaction, ROI ni gain de temps chiffré. Toutes les références sont **anonymisées**.

Données factuelles utilisées, et elles seules :
- 37 personnes formées en 2026
- groupes de 1 à 25 participants (**expérience passée uniquement**)
- **10 participants maximum aujourd'hui** (capacité commerciale actuelle)
- présentiel et distanciel
- formats 3h30 / 4h / journée / parcours 3 jours
- tarifs **590 € HT** et **1 090 € HT**

La page **n'affirme pas** que la formation rend l'entreprise « conforme à l'AI Act ».

### Supprimé (imposé par le brief)
- anciens tarifs 400 / 750 / 1 050 €
- opposition « programme fixe vs sur mesure »
- ciblage étudiants
- limite « 15 participants »
- plan d'adoption 30 jours et suivi J+30 / J+60

---

## 2. Fichiers modifiés

| Fichier | Nature |
|---|---|
| `formations-ia.html` | Réécriture complète (808 → ~640 lignes) |
| `css/formations-ia.css` | Réécriture complète (~850 lignes, 15 sections numérotées) |
| `contact-devis.html` | Options `format` (3h30 / 1 journée / À définir) et `effectif` (1-3 / 4-6 / 7-10) alignées sur la nouvelle offre |
| `js/url-handler.js` | Détection de production basée sur `workflowintelligent.fr` |
| `sitemap.xml` + 8 pages HTML | `workflowintelligent.com` → `workflowintelligent.fr` (18 `<loc>` + hreflang des pages EN) ; `lastmod` de `formations-ia` mis à jour |
| `js/formations-popover.js` | **Supprimé** (plus utilisé) |
| `js/custom.js` | Modifié puis **reverté** — état d'origine conservé |

### Scripts / assets retirés de `formations-ia.html`
- `js/language-switcher.js` (pas de version EN de cette page — voir §5)
- `css/tabs.css`
- `js/formations-popover.js`

### SEO en place sur la page
- `<title>` : *Formation IA pour PME à Lyon et en Auvergne-Rhône-Alpes | Workflow Intelligent*
- `<meta name="description">` réécrite (formats, 10 participants max, 590 € HT)
- `<link rel="canonical" href="https://workflowintelligent.fr/formations-ia">`
- Open Graph aligné sur la même URL
- Hiérarchie H1 → 9 × H2 → H3
- Visuel du hero en `fetchpriority="high"` (plus de `loading="lazy"`)
- JSON-LD `@graph` : `ProfessionalService` (+ `areaServed` Lyon / AURA / France), `ItemList` de 2 `Course` (590 € / 1 090 €, `maximumAttendeeCapacity: 10`), `FAQPage` (7 questions **verbatim identiques** au texte affiché)

Le script qui régénère le JSON-LD est conservé dans le scratchpad de session (`add_jsonld.py`) — à relancer depuis le dossier `workflowintelligent/` si le bloc doit être reconstruit.

---

## 3. Sitemap et Search Console — à faire manuellement

### Qu'est-ce qu'une forme canonique ?
C'est **l'URL officielle d'une page** quand plusieurs adresses servent le même contenu. Ici la page est atteignable par :

- `https://workflowintelligent.fr/formations-ia`
- `https://workflowintelligent.fr/formations-ia.html`
- `https://www.workflowintelligent.fr/formations-ia`
- éventuellement l'ancien `.com`

Sans canonical, Google répartit les signaux SEO entre ces variantes au lieu de les concentrer. D'où la balise ajoutée :

```html
<link rel="canonical" href="https://workflowintelligent.fr/formations-ia" />
```

Deux précisions importantes :
- le `www` semble **déjà rediriger** vers l'apex (constaté en test de navigation) ;
- **le canonical ne remplace pas une redirection 301.** Pour l'ancien domaine `.com`, une vraie redirection permanente reste nécessaire.

### Resoumettre le sitemap — étapes
1. Ouvrir `search.google.com/search-console` avec le compte qui gère `workflowintelligent.fr`.
2. Menu de gauche → **Sitemaps**.
3. Saisir `sitemap.xml` dans « Ajouter un sitemap », puis **Envoyer**. S'il est déjà listé, le renvoyer force une relecture.
4. Menu **Inspection de l'URL** : coller `https://workflowintelligent.fr/formations-ia` → **Demander une indexation**.

### Les 2 vérifications Search Console
1. **Vérifier que la propriété Search Console porte bien sur `.fr`.** Si elle a été créée du temps du `.com`, il faut en créer une nouvelle — sinon le sitemap pointant vers `.fr` sera rejeté.
2. **Tester la page dans l'outil de test des résultats enrichis** (`search.google.com/test/rich-results`) : *Course* et *FAQ* doivent apparaître. C'est aussi là que s'affichent les erreurs de données structurées.

### Délais réalistes
- Réindexation : quelques jours.
- Apparition éventuelle des FAQ dans les résultats : plusieurs semaines — et Google ne les affiche pas systématiquement.

### Pourquoi une passe séparée pour l'hygiène des autres pages
- C'est un **sujet distinct** de la refonte : mélanger les deux complique un rollback.
- Le doublon `/page` vs `/page.html` (rewrites Vercel) est réel mais **bénin**, d'autant que `js/url-handler.js` réécrit déjà les liens internes vers la version sans `.html`.
- C'est peu de travail — une ligne de canonical par page — à faire dans une passe dédiée, avec au passage la vérification des `hreflang` des pages EN.

---

## 4. Bugs préexistants rencontrés (et leur statut)

| Symptôme | Diagnostic | Statut |
|---|---|---|
| Image du hero invisible (96 × 0 px, jamais chargée) | **Bug préexistant**, vérifié aussi en production : la grille Webflow s'effondrait (colonne à 0 px) + `loading="lazy"` | **Corrigé** en page-scoped dans `css/formations-ia.css` (350 × 233 en desktop, 280 px centré en mobile) |
| État actif de l'accordéon FAQ (fond orange / texte blanc non appliqués) | Quirk préexistant du site, reproduit à l'identique sur `solutions-ia-entreprise.html` **et** en production | Non traité — hors périmètre |
| Sticky CTA masquant le footer en mobile | Régression de mise en page | **Corrigé** (`body { padding-bottom: 4.5rem }` en mobile) |
| Sélecteur de langue qui réapparaît | `js/language-switcher.js` **recrée** le switcher et pointe vers `formations-ia-en.html` (404) | **Corrigé** : le `<script>` a été retiré de cette page (vérifié : 0 `.language-switcher` après 1,2 s) |
| `scrollIntoView` qui semblait cassé | Artefact du navigateur d'automatisation (`behavior:'smooth'` inopérant, `'instant'` OK) | Faux positif — seul `scroll-margin-top: 80px` conservé, pour passer sous la navbar de 58 px |
| « Double présentation » en mobile | DOM vérifié en 375 px : 1 navbar, 1 logo, 1 `<h1>`, 1 `<main>`, `scrollWidth === innerWidth === 375` | Aucun défaut trouvé — probable superposition de deux fenêtres dans la capture. **À reconfirmer** en fenêtre unique maximisée |

---

## 5. Points à vérifier manuellement

- [ ] **Rendu visuel réel** de la page (les captures d'écran ne sont pas disponibles côté agent — toutes les vérifications ont été faites par mesures JS).
- [ ] `assets/programme-formation.pdf` contient encore **l'ancienne offre et les anciens tarifs**.
- [ ] Vérifier le mapping éventuel des valeurs `format` / `effectif` dans `api/send-pdf-programme.js` (les options du formulaire ont changé).
- [ ] Mettre en place la **redirection 301** `workflowintelligent.com` → `workflowintelligent.fr`.
- [ ] Trancher `www` vs apex côté Vercel et s'y tenir.
- [ ] Aucune balise analytics n'est présente sur la page.
- [ ] Les autres pages du site **n'ont pas de canonical** (voir §3, passe d'hygiène dédiée).
- [ ] Pas de version anglaise de `formations-ia` : la page vide a été supprimée et le sélecteur de langue retiré. Si une version EN est créée un jour, il faudra remettre `js/language-switcher.js` et les `hreflang`.

---

## 6. Suggestions optionnelles (non appliquées)

- Régénérer `assets/programme-formation.pdf` sur la nouvelle offre.
- Ajouter un canonical sur l'ensemble des pages dans une passe dédiée.
- Ajouter une mesure d'audience (Plausible / Matomo) pour suivre les conversions du CTA.
- Étendre le JSON-LD `Course` aux autres formats (4 h, parcours 3 jours) si ces formats deviennent des offres catalogue.

---

## 7. Environnement de travail

Serveur local (à laisser tourner) :

```bash
npx -y serve workflowintelligent -p 3000 -l 3000
```

Page de travail : http://localhost:3000/formations-ia.html
Configuration : `.claude/launch.json` (nom du service : `workflowintelligent`).
