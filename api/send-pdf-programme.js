/**
 * API Route pour envoyer le PDF du programme de formation par email
 * Utilise Resend pour l'envoi d'email avec pièce jointe
 */

const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

// Pour Vercel, le chemin doit être relatif à la racine du projet
const getPdfPath = () => {
  // En production Vercel, les fichiers sont dans la racine
  if (process.env.VERCEL) {
    return path.join(process.cwd(), 'assets', 'programme-formation.pdf');
  }
  return path.join(__dirname, '..', 'assets', 'programme-formation.pdf');
};

module.exports = async function handler(req, res) {
  // Seulement accepter les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Récupérer les données du formulaire
    const { nom, prenom, _replyto: email, ressource } = req.body;

    // Vérifier que c'est bien une demande de PDF
    if (ressource !== 'ProgrammePDF') {
      return res.status(400).json({ error: 'Invalid resource parameter' });
    }

    // Vérifier que l'email est présent
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Vérifier les variables d'environnement
    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not set');
      return res.status(500).json({ error: 'Email service configuration error', details: 'RESEND_API_KEY not configured' });
    }

    // Initialiser Resend
    const resend = new Resend(resendApiKey);

    // Lire le PDF depuis le dossier assets
    const pdfPath = getPdfPath();
    
    if (!fs.existsSync(pdfPath)) {
      console.error('PDF file not found at:', pdfPath);
      return res.status(500).json({ error: 'PDF file not found', path: pdfPath });
    }

    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    // Préparer le contenu de l'email
    const nomComplet = nom && prenom ? `${prenom} ${nom}` : (nom || prenom || 'Cher/Chère utilisateur/trice');
    const emailSubject = 'Programme de formation IA - Workflow Intelligent';

    // Envoyer l'email avec le PDF en pièce jointe
    const emailResult = await resend.emails.send({
      from: resendFromEmail,
      to: email,
      subject: emailSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Bonjour ${nomComplet},</h2>
          
          <p>Merci pour votre intérêt pour nos formations en intelligence artificielle.</p>
          
          <p>Vous trouverez ci-joint le programme détaillé de nos formations IA.</p>
          
          <p>Nos formations sont disponibles en deux formats :</p>
          <ul>
            <li><strong>Formation demi-journée (3h30)</strong> - 400€ HT par groupe</li>
            <li><strong>Formation journée (7h)</strong> - 900€ HT par groupe (recommandé)</li>
          </ul>
          
          <p>Pour toute question ou pour planifier une formation, n'hésitez pas à me contacter.</p>
          
          <p>Cordialement,<br>
          <strong>Sylvain Magana</strong><br>
          Workflow Intelligent</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #666;">
            Cet email a été envoyé automatiquement suite à votre demande sur workflowintelligent.fr
          </p>
        </div>
      `,
      attachments: [
        {
          filename: 'programme-formation-ia.pdf',
          content: pdfBase64,
        },
      ],
    });

    if (emailResult.error) {
      console.error('Resend API error:', emailResult.error);
      return res.status(500).json({ 
        error: 'Failed to send email',
        details: emailResult.error.message || JSON.stringify(emailResult.error)
      });
    }

    // Succès
    return res.status(200).json({ 
      success: true,
      message: 'PDF envoyé avec succès',
      emailId: emailResult.data?.id
    });

  } catch (error) {
    console.error('Error in send-pdf-programme API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
};
