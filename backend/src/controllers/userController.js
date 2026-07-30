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
  const {
    page = '1', limit = '20', search = '', role,
    sort_by = 'created_at', sort_order = 'DESC',
  } = req.query;

  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (p - 1) * l;

  const where = {};
  if (role) where.role = role;

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const allowedSort = ['name', 'email', 'role', 'created_at', 'is_active'];
  const sortField = allowedSort.includes(sort_by) ? sort_by : 'created_at';
  const sortDir = sort_order === 'ASC' ? 'ASC' : 'DESC';

  const { rows, count } = await User.findAndCountAll({
    where,
    order: [[sortField, sortDir]],
    limit: l,
    offset,
  });

  res.json({
    users: rows.map(publicUser),
    pagination: { page: p, limit: l, total: count, pages: Math.ceil(count / l) },
  });
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

  // Prevent self-deletion
  if (req.user && req.user.id === user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account.' });
  }

  // Delegate to student cascading delete logic
  if (user.role === 'student') {
    // Forward to the student controller's remove logic
    const students = require('./studentController');
    return students.remove(req, res);
  }

  try {
    if (user.role === 'teacher') {
      // Check if teacher has assigned batches
      const { Batch } = require('../models');
      const batchCount = await Batch.count({ where: { teacher_id: user.id } });
      if (batchCount > 0) {
        return res.status(409).json({
          error: `Cannot delete: this teacher has ${batchCount} assigned batch(es). Reassign or delete batches first.`
        });
      }
    }

    if (user.role === 'parent') {
      // Parent links have CASCADE onDelete, so they'll be auto-removed
      // No additional checks needed
    }

    await user.destroy();
    const ts = new Date().toISOString();
    console.log(`[security] ${ts} event=user_deleted`, JSON.stringify({
      userId: user.id, email: user.email, role: user.role, deletedBy: req.user?.id,
    }));

    const io = req.app.get('io');
    if (io && io.refreshAnalytics) io.refreshAnalytics();

    res.json({ ok: true, message: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} \"${user.name}\" deleted permanently` });
  } catch (err) {
    if (err.parent && err.parent.code === '23503') {
      return res.status(409).json({ error: 'Cannot delete: this user has related records. Remove those first before deleting.' });
    }
    throw err;
  }
};

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role,
    must_change_password: u.must_change_password, is_active: u.is_active,
    created_at: u.created_at, admission_no: u.admission_no };
}
