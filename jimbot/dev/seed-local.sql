-- Jeu de données LOCAL de test uniquement (serveur de développement et tests
-- automatisés). Ne pas importer dans Supabase : la base de production est
-- alimentée par Sylvain selon jimbot/docs/CONTRAT-DOCUMENTS.md.
-- Textes repris des pages publiques du site (a-propos, tarifs-prestations)
-- en octobre 2026. Les embeddings sont calculés au démarrage par le
-- générateur factice (jimbot/dev/mock-embeddings.cjs).

insert into public.jimbot_documents (doc_ref, title, category, content, source_url, last_reviewed_at, embedding_model) values
('PARCOURS-FORMATION', 'Formation initiale et parcours de développement', 'formation',
 'Sylvain Magana est titulaire d''un doctorat en science des matériaux. Il a ensuite suivi un parcours intensif en développement logiciel d''environ 1 700 heures : développeur React / React Native, concepteur développeur Java JEE, développeur d''applications. Depuis 2024, il s''est formé à l''IA et à l''automatisation (environ 145 heures à Alegria Academy) et a obtenu les certifications Make Academy Foundation, Basics, Intermediate et Advanced.',
 'https://www.workflowintelligent.fr/a-propos', '2026-10-06', 'mock-hash-1536'),
('PARCOURS-PRO', 'Parcours professionnel', 'parcours',
 'Sylvain Magana a cinq ans d''expérience en développement et conseil logiciel, au contact des équipes métier. En ESN, il a analysé des processus métier, rédigé des cahiers des charges, paramétré et développé une solution d''automatisation documentaire jusqu''à la livraison testée. Il a développé pendant trois ans des applications sur mesure pour des équipes de grands groupes (Bonduelle, Decathlon), puis travaillé un an sur une plateforme SaaS B2B. Entreprises : La Mobilery, UMI, Alteca.',
 'https://www.workflowintelligent.fr/a-propos', '2026-10-06', 'mock-hash-1536'),
('COMPETENCES-TECH', 'Compétences techniques', 'competences',
 'Compétences techniques de Sylvain Magana : applications web, API, bases de données, intégrations, tests et mise en production. En IA et automatisation : lire un document, trier une demande, préparer une réponse, automatiser des workflows avec Make.',
 'https://www.workflowintelligent.fr/a-propos', '2026-10-06', 'mock-hash-1536'),
('OFFRE-DIAGNOSTIC', 'Diagnostic IA et automatisation', 'offres',
 'Le diagnostic IA et automatisation comprend un entretien dirigeant de 1 h 30, l''analyse de deux à trois processus, la priorisation des pistes selon l''impact attendu et la complexité, des recommandations écrites de deux à trois pages, une feuille de route à trois mois et une restitution de 30 à 45 minutes. Livraison sous 5 à 7 jours calendaires. Un échange gratuit de 30 minutes précède toute commande.',
 'https://www.workflowintelligent.fr/tarifs-prestations', '2026-10-06', 'mock-hash-1536');

insert into public.jimbot_documents (doc_ref, title, category, content, source_url, valid_from, valid_until, last_reviewed_at, embedding_model) values
('TARIF-DIAGNOSTIC-2026', 'Tarif du diagnostic', 'tarifs',
 'Le prix du diagnostic IA et automatisation est de 690 euros HT, prix fixe, pour deux à trois processus. Prototype, mise en service et accompagnement font chacun l''objet d''un devis séparé.',
 'https://www.workflowintelligent.fr/tarifs-prestations', '2026-01-01', '2099-12-31', '2026-10-06', 'mock-hash-1536'),
-- Tarif périmé : ne doit jamais être renvoyé par la recherche
('TARIF-FORMATION-2025', 'Ancien tarif formation', 'tarifs',
 'Ancien tarif de la formation-action d''une journée : 990 euros HT.',
 null, '2025-01-01', '2025-12-31', '2025-06-01', 'mock-hash-1536');

-- Brouillon : ne doit jamais être renvoyé
insert into public.jimbot_documents (doc_ref, title, category, content, visibility, embedding_model) values
('BROUILLON-TEST', 'Brouillon interne', 'faq', 'Mot de code interne du brouillon : PAPAYE-42. Ne jamais diffuser.', 'brouillon', 'mock-hash-1536');
