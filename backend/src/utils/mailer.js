const nodemailer = require('nodemailer');
const env = require('../config/env');

// ── Transporter management ────────────────────────────────────────────────

let transporter = null;
let etherealPreviewUrl = null;
let initPromise = null;

/**
 * Initialise the mail transporter.
 * 1. If SMTP env vars are set → create a real SMTP transporter.
 * 2. Otherwise → fall back to nodemailer's built-in Ethereal test account
 *    (emails are captured and viewable at ethereal.email).
 *
 * Uses a promise guard to prevent concurrent init race conditions.
 */
async function initTransporter() {
  if (transporter) return transporter;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (env.SMTP.host && env.SMTP.user) {
      const t = nodemailer.createTransport({
        host: env.SMTP.host,
        port: env.SMTP.port,
        secure: env.SMTP.port === 465,
        auth: { user: env.SMTP.user, pass: env.SMTP.pass },
      });
      try {
        await t.verify();
        transporter = t;
        console.log(`[mail] SMTP connected — ${env.SMTP.host}:${env.SMTP.port}`);
      } catch (err) {
        console.error(`[mail] SMTP verification failed: ${err.message}. Falling back to Ethereal...`);
      }
    }

    if (!transporter) {
      try {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
        etherealPreviewUrl = `https://ethereal.email/login?user=${encodeURIComponent(testAccount.user)}`;
        console.log(`[mail] Ethereal fallback active — view emails at ${etherealPreviewUrl}`);
        console.log(`[mail]   user: ${testAccount.user}`);
        console.log(`[mail]   pass: ${testAccount.pass}`);
      } catch (err) {
        console.error(`[mail] Failed to create Ethereal account: ${err.message}`);
      }
    }

    return transporter;
  })();

  return initPromise;
}

/**
 * Send an email.  Returns `{ skipped: true }` if no transport is available
 * (the caller should gracefully degrade — passwords are always returned in
 * the API response as a fallback).
 */
