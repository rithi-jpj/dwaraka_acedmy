const { z } = require('zod');
const { User } = require('../models');
const { hash, randomPassword } = require('../utils/password');
const { sendMail } = require('../utils/mailer');

exports.list = async (req, res) => {
  const { role } = req.query;
  const where = {};
  if (role) where.role = role;
  const users = await User.findAll({ where, order: [['created_at', 'DESC']] });
  res.json(users.map(publicUser));
};

exports.create = async (req, res) => {
  const data = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    role: z.enum(['admin', 'teacher', 'student']),
  }).parse(req.body);

  const tempPassword = randomPassword(10);
  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    phone: data.phone,
    role: data.role,
    password_hash: await hash(tempPassword),
    must_change_password: true,
  });

  await sendMail({
    to: user.email,
    subject: 'Your Dwaraka Academy account',
    text: `Hello ${user.name},\n\nYour account has been created.\nEmail: ${user.email}\nTemporary password: ${tempPassword}\n\nPlease log in and change your password immediately.`,
  }).catch(() => {});

  console.log(`[user:created] ${user.email} temp_password=${tempPassword}`);
  res.status(201).json({ user: publicUser(user), tempPassword });
};

exports.update = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const data = z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    is_active: z.boolean().optional(),
  }).parse(req.body);
  Object.assign(user, data);
  await user.save();
  res.json(publicUser(user));
};

exports.resetPassword = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const tempPassword = randomPassword(10);
  user.password_hash = await hash(tempPassword);
  user.must_change_password = true;
  await user.save();
  console.log(`[user:reset] ${user.email} temp_password=${tempPassword}`);
  res.json({ tempPassword });
};

exports.remove = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  await user.destroy();
  res.json({ ok: true });
};

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role,
    must_change_password: u.must_change_password, is_active: u.is_active,
    created_at: u.created_at };
}
