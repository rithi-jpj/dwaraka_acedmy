const { z } = require('zod');
const { Subject, Batch, Enrollment, User, Attendance, Mark } = require('../models');

// Subjects
exports.listSubjects = async (_req, res) => res.json(await Subject.findAll({ order: [['name', 'ASC']] }));
exports.createSubject = async (req, res) => {
  const d = z.object({ name: z.string().min(1), description: z.string().optional() }).parse(req.body);
  res.status(201).json(await Subject.create(d));
};
exports.deleteSubject = async (req, res) => {
  const s = await Subject.findByPk(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  await s.destroy();
  res.json({ ok: true });
};

// Batches
exports.listBatches = async (req, res) => {
  const where = {};
  if (req.user.role === 'teacher') where.teacher_id = req.user.id;
  const batches = await Batch.findAll({
    where,
    include: [Subject, { model: User, as: 'teacher', attributes: ['id', 'name', 'email'] }],
    order: [['created_at', 'DESC']],
  });
  res.json(batches);
};
exports.createBatch = async (req, res) => {
  const d = z.object({
    name: z.string().min(1),
    subject_id: z.string().uuid(),
    teacher_id: z.string().uuid(),
    schedule: z.string().optional(),
  }).parse(req.body);
  res.status(201).json(await Batch.create(d));
};

// Enrollments
exports.enroll = async (req, res) => {
  const d = z.object({ student_id: z.string().uuid(), batch_id: z.string().uuid() }).parse(req.body);
  const [row] = await Enrollment.findOrCreate({ where: d, defaults: d });
  res.status(201).json(row);
};
exports.batchStudents = async (req, res) => {
  const rows = await Enrollment.findAll({
    where: { batch_id: req.params.id },
    include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email'] }],
  });
  res.json(rows.map(r => r.student));
};

// Attendance
exports.markAttendance = async (req, res) => {
  const d = z.object({
    batch_id: z.string().uuid(),
    date: z.string(),
    entries: z.array(z.object({
      student_id: z.string().uuid(),
      status: z.enum(['present', 'absent', 'late']),
      remarks: z.string().optional(),
    })),
  }).parse(req.body);
  const results = [];
  for (const e of d.entries) {
    const [row] = await Attendance.upsert({
      batch_id: d.batch_id, date: d.date,
      student_id: e.student_id, status: e.status, remarks: e.remarks,
    });
    results.push(row);
  }
  res.json({ ok: true, count: results.length });
};
exports.getAttendance = async (req, res) => {
  const where = { batch_id: req.params.batchId };
  if (req.query.date) where.date = req.query.date;
  const rows = await Attendance.findAll({
    where,
    include: [{ model: User, as: 'student', attributes: ['id', 'name'] }],
    order: [['date', 'DESC']],
  });
  res.json(rows);
};
exports.myAttendance = async (req, res) => {
  const rows = await Attendance.findAll({
    where: { student_id: req.user.id },
    order: [['date', 'DESC']],
  });
  res.json(rows);
};

// Marks
exports.addMark = async (req, res) => {
  const d = z.object({
    batch_id: z.string().uuid(),
    student_id: z.string().uuid(),
    exam_name: z.string().min(1),
    score: z.number(),
    max_score: z.number(),
    exam_date: z.string().optional(),
  }).parse(req.body);
  res.status(201).json(await Mark.create(d));
};
exports.batchMarks = async (req, res) => {
  const rows = await Mark.findAll({
    where: { batch_id: req.params.batchId },
    include: [{ model: User, as: 'student', attributes: ['id', 'name'] }],
    order: [['exam_date', 'DESC']],
  });
  res.json(rows);
};
exports.myMarks = async (req, res) => {
  const rows = await Mark.findAll({ where: { student_id: req.user.id } });
  res.json(rows);
};
