// utils/mailer.js  (CommonJS)

const nodemailer = require('nodemailer');

// Pick port & secure automatically; Gmail SSL uses 465
const port = Number(process.env.SMTP_PORT || 465);
const secure = port === 465;

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,      // e.g. smtp.gmail.com
  port,                             // 465 for Gmail SSL
  secure,                           // true when port === 465
  auth: {
    user: process.env.SMTP_USER,    // your Gmail address
    pass: process.env.SMTP_PASS,    // 16-char App Password
  },
});

/**
 * Send an email
 * @param {Object} opts
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} [opts.text]
 * @param {string} [opts.html]
 */
async function sendMail({ to, subject, text, html }) {
  // With Gmail, the "from" should be the same mailbox as SMTP_USER
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
  return mailer.sendMail({
    from: `"Kavyakala" <${fromEmail}>`,
    to,
    subject,
    text,
    html,
    // replyTo: 'support@yourdomain.com' // optional
  });
}

// Export AFTER definitions
module.exports = { mailer, sendMail };

// Helpful startup check
mailer.verify()
  .then(() => console.log('[mailer] SMTP ready'))
  .catch(err => console.error('[mailer] SMTP error:', err?.message || err));
