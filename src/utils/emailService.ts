import nodemailer from 'nodemailer';

// Configuration du transporteur d'emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailData {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailData) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });

    console.log('Email envoyé avec succès:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
}

// Template d'email pour la confirmation de soumission PTZ
export function generatePTZConfirmationEmail(data: {
  firstName: string;
  lastName: string;
  eligible: boolean;
  ptzAmount?: number;
  reason?: string;
}) {
  const { firstName, lastName, eligible, ptzAmount, reason } = data;
  
  if (eligible) {
    return {
      subject: 'Confirmation de votre simulation PTZ',
      html: `
        <h1>Bonjour ${firstName} ${lastName},</h1>
        <p>Nous avons bien reçu votre simulation de Prêt à Taux Zéro (PTZ).</p>
        <p>Félicitations ! Selon nos calculs, vous êtes éligible au PTZ.</p>
        ${ptzAmount ? `<p>Montant estimé du PTZ : ${ptzAmount.toLocaleString('fr-FR')} €</p>` : ''}
        <p>Un conseiller va étudier votre dossier et vous recontacter prochainement pour vous accompagner dans vos démarches.</p>
        <p>Cordialement,<br>L'équipe PTZ-GEOTERRE</p>
      `
    };
  } else {
    return {
      subject: 'Résultat de votre simulation PTZ',
      html: `
        <h1>Bonjour ${firstName} ${lastName},</h1>
        <p>Nous avons bien reçu votre simulation de Prêt à Taux Zéro (PTZ).</p>
        <p>Malheureusement, selon nos calculs, vous n'êtes pas éligible au PTZ pour la raison suivante :</p>
        <p>${reason || "Critères d'éligibilité non remplis"}</p>
        <p>Si vous souhaitez plus d'informations ou discuter de solutions alternatives, n'hésitez pas à nous contacter.</p>
        <p>Cordialement,<br>L'équipe PTZ-GEOTERRE</p>
      `
    };
  }
} 