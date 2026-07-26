const { z } = require('zod');
const { Op, fn, col } = require('sequelize');
const { Batch, Subject, User, Enrollment, Attendance } = require('../models');

exports.list = async (req, res) => {
  const {
    page = '1', limit = '20', search = '', shift, is_active,
    sort_by = 'created_at', sort_order = 'DESC',
  } = req.query;

  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (p - 1) * l;

  const where = {};

  // Teacher scoping
  if (req.user.role === 'teacher') {
    where.teacher_id = req.user.id;
  }

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { shift: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (shift) where.shift = shift;
  if (is_active !== undefined && is_active !== '') {
    where.is_active = is_active === 'true';
  }

  const allowedSort = ['name', 'shift', 'start_time', 'is_active', 'max_capacity', 'created_at'];
  const sortField = allowedSort.includes(sort_by) ? sort_by : 'created_at';
  const sortDir = sort_order === 'ASC' ? 'ASC' : 'DESC';

  const { rows, count } = await Batch.findAndCountAll({
    where,
    include: [
      { model: Subject, attributes: ['id', 'name'] },
      { model: User, as: 'teacher', attributes: ['id', 'name', 'email'] },
    ],
    order: [[sortField, sortDir], ['name', 'ASC']],
    limit: l,
    offset,
  });

  // Attach student counts
  const batches = await Promise.all(rows.map(async (b) => {
    const studentCount = await Enrollment.count({ where: { batch_id: b.id } });
    const today = new Date().toISOString().split('T')[0];
    const presentToday = await Attendance.count({
      where: { batch_id: b.id, date: today, status: 'present' },
    });
    return {
      ...b.toJSON(),
      student_count: studentCount,
      present_today: presentToday,
    };
  }));

  res.json({
    batches,
    pagination: { page: p, limit: l, total: count, pages: Math.ceil(count / l) },
  });
};

exports.getById = async (req, res) => {
  const batch = await Batch.findByPk(req.params.id, {
    include: [
      { model: Subject, attributes: ['id', 'name'] },
      { model: User, as: 'teacher', attributes: ['id', 'name', 'email'] },
    ],
  });
  if (!batch) return res.status(404).json({ error: 'Batch not found' });

  const studentCount = await Enrollment.count({ where: { batch_id: batch.id } });

  // Get enrolled students
  const enrollments = await Enrollment.findAll({
    where: { batch_id: batch.id },
    include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email', 'admission_no'] }],
  });

  res.json({
    ...batch.toJSON(),
    student_count: studentCount,
    students: enrollments.map(e => e.student),
  });
};

exports.create = async (req, res) => {
  const data = z.object({
    name: z.string().min(1),
    subject_id: z.string().uuid(),
    teacher_id: z.string().uuid(),
    shift: z.enum(['morning', 'evening']).optional().default('morning'),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    max_capacity: z.number().int().min(1).optional().default(30),
    description: z.string().optional(),
    schedule: z.string().optional(),
    is_active: z.boolean().optional().default(true),
  }).strip().parse(req.body);

  const batch = await Batch.create(data);

  const full = await Batch.findByPk(batch.id, {
    include: [
      { model: Subject, attributes: ['id', 'name'] },
      { model: User, as: 'teacher', attributes: ['id', 'name'] },
    ],
  });

  const io = req.app.get('io');
  if (io.refreshAnalytics) io.refreshAnalytics();

  res.status(201).json(full);
};

exports.update = async (req, res) => {
  const batch = await Batch.findByPk(req.params.id);
  if (!batch) return res.status(404).json({ error: 'Batch not found' });

  const data = z.object({
    name: z.string().min(1).optional(),
    subject_id: z.string().uuid().optional(),
    teacher_id: z.string().uuid().optional(),
    shift: z.enum(['morning', 'evening']).optional(),
    start_time: z.string().optional().nullable(),
    end_time: z.string().optional().nullable(),
    max_capacity: z.number().int().min(1).optional(),
    description: z.string().optional().nullable(),
    schedule: z.string().optional().nullable(),
    is_active: z.boolean().optional(),
  }).strip().parse(req.body);

  Object.assign(batch, data);
  await batch.save();

  const full = await Batch.findByPk(batch.id, {
    include: [
      { model: Subject, attributes: ['id', 'name'] },
      { model: User, as: 'teacher', attributes: ['id', 'name'] },
    ],
  });

  const io = req.app.get('io');
  if (io.refreshAnalytics) io.refreshAnalytics();

  res.json(full);
};

exports.remove = async (req, res) => {
  const batch = await Batch.findByPk(req.params.id);
  if (!batch) return res.status(404).json({ error: 'Batch not found' });

  // Check if students are enrolled
  const enrollCount = await Enrollment.count({ where: { batch_id: batch.id } });
  if (enrollCount > 0) {
    return res.status(409).json({
      error: `Cannot delete: ${enrollCount} student(s) are enrolled in this batch. Remove enrollments first.`,
    });
  }

  await batch.destroy();
  const io = req.app.get('io');
  if (io.refreshAnalytics) io.refreshAnalytics();
  res.json({ ok: true });
};

// Get enrolled students for a batch (teacher-scoped)
exports.students = async (req, res) => {
  const batch = await Batch.findByPk(req.params.id);
  if (!batch) return res.status(404).json({ error: 'Batch not found' });

  // Teacher scoping
  if (req.user.role === 'teacher' && batch.teacher_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only view students in your own batches' });
  }

  const enrollments = await Enrollment.findAll({
    where: { batch_id: batch.id },
    include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email', 'admission_no', 'roll_no', 'current_class'] }],
  });

  res.json(enrollments.map(e => e.student));
};

// Get teacher's batches (for dropdowns)
exports.myBatches = async (req, res) => {
  const where = {};
  if (req.user.role === 'teacher') {
    where.teacher_id = req.user.id;
  }

  const batches = await Batch.findAll({
    where: { ...where, is_active: true },
    include: [{ model: Subject, attributes: ['id', 'name'] }],
    order: [['shift', 'ASC'], ['name', 'ASC']],
  });

  res.json(batches);
};

// Enroll a student in a batch (replaces existing enrollment)
exports.enrollStudent = async (req, res) => {
  const data = z.object({
    student_id: z.string().uuid(),
  }).strip().parse(req.body);

  const batch = await Batch.findByPk(req.params.id);
  if (!batch) return res.status(404).json({ error: 'Batch not found' });

  const student = await User.findOne({ where: { id: data.student_id, role: 'student' } });
  if (!student) return res.status(404).json({ error: 'Student not found' });

  // Check capacity
  const currentCount = await Enrollment.count({ where: { batch_id: batch.id } });
  if (batch.max_capacity && currentCount >= batch.max_capacity) {
    return res.status(400).json({ error: 'Batch has reached maximum capacity' });
  }

  // Remove existing enrollment for this student in any batch (one batch per student)
  await Enrollment.destroy({ where: { student_id: data.student_id } });

  // Create new enrollment
  const enrollment = await Enrollment.create({
    student_id: data.student_id,
    batch_id: batch.id,
  });

  res.status(201).json(enrollment);
};

// Unenroll a student from a batch
exports.unenrollStudent = async (req, res) => {
  const deleted = await Enrollment.destroy({
    where: { batch_id: req.params.id, student_id: req.params.studentId },
  });
  if (!deleted) return res.status(404).json({ error: 'Enrollment not found' });
  res.json({ ok: true });
};
