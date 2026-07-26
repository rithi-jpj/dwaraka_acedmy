const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const BCRYPT_ROUNDS = 12;

const hash = (pw) => bcrypt.hash(pw, BCRYPT_ROUNDS);
const compare = (pw, h) => bcrypt.compare(pw, h);

/**
 * Generate a numeric-only temporary password of the given length.
 */
const randomPassword = (len = 8) => {
  const max = Math.pow(10, len);
  const min = Math.pow(10, len - 1);
  return String(Math.floor(Math.random() * (max - min) + min));
};

/**
 * Generate a cryptographically secure random temporary password 
 * (alphanumeric + special chars) of given length.
 */
const randomSecurePassword = (len = 12) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
  let pw = '';
  const bytes = crypto.randomBytes(len);
  for (let i = 0; i < len; i++) {
    pw += chars[bytes[i] % chars.length];
  }
  return pw;
};

/**
 * Validate that a password meets the strong password policy:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 */
function validateStrongPassword(password) {
  const errors = [];
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  return errors;
}

module.exports = { hash, compare, randomPassword, randomSecurePassword, validateStrongPassword };
