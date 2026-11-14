# REPRISE — WORKFLOWINTELLIGENT-SEO (Workflow Intelligent, Sylvain Magana)
Mise à jour : 2026-11-14 16:12 · Dernière session : plan SEO ProxiFocus appliqué, indexation OK, avis Google à lancer

## Objectif et échéance
- Rendre workflowintelligent.fr visible sur les recherches clients (consultant IA Lyon, audit IA, formation IA Lyon, automatisation des processus) — EN COURS
- Bilan des positions à 1 mois dans la Search Console : janvier 2027 (plan ProxiFocus) — NON COMMENCÉ
- Objectif business derrière : plus de prospects (goulot identifié par Sylvain), cap 10 k€/mois

## Décisions actées (ne pas rediscuter)
- Positionnement **consultant**, pas agence — cohérent avec les textes en « je ». « Agence IA Lyon » seulement capté via une question de FAQ sur la page Solutions.
- Mot-clé principal par pilier : Accueil = consultant IA (Lyon) ; Solutions = automatisation des processus ; Formation = formation IA Lyon ; Diagnostic = audit IA.
- Nouvelles adresses : /automatisation-processus, /formation-ia-lyon, /audit-ia (301 depuis /solutions-ia-entreprise, /formations-ia, /diagnostic-ia).
- Nom unique partout : « Workflow Intelligent » (fiche Google à renommer depuis « Wflowi - Workflowintelligent »).
- Audit 690 € HT **déduit** d'un projet de prototype / automatisation / agent IA / application métier de **3 000 € HT ou plus**, devis signé dans les **60 jours** suivant la restitution, une seule fois. **Toutes les formations exclues** (OPCO ou non). Écrire « déduit », jamais « offert ».
- Règle anti-dispersion : chaque semaine, 3 actions d'acquisition avant toute retouche du site ou de l'offre. Pas de modification du site pendant 30 jours (jusqu'au 2026-12-07 environ).

## État validé
- Commits `94c6ad0` (H1, titres, méta, JSON-LD, adresses, 301) et `8fcb3ba` (déduction audit) fusionnés dans `main` et en ligne (Sylvain a vérifié les redirections).
- Les 4 pages (/, /automatisation-processus, /formation-ia-lyon, /audit-ia) : indexation demandée le 2026-11-07, statut « URL is on Google » confirmé par Sylvain le 2026-11-12.
- Sitemap soumis : https://www.workflowintelligent.fr/sitemap.xml (10 URL).
- JSON-LD : ProfessionalService + WebSite (accueil, avec hasMap cid 1628224161627648399), Person + ProfilePage (à propos), Service + Offer (audit, automatisation), Course (formation, déjà présent).

## En cours — là où on s'est arrêté
- Fiche Google : renommage en « Workflow Intelligent » en attente de validation par Google (vérification en cours). Ne rien modifier d'autre sur la fiche pendant la vérification.
- Demandes d'avis Google : 0 envoyée. Prévu lundi 2026-11-16 à 9 h (rappel programmé dans la session Claude Code).

## Points NON vérifiés — à contrôler en premier
1. Validation du renommage de la fiche Google → vérifier dans business.google.com.
2. JSON-LD non passé au Test des résultats enrichis → search.google.com/test/rich-results sur l'accueil et /audit-ia.
3. Les fichiers .md à la racine du dépôt (REPRISE-DOMAINES-DNS.md, SEO-DEBT.md, etc.) semblent publiés par Vercel (absents de `.vercelignore`) → ouvrir https://www.workflowintelligent.fr/REPRISE-DOMAINES-DNS.md ; si la page s'affiche, ajouter `*.md` dans `.vercelignore`.
4. Condition de déduction pas encore reportée sur le modèle de devis d'audit → vérifier le gabarit de devis.

## Prochaines étapes (dans l'ordre)
1. Lundi 2026-11-16, 9 h : envoyer 3 demandes d'avis Google (Amplitude Conseil, la société de nettoyage, un participant de formation) avec le lien « Demander des avis » de la fiche et ce message :
   « Objet : Un petit service ? — Bonjour [prénom], J'ai apprécié notre travail sur [mission précise]. Je développe mon activité de consultant IA à Lyon et les avis Google comptent beaucoup pour être trouvé. Si vous avez 2 minutes, un avis m'aiderait vraiment : [lien]. Merci d'avance, Sylvain »
2. Une fois le nom validé : compléter la fiche (catégorie principale Consultant en informatique ou d'entreprise, secondaires Centre de formation + Développeur de logiciels, zone desservie Lyon / Métropole / Rhône / AURA, adresse masquée, 4 services, description, photos).
3. Ajouter la condition de déduction (3 000 € HT, 60 jours, formations exclues) au devis d'audit.
4. Semaine du 2026-11-23 : 3 premiers liens externes (site du concours de Caluire « réalisé par », profils LinkedIn / Malt, annuaire CCI Lyon ou French Tech).
5. Fin novembre / décembre : créer la rubrique blog et l'article n°1 « relance facture impayée » (1 000/mois, difficulté 12) avec un modèle téléchargeable ; demander à Claude le plan des titres.
6. Tenir un tableau audit vendu / projet signé / montant pour mesurer l'effet de la déduction (bilan après 5 audits).

## Reporté / plus tard
- Page dédiée « Application métier sur mesure » (260/mois, difficulté 7) — après les premiers avis et liens.
- Articles n°3 (automatiser sa prospection), n°2 (comptes rendus de réunion IA), n°4, n°5, puis n°6 (prompt ChatGPT, en dernier) — rythme 2/mois.
- Balisage FAQPage — inutile pour l'affichage (Google le réserve aux sites gouvernementaux/santé depuis 2023).

## Références
- Plan source : « Plan SEO workflowintelligent.fr », ProxiFocus, 3 novembre 2026 (PDF, 4 pages).
- Dépôt : githubsyl20/workflowintelligent, branche `main` (travail fait sur `claude/trusting-turing-rqnxbi`).
- Fichiers clés : index.html, automatisation-processus.html, formation-ia-lyon.html, audit-ia.html, a-propos.html, conditions-generales.html, vercel.json, sitemap.xml, llms.txt.
- Fiche Google : cid 1628224161627648399.
- Search Console : propriété workflowintelligent.fr (inspecter avec l'URL complète en https://www.).

## Journal (5 dernières sessions)
- 2026-11-14 : renommage de la fiche en attente de validation Google ; rappel avis programmé lundi 16/11 9 h.
- 2026-11-12 : indexation des 4 pages confirmée « URL is on Google ».
- 2026-11-07 : site en ligne (fusion dans main), sitemap soumis, indexation des 4 pages demandée ; déduction audit 3 000 € / 60 jours ajoutée.
- 2026-11-06 : analyse du plan ProxiFocus et du contenu du site ; priorités établies.
