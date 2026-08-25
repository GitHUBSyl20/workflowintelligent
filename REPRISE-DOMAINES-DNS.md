# Reprise — Domaines, DNS et manipulations restantes

**Site :** workflowintelligent.fr — Sylvain Magana, concepteur et formateur en IA et automatisation (TPE/PME, Lyon & Auvergne-Rhône-Alpes)
**État au :** 25 août 2026
**Objet :** tout ce qui n'est pas dans le code — configuration des deux domaines, Vercel, Gandi, Search Console.

---

## 1. Contexte technique

| Élément | Valeur |
|---|---|
| Hébergement | **Vercel**, déploiement automatique depuis la branche `main` |
| Dépôt | `workflowintelligent/` (186+ commits) — le dossier parent n'est plus un dépôt git |
| Dernier commit poussé | `2383bc8` |
| Site canonique | `https://www.workflowintelligent.fr` — **avec www, sans `.html`** |
| Sitemap | 19 URL, toutes en www et sans extension |
| URL sans `.html` | fournies par les **rewrites** de `vercel.json` (18 rewrites, 12 redirects) |

> **Règle permanente :** toute nouvelle URL absolue s'écrit `https://www.workflowintelligent.fr/<slug>`, sans extension. Une URL sans `.html` n'existe que si `vercel.json` porte la rewrite correspondante — sinon 404.

> **Règle éditoriale permanente :** aucune mention du « no-code », nulle part. Positionnement retenu : **« Concepteur et formateur en IA et automatisation »**.

---

## 2. Domaine principal — workflowintelligent.fr

### 2.1 Registrar et titularité

| Champ | Valeur |
|---|---|
| Registrar | **GANDI** |
| Serveurs de noms | `ns-106-b.gandi.net`, `ns-137-a.gandi.net`, `ns-196-c.gandi.net` |
| Enregistré le | 30 juin 2025 |
| Expire le | **30 juin 2027** |
| Statut | `client transfer prohibited` (verrou de transfert actif — normal) |

### 2.2 Zone DNS constatée (relevé du 25 août 2026)

| Nom | Type | Valeur | TTL | Verdict |
|---|---|---|---|---|
| `@` | A | `76.76.21.21` | 10800 | Vercel — **correct** |
| `@` | A | `217.70.184.38` | 10800 | Gandi (redirection web) — **à supprimer** |
| `www` | CNAME | `cname.vercel-dns.com.` | 10800 | correct — **ne pas toucher** |
| `@` | MX | `10 spool.mail.gandi.net.` | 10800 | Gandi Mail — **ne pas toucher** |
| `@` | MX | `50 fb.mail.gandi.net.` | 10800 | Gandi Mail — **ne pas toucher** |

### 2.3 Le problème

Le domaine nu n'est pas « non configuré » : il est configuré **deux fois, de façon contradictoire**. Deux enregistrements A sur le même nom = tirage au sort à chaque résolution. Un visiteur sur deux atterrit sur le serveur de redirection web de Gandi, qui ne possède aucun certificat pour ce domaine → **avertissement de sécurité TLS** sur `https://workflowintelligent.fr`.

Le `www` fonctionne parfaitement, c'est pourquoi le problème est passé inaperçu. Mais toute personne qui tape le domaine sans www — carte de visite, signature d'e-mail, bouche-à-oreille — reçoit une alerte de sécurité.

### 2.4 Procédure de correction (non exécutée à ce jour)

**Étape 0 — Sauvegarde.** Chez Gandi, vue « fichier de zone » → copier le contenu actuel dans un fichier texte.

**Étape 1 — Gandi : retirer la redirection** (à faire en premier, le TTL de 3 h court pendant le reste)

1. gandi.net → Domaines → `workflowintelligent.fr`
2. Onglet **Redirections web** : supprimer toute redirection portant sur le domaine nu. *Sans cette étape, Gandi recréera l'enregistrement A supprimé à l'étape suivante.*
3. Onglet **Enregistrements DNS** : parmi les deux lignes A sur `@`, supprimer **uniquement** `217.70.184.38`. Conserver `76.76.21.21`.
4. Ne toucher à rien d'autre — ni aux MX, ni au CNAME `www`, ni aux TXT.

**Étape 2 — Vercel : déclarer le domaine nu**

1. vercel.com → projet → **Settings → Domains**
2. Vérifier que `www.workflowintelligent.fr` est listé et marqué comme domaine principal
3. **Add Domain** → `workflowintelligent.fr` (sans www)
4. Choisir le comportement **« Redirect to www.workflowintelligent.fr »**, en **permanent (308)** si le choix est proposé — cohérent avec les canonical déjà en place
5. Vercel affiche l'enregistrement DNS attendu (`A → 76.76.21.21`, déjà présent). **Si Vercel demande autre chose, c'est Vercel qui fait foi** : recopier sa valeur telle quelle.

**Étape 3 — Attendre.** TTL = 10 800 s = **3 heures**. Ne pas conclure à un échec avant ce délai.

**Étape 4 — Vérifier**, dans cet ordre :

1. Vercel affiche **Valid Configuration** + certificat actif
2. `https://workflowintelligent.fr` en **navigation privée** → bascule sur le www, sans avertissement
3. **Envoyer un e-mail de test à `contact@workflowintelligent.fr`** depuis une adresse extérieure

### 2.5 Piège à éviter — impératif

