const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

/**
 * Sends the AI-generated escalation email to the municipal authority.
 */
const sendEscalationEmail = async ({ to, subject, html, authorityName, imageUrl }) => {
  const t = getTransporter();

  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; color: #222; max-width: 680px; margin: 0 auto; }
        .header { background: #1a7a4c; padding: 24px; color: white; }
        .header h1 { margin: 0; font-size: 20px; }
        .content { padding: 24px; }
        .footer { background: #f5f5f5; padding: 16px 24px; font-size: 12px; color: #888; }
        .badge { display: inline-block; background: #e53e3e; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🌿 EcoTrack — Civic Issue Escalation</h1>
        <p style="margin:4px 0 0; opacity:0.85;">This is an automated escalation from the EcoTrack platform</p>
      </div>
      <div class="content">
        ${html}
        ${imageUrl ? `<hr/><p><strong>Attached Image:</strong></p><img src="${imageUrl}" alt="Issue image" style="max-width:100%;border-radius:8px;" />` : ''}
      </div>
      <div class="footer">
        Sent by EcoTrack Civic Platform | This email was auto-generated based on community-verified complaint data.
        For queries, contact ${process.env.SMTP_USER}
      </div>
    </body>
    </html>
  `;

  await t.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html: fullHtml,
  });
};

/**
 * Sends an in-app notification email to a user.
 */
const sendNotificationEmail = async ({ to, subject, message }) => {
  const t = getTransporter();
  await t.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `[EcoTrack] ${subject}`,
    html: `<p>${message}</p>`,
  });
};

module.exports = { sendEscalationEmail, sendNotificationEmail };
