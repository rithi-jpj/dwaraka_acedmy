const { z } = require('zod');
const { Class, User, Subject, Enrollment, Batch } = require('../models');
const { Op, fn, col } = require('sequelize');

// Admin: List classes with search, filter, pagination, sorting
exports.list = async (req, res) => {
  const {
    page = '1', limit = '20', search = '', sort_by = 'name', sort_order = 'ASC',
    is_active, teacher_id, subject_id, academic_year,
  } = req.query;

  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (p - 1) * l;

  const allowedSort = ['name', 'section', 'room', 'academic_year', 'is_active', 'created_at'];
  const sortField = allowedSort.includes(sort_by) ? sort_by : 'name';
  const sortDir = sort_order === 'DESC' ? 'DESC' : 'ASC';

  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { section: { [Op.iLike]: `%${search}%` } },
      { room: { [Op.iLike]: `%${search}%` } },
      { academic_year: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (is_active !== undefined && is_active !== '') {
    where.is_active = is_active === 'true';
  }
  if (teacher_id) where.teacher_id = teacher_id;
  if (subject_id) where.subject_id = subject_id;
  if (academic_year) where.academic_year = academic_year;

  const { rows, count } = await Class.findAndCountAll({
    where,
    include: [
      { model: User, as: 'teacher', attributes: ['id', 'name', 'email'] },
      { model: Subject, attributes: ['id', 'name'] },
    ],
    order: [[sortField, sortDir]],
    limit: l,
    offset,
  });

  // Get student counts per class (via batches that share the subject/teacher)
  const classIds = rows.map(c => c.id);
  const batches = await Batch.findAll({
    where: { teacher_id: rows.map(r => r.teacher_id) },
    attributes: ['id', 'teacher_id', 'subject_id'],
  });

  // For each class, count how many students are enrolled in matching batches
  const studentCountMap = {};
  for (const cls of rows) {
    const matchingBatches = batches.filter(b =>
      b.teacher_id === cls.teacher_id && b.subject_id === cls.subject_id
    );
    const batchIds = matchingBatches.map(b => b.id);
    if (batchIds.length > 0) {
      const enrollCount = await Enrollment.count({
        where: { batch_id: batchIds },
        distinct: true,
        col: 'student_id',
      });
      studentCountMap[cls.id] = enrollCount;
    } else {
      studentCountMap[cls.id] = 0;
    }
  }

  // Get distinct academic years for filter dropdown
  const years = await Class.findAll({
    where: { academic_year: { [Op.ne]: null } },
    attributes: [[fn('DISTINCT', col('academic_year')), 'year']],
    raw: true,
  });

  res.json({
    classes: rows.map(c => ({
      id: c.id,
      name: c.name,
      section: c.section,
      room: c.room,
      schedule: c.schedule,
      academic_year: c.academic_year,
      is_active: c.is_active,
      created_at: c.created_at,
      teacher: c.teacher ? { id: c.teacher.id, name: c.teacher.name, email: c.teacher.email } : null,
      subject: c.Subject ? { id: c.Subject.id, name: c.Subject.name } : null,
      student_count: studentCountMap[c.id] || 0,
    })),
    pagination: { page: p, limit: l, total: count, pages: Math.ceil(count / l) },
    filters: { academic_years: years.map(y => y.year).filter(Boolean).sort() },
  });
};

// Admin: Get class by ID
exports.getById = async (req, res) => {
  const cls = await Class.findByPk(req.params.id, {
    include: [
      { model: User, as: 'teacher', attributes: ['id', 'name', 'email'] },
      { model: Subject, attributes: ['id', 'name'] },
    ],
  });
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  // Count students in matching batches
  const batches = await Batch.findAll({
    where: { teacher_id: cls.teacher_id, subject_id: cls.subject_id },
    attributes: ['id'],
  });
  const batchIds = batches.map(b => b.id);
  const studentCount = batchIds.length > 0
    ? await Enrollment.count({ where: { batch_id: batchIds }, distinct: true, col: 'student_id' })
    : 0;

  res.json({
    id: cls.id,
    name: cls.name,
    section: cls.section,
    room: cls.room,
    schedule: cls.schedule,
    academic_year: cls.academic_year,
    is_active: cls.is_active,
    created_at: cls.created_at,
    teacher: cls.teacher ? { id: cls.teacher.id, name: cls.teacher.name, email: cls.teacher.email } : null,
    subject: cls.Subject ? { id: cls.Subject.id, name: cls.Subject.name } : null,
    student_count: studentCount,
  });
};

// Admin: Create class
exports.create = async (req, res) => {
  const data = z.object({
    name: z.string().min(1, 'Class name is required'),
    section: z.string().optional(),
    room: z.string().optional(),
    schedule: z.string().optional(),
    teacher_id: z.string().uuid('Teacher is required'),
    subject_id: z.string().uuid('Subject is required'),
    academic_year: z.string().optional(),
  }).strip().parse(req.body);

  // Verify teacher exists
  const teacher = await User.findOne({ where: { id: data.teacher_id, role: 'teacher' } });
  if (!teacher) return res.status(400).json({ error: 'Selected teacher not found' });

  // Verify subject exists
  const subject = await Subject.findByPk(data.subject_id);
  if (!subject) return res.status(400).json({ error: 'Selected subject not found' });

  const cls = await Class.create(data);
  res.status(201).json({
    id: cls.id,
    name: cls.name,
    section: cls.section,
    room: cls.room,
    schedule: cls.schedule,
    academic_year: cls.academic_year,
    is_active: cls.is_active,
    teacher: { id: teacher.id, name: teacher.name },
    subject: { id: subject.id, name: subject.name },
    student_count: 0,
  });
};

// Admin: Update class
exports.update = async (req, res) => {
  const cls = await Class.findByPk(req.params.id);
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  const data = z.object({
    name: z.string().min(1).optional(),
    section: z.string().optional(),
    room: z.string().optional(),
    schedule: z.string().optional(),
    teacher_id: z.string().uuid().optional(),
    subject_id: z.string().uuid().optional(),
    academic_year: z.string().optional(),
    is_active: z.boolean().optional(),
  }).strip().parse(req.body);

  // Verify teacher if changed
  if (data.teacher_id) {
    const teacher = await User.findOne({ where: { id: data.teacher_id, role: 'teacher' } });
    if (!teacher) return res.status(400).json({ error: 'Selected teacher not found' });
  }

  // Verify subject if changed
  if (data.subject_id) {
    const subject = await Subject.findByPk(data.subject_id);
    if (!subject) return res.status(400).json({ error: 'Selected subject not found' });
  }

  Object.assign(cls, data);
  await cls.save();

  // Reload with includes
  const updated = await Class.findByPk(cls.id, {
    include: [
      { model: User, as: 'teacher', attributes: ['id', 'name'] },
      { model: Subject, attributes: ['id', 'name'] },
    ],
  });

  res.json({
    id: updated.id,
    name: updated.name,
    section: updated.section,
    room: updated.room,
    schedule: updated.schedule,
    academic_year: updated.academic_year,
    is_active: updated.is_active,
    teacher: updated.teacher ? { id: updated.teacher.id, name: updated.teacher.name } : null,
    subject: updated.Subject ? { id: updated.Subject.id, name: updated.Subject.name } : null,
  });
};

// Admin: Delete class (blocked if students enrolled)
exports.remove = async (req, res) => {
  const cls = await Class.findByPk(req.params.id);
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  // Check for enrolled students via matching batches
  const batches = await Batch.findAll({
    where: { teacher_id: cls.teacher_id, subject_id: cls.subject_id },
    attributes: ['id'],
  });
  const batchIds = batches.map(b => b.id);
  if (batchIds.length > 0) {
    const studentCount = await Enrollment.count({
      where: { batch_id: batchIds },
      distinct: true, col: 'student_id',
    });
    if (studentCount > 0) {
      return res.status(409).json({
        error: `Cannot delete: ${studentCount} student(s) are enrolled in this class. Remove enrollments first.`,
      });
    }
  }

  await cls.destroy();
  res.json({ ok: true });
};
