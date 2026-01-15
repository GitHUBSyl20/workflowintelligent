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
  // DEBUG LOG: API Route hit
  console.log('[API-DEBUG] ====== send-pdf-programme called ======');
  console.log('[API-DEBUG] Method:', req.method);
  console.log('[API-DEBUG] Body:', JSON.stringify(req.body, null, 2));
  console.log('[API-DEBUG] VERCEL env:', process.env.VERCEL ? 'true' : 'false');
  console.log('[API-DEBUG] RESEND_API_KEY set:', !!process.env.RESEND_API_KEY);
  console.log('[API-DEBUG] RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || 'not set');

  // Seulement accepter les requêtes POST
  if (req.method !== 'POST') {
    console.log('[API-DEBUG] Rejected: method not POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Récupérer les données du formulaire
    const { nom, prenom, _replyto: email, ressource } = req.body;
    console.log('[API-DEBUG] Extracted - email:', email, 'ressource:', ressource);

    // Vérifier que c'est bien une demande de PDF
    if (ressource !== 'ProgrammePDF') {
      console.log('[API-DEBUG] Rejected: ressource is not ProgrammePDF, got:', ressource);
      return res.status(400).json({ error: 'Invalid resource parameter', received: ressource });
    }

    // Vérifier que l'email est présent
    if (!email) {
      console.log('[API-DEBUG] Rejected: email is empty');
      return res.status(400).json({ error: 'Email is required' });
    }

    // Vérifier les variables d'environnement
    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    console.log('[API-DEBUG] Using from email:', resendFromEmail);

    if (!resendApiKey) {
      console.error('[API-DEBUG] RESEND_API_KEY is not set!');
      return res.status(500).json({ error: 'Email service configuration error', details: 'RESEND_API_KEY not configured' });
    }

    // Initialiser Resend
    const resend = new Resend(resendApiKey);

    // Lire le PDF depuis le dossier assets
    const pdfPath = getPdfPath();
    console.log('[API-DEBUG] PDF path:', pdfPath);
    console.log('[API-DEBUG] PDF exists:', fs.existsSync(pdfPath));
    
    if (!fs.existsSync(pdfPath)) {
      console.error('[API-DEBUG] PDF file not found at:', pdfPath);
      // List files in assets to debug
      try {
        const assetsPath = process.env.VERCEL ? path.join(process.cwd(), 'assets') : path.join(__dirname, '..', 'assets');
        const files = fs.readdirSync(assetsPath);
        console.log('[API-DEBUG] Files in assets:', files);
      } catch (e) {
        console.log('[API-DEBUG] Cannot list assets dir:', e.message);
      }
      return res.status(500).json({ error: 'PDF file not found', path: pdfPath });
    }

    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    console.log('[API-DEBUG] PDF loaded, size:', pdfBuffer.length, 'bytes');
    console.log('[API-DEBUG] Sending email to:', email);

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

    console.log('[API-DEBUG] Resend response:', JSON.stringify(emailResult, null, 2));

    if (emailResult.error) {
      console.error('[API-DEBUG] Resend API error:', emailResult.error);
      return res.status(500).json({ 
        error: 'Failed to send email',
        details: emailResult.error.message || JSON.stringify(emailResult.error)
      });
    }

    // Succès
    console.log('[API-DEBUG] SUCCESS! Email sent, ID:', emailResult.data?.id);
    return res.status(200).json({ 
      success: true,
      message: 'PDF envoyé avec succès',
      emailId: emailResult.data?.id
    });

  } catch (error) {
    console.error('[API-DEBUG] CATCH ERROR:', error.message);
    console.error('[API-DEBUG] Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
};
