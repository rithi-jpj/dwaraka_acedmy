const jwt = require('jsonwebtoken');
const { z } = require('zod');
const env = require('../config/env');
const { User } = require('../models');
const { hash, compare } = require('../utils/password');

function sign(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

exports.login = async (req, res) => {
  const { email, password } = z.object({
    email: z.string().email(), password: z.string().min(1),
  }).parse(req.body);

  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user || !user.is_active) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  res.json({
    token: sign(user),
    user: publicUser(user),
  });
};

exports.me = async (req, res) => {
  res.json({ user: publicUser(req.user) });
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  }).parse(req.body);

  const ok = await compare(currentPassword, req.user.password_hash);
  if (!ok) return res.status(400).json({ error: 'Current password is incorrect' });

  req.user.password_hash = await hash(newPassword);
  req.user.must_change_password = false;
  await req.user.save();
  res.json({ ok: true });
};

function publicUser(u) {
  return {
    id: u.id, name: u.name, email: u.email, phone: u.phone,
    role: u.role, must_change_password: u.must_change_password,
    is_active: u.is_active,
  };
}