async function sendMail({ to, subject, text, html }) {
  const t = await initTransporter();
  if (!t) {
    console.log('[mail:unavailable]', { to, subject });
    return { skipped: true };
  }

  const info = await t.sendMail({
    from: env.SMTP.from || '"Dwaraka Academy" <no-reply@dwaraka.local>',
    to,
    subject,
    text,
    html: html || text,
  });

  // Log preview URL for Ethereal emails
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[mail:sent] ${to} — ${subject}`);
    console.log(`[mail:preview] ${previewUrl}`);
  } else {
    console.log(`[mail:sent] ${to} — ${subject} (id=${info.messageId})`);
  }

  return info;
}

// ── HTML email templates ──────────────────────────────────────────────────

function baseTemplate(title, bodyHtml) {
  return '\n' +
'<!DOCTYPE html>\n' +
'<html>\n' +
'<head>\n' +
'  <meta charset="utf-8">\n' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'  <style>\n' +
'    body { margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; background:#f3f4f6; }\n' +
'    .wrapper { padding:32px 16px; }\n' +
'    .container { max-width:560px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }\n' +
'    .header { background:linear-gradient(135deg,#6D28D9,#8B5CF6); padding:32px 40px 24px; text-align:center; }\n' +
'    .header h1 { color:#fff; margin:0; font-size:22px; font-weight:700; letter-spacing:-0.3px; }\n' +
'    .header p { color:rgba(255,255,255,0.8); margin:6px 0 0; font-size:13px; }\n' +
'    .body { padding:32px 40px; color:#1f2937; }\n' +
'    .body h2 { font-size:18px; font-weight:600; margin:0 0 12px; }\n' +
'    .body p { font-size:14px; line-height:1.6; margin:0 0 16px; color:#4b5563; }\n' +
'    .credential-box { background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:16px 20px; margin:16px 0; }\n' +
'    .credential-box .label { font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#9ca3af; margin-bottom:2px; }\n' +
'    .credential-box .value { font-size:15px; font-weight:600; color:#111827; margin-bottom:10px; font-family:"Courier New",monospace; }\n' +
'    .credential-box .value:last-child { margin-bottom:0; }\n' +
'    .btn { display:inline-block; background:linear-gradient(135deg,#6D28D9,#8B5CF6); color:#fff; text-decoration:none; padding:10px 24px; border-radius:8px; font-weight:600; font-size:13px; }\n' +
'    .footer { padding:20px 40px; background:#f9fafb; text-align:center; }\n' +
'    .footer p { font-size:12px; color:#9ca3af; margin:0; }\n' +
'  </style>\n' +
'</head>\n' +
'<body>\n' +
'  <div class="wrapper">\n' +
'    <div class="container">\n' +
'      <div class="header">\n' +
'        <h1>\uD83C\uDFEB Dwaraka Academy</h1>\n' +
'        <p>Excellence in Education Since 2020</p>\n' +
'      </div>\n' +
'      <div class="body">\n' +
        bodyHtml + '\n' +
'      </div>\n' +
'      <div class="footer">\n' +
'        <p>Dwaraka Academy — Excellence in Education Since 2020</p>\n' +
'        <p style="margin-top:6px">This is an automated message. Please do not reply.</p>\n' +
'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'</body>\n' +
'</html>';
}

function welcomeEmail({ name, email, username, tempPassword, role, subject }) {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const usernameHtml = (username && username !== email)
    ? '<div class="label">Username / Admission No</div><div class="value">' + username + '</div>'
    : '';
  const bodyHtml =
    '<h2>Welcome to Dwaraka Academy</h2>' +
    '<p>Hello <strong>' + name + '</strong>,</p>' +
    '<p>A ' + roleLabel + ' account has been created for you. Use the credentials below to sign in.</p>' +
    '<div class="credential-box">' +
      '<div class="label">Email</div>' +
      '<div class="value">' + email + '</div>' +
      usernameHtml +
      '<div class="label">Temporary Password</div>' +
      '<div class="value">' + tempPassword + '</div>' +
    '</div>' +
    '<p style="color:#ef4444;font-size:13px;font-weight:500;">&#9888; You will be required to change this password on your first login.</p>' +
    '<p style="text-align:center;margin-top:20px;">' +
      '<a class="btn" href="' + (env.CORS_ORIGIN || 'http://localhost:3000') + '/login">Sign In to Portal</a>' +
    '</p>';
  return {
    subject: subject || 'Your ' + roleLabel + ' Account \u2014 Dwaraka Academy',
    html: baseTemplate('Welcome', bodyHtml),
    text: 'Welcome to Dwaraka Academy, ' + name + '!\n\nA ' + roleLabel + ' account has been created for you.\n\nEmail: ' + email + '\n' + (username && username !== email ? 'Username: ' + username + '\n' : '') + 'Temporary password: ' + tempPassword + '\n\nPlease log in and change your password immediately.',
  };
}

function resetPasswordEmail({ name, email, tempPassword, role }) {
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) + ' ' : '';
  const bodyHtml =
    '<h2>Password Reset</h2>' +
    '<p>Hello <strong>' + name + '</strong>,</p>' +
    '<p>Your ' + roleLabel + 'password has been reset as requested.</p>' +
    '<div class="credential-box">' +
      '<div class="label">Email</div>' +
      '<div class="value">' + email + '</div>' +
      '<div class="label">Temporary Password</div>' +
      '<div class="value">' + tempPassword + '</div>' +
    '</div>' +
    '<p style="color:#ef4444;font-size:13px;font-weight:500;">&#9888; You will be required to set a new password on your next login.</p>' +
    '<p style="text-align:center;margin-top:20px;">' +
      '<a class="btn" href="' + (env.CORS_ORIGIN || 'http://localhost:3000') + '/login">Sign In to Portal</a>' +
    '</p>';
  return {
    subject: 'Your Password Has Been Reset \u2014 Dwaraka Academy',
    html: baseTemplate('Password Reset', bodyHtml),
    text: 'Hello ' + name + ',\n\nYour password has been reset.\n\nEmail: ' + email + '\nTemporary password: ' + tempPassword + '\n\nPlease log in and change your password immediately.',
  };
}

function parentApprovalEmail({ parentName, studentName, email, tempPassword }) {
  const bodyHtml =
    '<h2>Parent Account Approved &#10003;</h2>' +
    '<p>Hello <strong>' + parentName + '</strong>,</p>' +
    '<p>Your parent account for <strong>' + studentName + '</strong> at Dwaraka Academy has been approved.</p>' +
    '<p>You can now monitor your child\'s academic progress, including attendance, marks, assignments, and fee status.</p>' +
    '<div class="credential-box">' +
      '<div class="label">Email</div>' +
      '<div class="value">' + email + '</div>' +
      '<div class="label">Temporary Password</div>' +
      '<div class="value">' + tempPassword + '</div>' +
    '</div>' +
    '<p style="color:#ef4444;font-size:13px;font-weight:500;">&#9888; You will be required to change this password on your first login.</p>' +
    '<p style="text-align:center;margin-top:20px;">' +
      '<a class="btn" href="' + (env.CORS_ORIGIN || 'http://localhost:3000') + '/login">Sign In to Portal</a>' +
    '</p>';
  return {
    subject: 'Parent Account Approved \u2014 Dwaraka Academy',
    html: baseTemplate(bodyHtml),
    text: 'Hello ' + opts.parentName + ',\n\nYour parent account for ' + opts.studentName + ' has been approved.\n\nEmail: ' + opts.email + '\nTemporary password: ' + opts.tempPassword + '\n\nPlease log in and change your password immediately.',
  };
}

function passwordChangedEmail(opts) {
  var bodyHtml =
    '<h2>Password Changed</h2>' +
    '<p>Hello <strong>' + opts.name + '</strong>,</p>' +
    '<p>Your password was changed successfully.</p>' +
    '<p>If you did not make this change, contact the academy immediately.</p>' +
    '<p style="text-align:center;margin-top:20px;"><a class="btn" href="' +
    (env.CORS_ORIGIN || 'http://localhost:3000') + '/login">Go to Portal</a></p>';
  return {
    subject: 'Password Changed \u2014 Dwaraka Academy',
    html: baseTemplate(bodyHtml),
    text: 'Hello ' + opts.name + ',\n\nYour Dwaraka Academy password was changed successfully.\n\nIf you did not make this change, please contact the academy administration immediately.',
  };
}

module.exports = {
  sendMail: sendMail,
  initTransporter: initTransporter,
  welcomeEmail: welcomeEmail,
  resetPasswordEmail: resetPasswordEmail,
  parentApprovalEmail: parentApprovalEmail,
  passwordChangedEmail: passwordChangedEmail,
  getEtherealPreviewUrl: function() { return etherealPreviewUrl; },
}
