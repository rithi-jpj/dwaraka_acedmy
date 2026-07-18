const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;
if (env.SMTP.host && env.SMTP.user) {
  transporter = nodemailer.createTransport({
    host: env.SMTP.host,
    port: env.SMTP.port,
    secure: env.SMTP.port === 465,
    auth: { user: env.SMTP.user, pass: env.SMTP.pass },
  });
}

async function sendMail({ to, subject, text, html }) {
  if (!transporter) {
    console.log('[mail:disabled]', { to, subject, text });
    return { skipped: true };
  }
  return transporter.sendMail({ from: env.SMTP.from, to, subject, text, html });
}

module.exports = { sendMail };
