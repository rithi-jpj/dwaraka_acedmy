const { z } = require('zod');
const { Op } = require('sequelize');
const { User } = require('../models');
const { hash, randomPassword } = require('../utils/password');
const { sendMail, welcomeEmail, resetPasswordEmail } = require('../utils/mailer');

// Helper to generate admission number
async function generateAdmissionNo() {
  const prefix = 'STU' + new Date().getFullYear();
  const last = await User.findOne({
    where: { admission_no: { [Op.like]: `${prefix}%` } },
    order: [['admission_no', 'DESC']],
  });
  const seq = last ? String(parseInt(last.admission_no.slice(-4)) + 1).padStart(4, '0') : '0001';
  return `${prefix}${seq}`;
}

exports.list = async (req, res) => {
  const parsed = z.object({ role: z.string().optional() }).strip().parse(req.query);
  const where = {};
  if (parsed.role) where.role = parsed.role;
  const users = await User.findAll({ where, order: [['created_at', 'DESC']] });
  res.json(users.map(publicUser));
};

exports.create = async (req, res) => {
  const data = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    role: z.enum(['admin', 'teacher', 'student']),
  }).strip().parse(req.body);

  const tempPassword = randomPassword(10);
  
  const userData = {
    name: data.name,
    email: data.email.toLowerCase(),
    phone: data.phone,
    role: data.role,
    password_hash: await hash(tempPassword),
    must_change_password: true,
  };

  // Auto-generate admission number for students
  if (data.role === 'student') {
    userData.admission_no = await generateAdmissionNo();
  }

  const user = await User.create(userData);

  await sendMail({
    to: user.email,
    ...welcomeEmail({ name: user.name, email: user.email, username: user.admission_no || user.email, tempPassword, role: user.role }),
  }).catch(() => {});

  const ts = new Date().toISOString();
  console.log(`[security] ${ts} event=user_created`, JSON.stringify({
    userId: user.id, email: user.email, role: user.role, createdBy: req.user?.id,
  }));
  res.status(201).json({ user: publicUser(user), tempPassword });
};

exports.update = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const data = z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    is_active: z.boolean().optional(),
  }).strip().parse(req.body);
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
  sendMail({
    to: user.email,
    ...resetPasswordEmail({ name: user.name, email: user.email, tempPassword, role: user.role }),
  }).catch(() => {});

  console.log(`[user:reset] ${user.email} temp_password=${tempPassword}`);
  res.json({ tempPassword });
};

exports.remove = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  try {
    await user.destroy();
    const ts = new Date().toISOString();
    console.log(`[security] ${ts} event=user_deleted`, JSON.stringify({
      userId: user.id, email: user.email, role: user.role, deletedBy: req.user?.id,
    }));
    res.json({ ok: true, message: 'User deleted permanently' });
  } catch (err) {
    if (err.parent && err.parent.code === '23503') {
      return res.status(409).json({ error: 'Cannot delete: this user has related records (enrollments, attendance, marks, etc.). Remove those first.' });
    }
    throw err;
  }
};

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role,
    must_change_password: u.must_change_password, is_active: u.is_active,
    created_at: u.created_at, admission_no: u.admission_no };
}
