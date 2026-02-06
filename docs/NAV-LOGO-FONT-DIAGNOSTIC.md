# Diagnostic: même dimension "Workflow Intelligent" sur toutes les pages

## 5–7 causes possibles

1. **Taille de la racine (html) différente**  
   Le logo utilise `1.3rem`. Si `html { font-size: … }` varie selon les pages ou l’ordre des CSS (ex. shared.css avec body 14px, ou une feuille qui force html à 14px), alors 1.3rem donne des pixels différents d’une page à l’autre.

2. **Structure HTML incohérente**  
   Certaines pages ont `<span class="nav-logo-text">`, d’autres du texte brut dans le lien. Un sélecteur ou un héritage peut s’appliquer différemment (lien vs span).

3. **Feuilles CSS différentes selon la page**  
   index : shared + responsive + clean + footer (+ cookie-modal) ; formations-ia : en plus tabs + portfolio-accordion. Une règle dans une feuille en plus peut surcharger la taille ou la racine.

4. **Police chargée ou non (FOUT)**  
   Même `font-size` en px peut donner un rendu visuel différent si une page affiche Lato et l’autre la police de repli (sans-serif). La “dimension” perçue (hauteur d’x, graisse) change.

5. **Media query / viewport**  
   En `max-width: 700px`, clean-shared met `font-size: 1.1rem` sur `.nav-logo` (sans !important). Selon la largeur et l’ordre des feuilles, la règle gagnante peut changer.

6. **Body ou parent avec font-size en em**  
   Une classe sur body (ex. about-page) ou un parent avec `font-size` en `em` peut faire varier le calcul si un élément du logo hérite en em.

7. **Script ou style inline**  
   Un script ou un style inline pourrait modifier la taille du logo sur certaines pages après chargement.

## 1–2 causes les plus probables

- **Taille de la racine (html) différente (1)**  
  Si une feuille définit `html { font-size: 14px }` (ou autre) et qu’elle n’est pas chargée partout ou qu’elle est écrasée par une autre, alors `1.3rem` ne donne pas la même valeur en pixels entre les pages. C’est la cause la plus directe pour des “dimensions” différentes alors que le CSS du logo est identique.

- **Police réelle différente (4)**  
  Même taille calculée en px, mais Lato sur une page et Arial/sans-serif sur l’autre : la hauteur visuelle et la largeur du texte peuvent sembler différentes (“pas la même dimension”).

## Validation par logs (enrichis)

Le script dans `js/main.js` logue maintenant :

- **page** : pathname
- **viewportWidth** : largeur du viewport (media query / rem possible)
- **rootFontSize** : `getComputedStyle(document.documentElement).fontSize` (base des rem)
- **bodyFontSize** : `getComputedStyle(document.body).fontSize`
- **logoTextElement** : balise + classes de l’élément du texte
- **hasNavLogoText** : vrai si le texte est dans un `<span class="nav-logo-text">`
- **computedFontSize** : taille calculée de l’élément du texte
- **parentNavLogoFontSize** : taille calculée du `.nav-logo`
- **computedFontFamily** : police calculée (Lato vs fallback)
- **stylesheets** : noms des feuilles chargées

À faire : ouvrir 2 pages où le logo n’a pas la même dimension (ex. index vs formations-ia), comparer les logs. Si `rootFontSize` ou `computedFontFamily` diffèrent → corriger la racine ou le chargement de la police ; si tout est identique → chercher une autre cause (ex. line-height, letter-spacing, ou autre règle globale).
