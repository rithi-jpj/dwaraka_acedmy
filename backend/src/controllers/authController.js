const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { Op } = require('sequelize');
const env = require('../config/env');
const { User } = require('../models');
const { hash, compare, validateStrongPassword } = require('../utils/password');
const { sendMail, resetPasswordEmail, passwordChangedEmail } = require('../utils/mailer');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

function sign(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

/** Log a security event to console with a structured prefix */
function secLog(event, detail = {}) {
  const ts = new Date().toISOString();
  console.log(`[security] ${ts} event=${event}`, JSON.stringify(detail));
}

exports.login = async (req, res) => {
  const parsed = z.object({
    email: z.string().min(1).max(255),
    password: z.string().min(1),
  }).strip().safeParse(req.body);

  if (!parsed.success) {
    // Prevent user enumeration — always return generic error
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const { email, password } = parsed.data;
  const user = await User.findOne({ where: { email: email.toLowerCase() } });

  // Generic response to prevent user enumeration
  if (!user) {
    secLog('login_failed', { email, reason: 'user_not_found' });
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  // Check account lockout
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const remainingMs = new Date(user.locked_until) - new Date();
    const remainingMin = Math.ceil(remainingMs / 60000);
    secLog('login_blocked', { email: user.email, role: user.role, remainingMin });
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  // If lockout expired, reset counter
  if (user.locked_until && new Date(user.locked_until) <= new Date()) {
    user.login_attempts = 0;
    user.locked_until = null;
    await user.save();
  }

  // Check active status
  if (!user.is_active) {
    secLog('login_blocked', { email: user.email, role: user.role, reason: 'inactive' });
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const ok = await compare(password, user.password_hash);
  if (!ok) {
    // Increment failed attempts
    user.login_attempts = (user.login_attempts || 0) + 1;
    secLog('login_failed', { email: user.email, role: user.role, attempt: user.login_attempts });

    if (user.login_attempts >= MAX_LOGIN_ATTEMPTS) {
      user.locked_until = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      secLog('account_locked', { email: user.email, role: user.role, lockedUntil: user.locked_until });
    }
    await user.save();
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  // Successful login — reset counter
  if (user.login_attempts !== 0 || user.locked_until !== null) {
    user.login_attempts = 0;
    user.locked_until = null;
    await user.save();
  }

  secLog('login_success', { email: user.email, role: user.role });
  res.json({
    token: sign(user),
    user: publicUser(user),
  });
};

exports.me = async (req, res) => {
  res.json({ user: publicUser(req.user) });
};

exports.changePassword = async (req, res) => {
  const parsed = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  }).strip().safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors });
  }

  const { currentPassword, newPassword } = parsed.data;

  const ok = await compare(currentPassword, req.user.password_hash);
  if (!ok) {
    secLog('password_change_failed', { userId: req.user.id, email: req.user.email, reason: 'wrong_current' });
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  // Enforce strong password policy
  const pwErrors = validateStrongPassword(newPassword);
  if (pwErrors.length > 0) {
    return res.status(400).json({ error: 'Password does not meet requirements', details: pwErrors });
  }

  req.user.password_hash = await hash(newPassword);
  req.user.must_change_password = false;
  await req.user.save();

  secLog('password_changed', { userId: req.user.id, email: req.user.email });

  // Send confirmation email (non-blocking)
  sendMail({
    to: req.user.email,
    ...passwordChangedEmail({ name: req.user.name, email: req.user.email }),
  }).catch(() => {});

  res.json({ ok: true });
};

exports.forgotPassword = async (req, res) => {
  const parsed = z.object({ email: z.string().min(1).max(255) }).strip().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const { email } = parsed.data;
  const user = await User.findOne({ where: { email: email.toLowerCase() } });

  // Always return the same message to prevent email enumeration
  if (!user) {
    secLog('forgot_password', { email, reason: 'user_not_found' });
    return res.json({ ok: true, message: 'If an account with that email exists, a password reset has been processed.' });
  }

  const { randomSecurePassword } = require('../utils/password');
  const tempPassword = randomSecurePassword(12);
  user.password_hash = await hash(tempPassword);
  user.must_change_password = true;
  // Reset lockout state on password reset
  user.login_attempts = 0;
  user.locked_until = null;
  await user.save();

  secLog('password_reset', { userId: user.id, email: user.email, role: user.role });

  // Send reset email (non-blocking — don't reveal whether send succeeded)
  sendMail({
    to: user.email,
    ...resetPasswordEmail({ name: user.name, email: user.email, tempPassword, role: user.role }),
  }).catch(() => {});

  res.json({ ok: true, message: 'If an account with that email exists, a password reset has been processed.' });
};

function publicUser(u) {
  return {
    id: u.id, name: u.name, email: u.email, phone: u.phone,
    role: u.role, must_change_password: u.must_change_password,
    is_active: u.is_active,
  };
}