Si Vercel propose de **déléguer les serveurs de noms** (`ns1.vercel-dns.com`…) : **refuser**. Les MX pointent vers Gandi Mail. Déplacer les serveurs de noms sans recopier les MX couperait `contact@workflowintelligent.fr` **silencieusement** — aucune erreur visible côté Sylvain, pendant que les prospects croient avoir écrit.

---

## 3. Second domaine — workflowintelligent.com

**Ce domaine ne nous appartient plus.** La redirection 301 depuis le `.com`, inscrite sur la liste des tâches depuis le début, est donc **impossible à réaliser**.

### 3.1 Configuration constatée (RDAP Verisign, 25 août 2026)

| Champ | Valeur |
|---|---|
| Registrar | **Dynadot Inc** |
| Serveurs de noms | `NS1.AFTERNIC.COM`, `NS2.AFTERNIC.COM` |
| Créé le | **10 décembre 2025** |
| Expire le | **10 décembre 2026** |
| Dernière modification | 17 août 2026 |
| Statut | `client transfer prohibited` |
| Comportement HTTP | `https://www.workflowintelligent.com/` → **307** → page de parking `forsale.godaddy.com` |

### 3.2 Lecture de ces données

La date de création — **postérieure** au début de l'usage de Sylvain (30 juin 2025) — ne s'explique que d'une façon : le domaine est tombé à l'expiration, puis a été capté et ré-enregistré. Les serveurs de noms Afternic (place de marché de revente de GoDaddy) confirment qu'il est détenu par un investisseur en vue de la revente, pas par un concurrent.

### 3.3 Recommandation

1. **Ne pas acheter au prix affiché.** Un domaine listé sur Afternic descend rarement sous plusieurs centaines d'euros, pour un bénéfice commercial nul auprès d'une clientèle lyonnaise à qui le `.fr` parle mieux.
2. **Noter le 10 décembre 2026**, échéance du détenteur actuel. S'il ne renouvelle pas : ~80 jours de grâce, rédemption puis suppression → domaine librement enregistrable vers **fin février 2027**.
3. **Poser un backorder** (Dynadot, Dropcatch ou Snapnames) — quelques dizaines d'euros. Capture automatique s'il tombe, coût quasi nul s'il est renouvelé. Meilleur rapport risque/prix. Réserve : un investisseur qui croit encore à la revente renouvellera.

**Conséquences acquises :** les backlinks pointant vers le `.com` sont perdus, ainsi que l'ancienneté du domaine. Point rassurant : tant qu'il dort en portefeuille, il ne sert aucune activité concurrente.

---

## 4. Manipulations restantes côté Sylvain

| # | Tâche | Où | Priorité |
|---|---|---|---|
| 01 | Réparer le domaine nu (§ 2.4) | Gandi + Vercel | **Bloquant** |
| 02 | Créer/corriger la propriété Search Console — type **Domaine**, `workflowintelligent.fr` | Search Console | À faire |
| 03 | Soumettre `sitemap.xml` → doit annoncer **19 URL découvertes** | Search Console | À faire |
| 04 | Demander l'indexation de `/formations-ia` (et de l'accueil) | Search Console | À faire |
| 05 | Tester les données structurées de `/formations-ia` → types **Course** et **FAQ** détectés | Rich Results Test | Recommandé |
| 06 | Décision sur le `.com` (§ 3.3) | — | À surveiller |

Support imprimé déjà remis : `C:\Users\verse\Desktop\Manips-restantes-workflowintelligent.pdf` (3 pages). **Attention :** sa fiche 01 est antérieure au diagnostic DNS — elle dit « recopier l'enregistrement chez votre registrar » sans nommer Gandi, sans mentionner l'enregistrement parasite `217.70.184.38`, ni l'avertissement sur les MX. **Le § 2.4 du présent document fait foi.**

---

## 5. Dette connue, non traitée

- **« no-code » subsiste dans le corps des pages** : ~15 occurrences dans `a-propos.html`, ~15 dans `a-propos-en.html`, quelques-unes ailleurs. Les métadonnées, l'Open Graph et le JSON-LD sont propres. Nettoyage à proposer, pas à appliquer d'office.
- **Aucune mesure d'audience** sur le site. Sans elle, impossible de savoir si les corrections SEO produisent un effet. Plausible ou Matomo s'installent en une balise, RGPD-compatibles sans bandeau de consentement.
- **Six titres FR dépassent 60 caractères.** Arbitrage explicite de Sylvain : « laisse les longueurs telles quelles, pas important ».
- **`api/send-pdf-programme.js` est du code mort.** Rien n'appelle cette route ; le formulaire de contact poste vers `https://formspree.io/f/xwpnyplp`. La route exige `ressource === 'ProgrammePDF'`, valeur qu'aucune page n'a jamais produite. Ses tarifs ont malgré tout été corrigés (590 € / 1 090 € HT) pour éviter un piège si elle était un jour rebranchée.

---

## 6. Points de vigilance pour la suite

- La signature **« Workflow Intelligent »** à côté du logo, sur les 22 pages, **ne doit pas être modifiée** (consigne explicite). Seule la signature des `<title>` a été uniformisée en « | Sylvain Magana ».
- Tarifs en vigueur : **590 € HT** (formation-action 3h30) et **1 090 € HT** (journée 7h). L'ancien montant de 1 290 € a été purgé du site, de l'e-mail et du PDF.
- Le PDF programme (v3.0) est téléchargeable depuis `/formations-ia`, section formats → `/assets/programme-formation.pdf`.
