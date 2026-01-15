# Configuration de l'envoi automatique du PDF

Ce document explique comment configurer l'envoi automatique du PDF du programme de formation.

## Prérequis

1. Un compte Resend (https://resend.com) - gratuit jusqu'à 3000 emails/mois
2. Le fichier PDF doit être présent dans `/assets/programme-formation.pdf`

## Configuration

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer Resend

1. Créer un compte sur https://resend.com
2. Obtenir votre clé API depuis le dashboard Resend
3. Vérifier votre domaine d'envoi (ou utiliser le domaine de test fourni par Resend)
### 3. Configurer les variables d'environnement dans Vercel

Dans le dashboard Vercel de votre projet :

1. Allez dans **Settings** > **Environment Variables**
2. Ajoutez les variables suivantes :

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@workflowintelligent.fr
```

**Important** : 
- `RESEND_FROM_EMAIL` doit être un email vérifié dans votre compte Resend
- Pour les tests, vous pouvez utiliser l'email fourni par Resend (ex: `onboarding@resend.dev`)

### 4. Déployer

Après avoir configuré les variables d'environnement, redéployez votre projet sur Vercel.

## Fonctionnement

1. Quand un utilisateur clique sur "Recevoir le programme PDF" depuis la page formations
2. Il est redirigé vers le formulaire de contact avec `?ressource=ProgrammePDF`
3. Le formulaire détecte ce paramètre et remplit automatiquement le champ caché `ressource`
4. À la soumission, le formulaire envoie les données à `/api/send-pdf-programme` au lieu de Formspree
5. L'API route lit le PDF depuis `/assets/programme-formation.pdf` et l'envoie par email via Resend

## Test

Pour tester en local :

1. Créer un fichier `.env.local` avec vos variables d'environnement
2. Lancer `npm run dev` ou `vercel dev`
3. Accéder à `http://localhost:3000/contact-devis.html?ressource=ProgrammePDF`
4. Remplir le formulaire et soumettre

## Dépannage

### Le PDF n'est pas envoyé

- Vérifier que le fichier `/assets/programme-formation.pdf` existe
- Vérifier les logs Vercel pour voir les erreurs
- Vérifier que les variables d'environnement sont bien configurées

### Erreur "PDF file not found"

- Vérifier que le chemin du PDF est correct dans l'API route
- En production Vercel, le chemin doit être relatif à la racine du projet

### Erreur Resend API

- Vérifier que votre clé API est correcte
- Vérifier que votre domaine est bien vérifié dans Resend
- Vérifier que l'email expéditeur est valide
