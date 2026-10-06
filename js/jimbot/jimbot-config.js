/* =====================================================================
   JimBot : réglages de l'interface (libellés, liens, limites).
   Les couleurs et dimensions sont dans css/jimbot.css (variables --jb-*).
   Rien de secret ici : ce fichier est public.
   ===================================================================== */
window.JIMBOT_CONFIG = {
  enabled: true,
  endpoints: {
    chat: '/api/jimbot/chat',
    history: '/api/jimbot/history',
    reset: '/api/jimbot/reset',
    contactDraft: '/api/jimbot/contact-draft',
    contact: '/api/jimbot/contact',
  },
  privacyUrl: '/mentions-legales#jimbot',
  maxMessageChars: 1000,
  requestTimeoutMs: 35000,
  // Sélecteurs d'éléments flottants déjà présents : la bulle se place au-dessus.
  raiseAbove: ['.formation-sticky-cta'],

  labels: {
    launcher: 'Ouvrir JimBot, assistant IA',
    title: 'JimBot',
    subtitle: 'Assistant IA de Sylvain Magana',
    close: 'Fermer JimBot',
    newConversation: 'Nouvelle conversation',
    newConversationConfirm: 'Démarrer une nouvelle conversation ? L’échange affiché sera effacé de cette fenêtre.',
    greeting:
      'Bonjour, je suis JimBot, l’assistant IA de Sylvain. Je peux vous présenter son parcours, ses réalisations et vous aider à préciser votre projet. Que souhaitez-vous savoir ?',
    notice:
      'Vos échanges sont enregistrés et conservés six mois au plus, puis supprimés automatiquement. Évitez d’y indiquer des données sensibles.',
    noticeLink: 'En savoir plus',
    you: 'Vous',
    bot: 'JimBot',
    inputLabel: 'Votre message à JimBot',
    inputPlaceholder: 'Écrivez votre question…',
    send: 'Envoyer',
    typing: 'JimBot rédige une réponse…',
    counter: (n, max) => `${n} / ${max}`,
    contactButton: 'Être recontacté',
    retry: 'Réessayer',
    errors: {
      network: 'Connexion impossible. Vérifiez votre accès à Internet puis réessayez.',
      timeout: 'La réponse prend trop de temps. Vous pouvez réessayer.',
      generic: 'Une erreur est survenue. Vous pouvez réessayer ou demander à être recontacté.',
      tooLong: (max) => `Votre message dépasse ${max} caractères.`,
      history: 'L’historique de la conversation n’a pas pu être chargé.',
    },
    contact: {
      title: 'Être recontacté par Sylvain',
      intro: 'Remplissez ce formulaire uniquement si vous souhaitez que Sylvain vous réponde. Tous les champs sont obligatoires.',
      transmission:
        'Ces informations seront transmises à Sylvain Magana pour répondre à votre demande. Elles sont conservées six mois au plus.',
      lastName: 'Nom',
      firstName: 'Prénom',
      email: 'Adresse e-mail',
      company: 'Entreprise',
      noCompany: 'Sans entreprise',
      need: 'Votre besoin',
      needHint: 'Prérempli à partir de vos messages : relisez et modifiez librement avant l’envoi.',
      submit: 'Envoyer ma demande',
      submitting: 'Envoi en cours…',
      back: 'Retour à la conversation',
      success: 'Votre demande est bien enregistrée. Sylvain vous répondra par e-mail.',
      unconfirmed:
        'L’enregistrement de votre demande n’a pas pu être confirmé. Réessayez : votre demande ne sera pas envoyée deux fois.',
      fixFields: 'Certains champs sont à corriger.',
    },
  },
};
