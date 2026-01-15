# Configuration Resend pour l'envoi automatique de PDF

## Étapes de configuration

### 1. Créer un compte Resend
1. Allez sur [resend.com](https://resend.com)
2. Créez un compte gratuit
3. Vérifiez votre email

### 2. Obtenir votre clé API
1. Dans le dashboard Resend, allez dans **API Keys**
2. Cliquez sur **Create API Key**
3. Donnez-lui un nom (ex: "Vercel Production")
4. Copiez la clé (elle commence par `re_...`)

### 3. Configurer les variables d'environnement dans Vercel
1. Allez dans **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**
2. Ajoutez ces variables :

| Nom | Valeur | Environnements |
|-----|--------|----------------|
| `RESEND_API_KEY` | Votre clé API Resend (commence par `re_...`) | Production, Preview, Development |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` (par défaut) ou votre email vérifié | Production, Preview, Development |

**Note** : Pour utiliser votre propre domaine (ex: `contact@workflowintelligent.fr`), vous devez d'abord vérifier votre domaine dans Resend (section Domains).

### 4. Redéployer
Après avoir ajouté les variables d'environnement, **redéployez** votre projet :
- Vercel redéploiera automatiquement, OU
- Allez dans **Deployments** → Cliquez sur les 3 points → **Redeploy**

### 5. Tester
1. Allez sur votre site
2. Cliquez sur le bouton **"Recevoir le programme PDF"** sur la page formations
3. Remplissez le formulaire avec votre email
4. Vérifiez votre boîte mail (et le dossier spam)

## Dépannage

### L'email n'arrive pas
- Vérifiez le dossier **spam**
- Vérifiez que `RESEND_API_KEY` est bien configurée dans Vercel
- Regardez les logs Vercel (Function Logs) pour voir les erreurs

### Erreur "RESEND_API_KEY not configured"
- Vérifiez que la variable d'environnement est bien ajoutée dans Vercel
- Assurez-vous d'avoir redéployé après avoir ajouté la variable

### Erreur "PDF file not found"
- Vérifiez que `assets/programme-formation.pdf` existe bien dans votre repo
- Vérifiez que le fichier est bien commité dans Git
