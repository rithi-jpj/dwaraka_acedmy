const { z } = require('zod');
const { Op, fn, col } = require('sequelize');
const { User, Subject, Batch, Enrollment } = require('../models');
const { hash, randomPassword } = require('../utils/password');
const { sendMail, welcomeEmail, resetPasswordEmail } = require('../utils/mailer');

exports.list = async (req, res) => {
  const {
    page = '1',
    limit = '20',
    search = '',
    is_active,
    sort_by = 'created_at',
    sort_order = 'DESC',
  } = req.query;

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const where = { role: 'teacher' };

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (is_active !== undefined && is_active !== '') {
    where.is_active = is_active === 'true';
  }

  const allowedSort = ['name', 'email', 'created_at', 'is_active'];
  const orderField = allowedSort.includes(sort_by) ? sort_by : 'created_at';
  const order = sort_order === 'ASC' ? 'ASC' : 'DESC';

  const { count, rows } = await User.findAndCountAll({
    where,
    order: [[orderField, order]],
    offset,
    limit: Math.min(parseInt(limit, 10), 100),
  });

  // Fetch batch counts for each teacher
  const teacherIds = rows.map(r => r.id);
  const batchCounts = await Batch.findAll({
    where: { teacher_id: teacherIds },
    attributes: ['teacher_id', [fn('COUNT', col('id')), 'count']],
    group: ['teacher_id'],
  });
  const batchCountMap = {};
  for (const b of batchCounts) {
    batchCountMap[b.teacher_id] = parseInt(b.dataValues?.count ?? b.count ?? 0, 10);
  }

  // Fetch student counts per teacher (via batches -> enrollments)
  const batches = await Batch.findAll({
    where: { teacher_id: teacherIds },
    attributes: ['id', 'teacher_id'],
  });
  const batchIdsByTeacher = {};
  for (const b of batches) {
    if (!batchIdsByTeacher[b.teacher_id]) batchIdsByTeacher[b.teacher_id] = [];
    batchIdsByTeacher[b.teacher_id].push(b.id);
  }
  const allBatchIds = batches.map(b => b.id);

  // Get distinct student counts per batch (not just batch count)
  const enrollments = await Enrollment.findAll({
    where: { batch_id: allBatchIds },
    attributes: ['batch_id', [fn('COUNT', col('id')), 'count']],
    group: ['batch_id'],
  });
  const studentCountByBatch = {};
  for (const e of enrollments) {
    studentCountByBatch[e.batch_id] = parseInt(e.dataValues?.count ?? e.count ?? 0, 10);
  }
  const studentCountMap = {};
  for (const [teacherId, bIds] of Object.entries(batchIdsByTeacher)) {
    studentCountMap[teacherId] = bIds.reduce((sum, bid) => sum + (studentCountByBatch[bid] || 0), 0);
  }

  const teachers = rows.map(u => ({
    ...publicUser(u),
    batch_count: batchCountMap[u.id] || 0,
    student_count: studentCountMap[u.id] || 0,
  }));

  res.json({
    teachers,
    pagination: {
      page: Math.max(1, parseInt(page, 10)),
      limit: Math.min(parseInt(limit, 10), 100),
      total: count,
      total_pages: Math.ceil(count / Math.min(parseInt(limit, 10), 100)),
    },
  });
};

exports.getById = async (req, res) => {
  const teacher = await User.findOne({
    where: { id: req.params.id, role: 'teacher' },
  });
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

  const batches = await Batch.findAll({
    where: { teacher_id: teacher.id },
    include: [{ model: Subject, attributes: ['id', 'name'] }],
    order: [['created_at', 'DESC']],
  });

  res.json({
    teacher: publicUser(teacher),
    batches: batches.map(b => ({
      id: b.id,
      name: b.name,
      subject: b.Subject?.name || 'Unknown',
      schedule: b.schedule,
      is_active: b.is_active,
      created_at: b.created_at,
    })),
  });
};

exports.create = async (req, res) => {
  const data = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
  }).strip().parse(req.body);

  const existing = await User.findOne({ where: { email: data.email.toLowerCase() } });
  if (existing) {
    return res.status(409).json({ error: 'A user with this email already exists' });
  }

  const tempPassword = randomPassword(10);
  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    phone: data.phone || null,
    role: 'teacher',
    password_hash: await hash(tempPassword),
    must_change_password: true,
  });

  await sendMail({
    to: user.email,
    ...welcomeEmail({ name: user.name, email: user.email, tempPassword, role: 'teacher', subject: 'Welcome to Dwaraka Academy — Your Teacher Account' }),
  }).catch(() => {});

  console.log(`[teacher:created] ${user.email} temp_password=${tempPassword}`);

  res.status(201).json({
    teacher: publicUser(user),
    tempPassword,
  });
};

exports.update = async (req, res) => {
  const teacher = await User.findOne({
    where: { id: req.params.id, role: 'teacher' },
  });
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

  const data = z.object({
    name: z.string().min(1).optional(),
    phone: z.string().optional(),
    is_active: z.boolean().optional(),
  }).strip().parse(req.body);

  Object.assign(teacher, data);
  await teacher.save();
  res.json({ teacher: publicUser(teacher) });
};

exports.remove = async (req, res) => {
  const teacher = await User.findOne({
    where: { id: req.params.id, role: 'teacher' },
  });
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

  // Check if teacher has active batches
  const batchCount = await Batch.count({ where: { teacher_id: teacher.id } });
  if (batchCount > 0) {
    return res.status(400).json({
      error: `Cannot delete teacher with ${batchCount} assigned batch(es). Reassign or delete batches first.`,
    });
  }

  await teacher.destroy();
  res.json({ ok: true, message: 'Teacher deleted successfully' });
};

exports.resetPassword = async (req, res) => {
  const teacher = await User.findOne({
    where: { id: req.params.id, role: 'teacher' },
  });
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

  const tempPassword = randomPassword(10);
  teacher.password_hash = await hash(tempPassword);
  teacher.must_change_password = true;
  await teacher.save();

  sendMail({
    to: teacher.email,
    ...resetPasswordEmail({ name: teacher.name, email: teacher.email, tempPassword, role: 'teacher' }),
  }).catch(() => {});

  console.log(`[teacher:reset] ${teacher.email} temp_password=${tempPassword}`);
  res.json({ tempPassword });
};

function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    is_active: u.is_active,
    must_change_password: u.must_change_password,
    created_at: u.created_at,
    updated_at: u.updated_at,
  };
}
