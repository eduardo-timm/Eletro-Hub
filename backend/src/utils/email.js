const nodemailer = require('nodemailer');

function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

// Envia e-mail de verdade se SMTP estiver configurado; caso contrario,
// apenas registra no log do servidor (nao quebra a funcionalidade do admin).
async function sendInteractionEmail({ to, subject, text }) {
  const transport = getTransport();

  if (!transport) {
    console.log(`[email simulado] Para: ${to} | Assunto: ${subject}\n${text}`);
    return { sent: false, simulated: true };
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || 'EletroHub <no-reply@eletrohub.com>',
    to,
    subject,
    text
  });
  return { sent: true, simulated: false };
}

module.exports = { sendInteractionEmail };
