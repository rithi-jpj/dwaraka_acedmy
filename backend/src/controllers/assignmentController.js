const path = require('path');
const fs = require('fs');
const { z } = require('zod');
const { Op } = require('sequelize');
const { Assignment, AssignmentSubmission, Batch, Subject, User, Enrollment } = require('../models');
const env = require('../config/env');

// Helpers
async function getTeacherBatches(teacherId) {
  return await Batch.findAll({
    where: { teacher_id: teacherId },
    include: [{ model: Subject, attributes: ['id', 'name'] }],
    order: [['name', 'ASC']],
  });
}

// ─── Batch list (for assignment creation) ───
exports.listBatches = async (req, res) => {
  if (req.user.role === 'teacher') {
    const batches = await getTeacherBatches(req.user.id);
    return res.json(batches);
  }
  const batches = await Batch.findAll({
    include: [{ model: Subject, attributes: ['id', 'name'] }],
    order: [['name', 'ASC']],
  });
  res.json(batches);
};

// ─── List assignments (teacher/admin see all for their batches, student sees their batches) ───
exports.list = async (req, res) => {
  const { page = '1', limit = '20', search = '', batch_id, status, sort_by = 'created_at', sort_order = 'DESC' } = req.query;
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (p - 1) * l;

  const where = {};
  if (batch_id) where.batch_id = batch_id;

  // Teacher scoping
  if (req.user.role === 'teacher') {
    const batches = await getTeacherBatches(req.user.id);
    const batchIds = batches.map(b => b.id);
    where.batch_id = batch_id ? where.batch_id : { [Op.in]: batchIds };
    if (batch_id && !batchIds.includes(batch_id)) {
      return res.json({ assignments: [], pagination: { page: p, limit: l, total: 0, pages: 0 } });
    }
  }

  // Student scoping — only see assignments for their enrolled batches
  if (req.user.role === 'student') {
    const enrollments = await Enrollment.findAll({
      where: { student_id: req.user.id },
      attributes: ['batch_id'],
    });
    const batchIds = enrollments.map(e => e.batch_id);
    where.batch_id = { [Op.in]: batchIds };
  }

  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  // Status filter (overdue check happens after fetch, so do it in-memory for small sets)
  const allowedSort = ['title', 'due_date', 'created_at'];
  const sortField = allowedSort.includes(sort_by) ? sort_by : 'created_at';
  const sortDir = sort_order === 'ASC' ? 'ASC' : 'DESC';

  const { rows, count } = await Assignment.findAndCountAll({
    where,
    include: [
      { model: Batch, attributes: ['id', 'name'], include: [{ model: Subject, attributes: ['id', 'name'] }] },
      { model: User, as: 'creator', attributes: ['id', 'name'] },
    ],
    order: [[sortField, sortDir]],
    limit: l,
    offset,
  });

  // Attach submission counts and student's own submission
  const assignments = await Promise.all(rows.map(async (a) => {
    const json = a.toJSON();
    const totalStudents = await Enrollment.count({ where: { batch_id: a.batch_id } });
    const submittedCount = await AssignmentSubmission.count({ where: { assignment_id: a.id } });
    let mySubmission = null;
    if (req.user.role === 'student') {
      mySubmission = await AssignmentSubmission.findOne({
        where: { assignment_id: a.id, student_id: req.user.id },
      });
    }
    return {
      ...json,
      total_students: totalStudents,
      submitted_count: submittedCount,
      my_submission: mySubmission,
      is_overdue: a.due_date ? new Date(a.due_date + 'T23:59:59') < new Date() : false,
    };
  }));

  res.json({
    assignments,
    pagination: { page: p, limit: l, total: count, pages: Math.ceil(count / l) },
  });
};

// ─── Get single assignment ───
exports.getById = async (req, res) => {
  const assignment = await Assignment.findByPk(req.params.id, {
    include: [
      { model: Batch, attributes: ['id', 'name'] },
      { model: User, as: 'creator', attributes: ['id', 'name'] },
    ],
  });
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  const totalStudents = await Enrollment.count({ where: { batch_id: assignment.batch_id } });
  const submittedCount = await AssignmentSubmission.count({ where: { assignment_id: assignment.id } });

  res.json({ ...assignment.toJSON(), total_students: totalStudents, submitted_count: submittedCount });
};

// ─── Create assignment (admin/teacher) ───
exports.create = async (req, res) => {
  const data = z.object({
    batch_id: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().optional(),
    due_date: z.string().optional(),
    file_url: z.string().optional(),
    original_filename: z.string().optional(),
    mime_type: z.string().optional(),
    size_bytes: z.number().optional(),
  }).parse(req.body);

  // Verify batch
  const batch = await Batch.findByPk(data.batch_id);
  if (!batch) return res.status(404).json({ error: 'Batch not found' });

  // Teacher can only post to their own batches
  if (req.user.role === 'teacher' && batch.teacher_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only post assignments to your own batches' });
  }

  // Handle file upload
  if (req.file) {
    data.file_url = req.file.filename;
    data.original_filename = req.file.originalname;
    data.mime_type = req.file.mimetype;
    data.size_bytes = req.file.size;
  }

  const assignment = await Assignment.create({
    ...data,
    created_by: req.user.id,
  });

  const full = await Assignment.findByPk(assignment.id, {
    include: [
      { model: Batch, attributes: ['id', 'name'] },
      { model: User, as: 'creator', attributes: ['id', 'name'] },
    ],
  });

  const io = req.app.get('io');
  if (io.refreshAnalytics) io.refreshAnalytics();

  res.status(201).json(full);
};

// ─── Update assignment ───
exports.update = async (req, res) => {
  const assignment = await Assignment.findByPk(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  // Teacher scoping
  if (req.user.role === 'teacher') {
    const batch = await Batch.findByPk(assignment.batch_id);
    if (batch.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own assignments' });
    }
  }

  const data = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    due_date: z.string().optional().nullable(),
    file_url: z.string().optional().nullable(),
    original_filename: z.string().optional().nullable(),
    mime_type: z.string().optional().nullable(),
    size_bytes: z.number().optional().nullable(),
  }).parse(req.body);

  // Handle file upload
  if (req.file) {
    data.file_url = req.file.filename;
    data.original_filename = req.file.originalname;
    data.mime_type = req.file.mimetype;
    data.size_bytes = req.file.size;
  }

  Object.assign(assignment, data);
  await assignment.save();

  const full = await Assignment.findByPk(assignment.id, {
    include: [
      { model: Batch, attributes: ['id', 'name'] },
      { model: User, as: 'creator', attributes: ['id', 'name'] },
    ],
  });
  const io = req.app.get('io');
  if (io.refreshAnalytics) io.refreshAnalytics();

  res.json(full);
};

// ─── Delete assignment (admin/teacher) ───
exports.remove = async (req, res) => {
  const assignment = await Assignment.findByPk(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  if (req.user.role === 'teacher') {
    const batch = await Batch.findByPk(assignment.batch_id);
    if (batch.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own assignments' });
    }
  }

  await assignment.destroy();
  const io = req.app.get('io');
  if (io.refreshAnalytics) io.refreshAnalytics();
  res.json({ ok: true });
};

// ─── List submissions for an assignment ───
exports.listSubmissions = async (req, res) => {
  const { assignment_id } = req.params;
  const assignment = await Assignment.findByPk(assignment_id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  // Teacher scoping
  if (req.user.role === 'teacher') {
    const batch = await Batch.findByPk(assignment.batch_id);
    if (batch.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only view submissions for your own assignments' });
    }
  }

  const submissions = await AssignmentSubmission.findAll({
    where: { assignment_id },
    include: [
      { model: User, as: 'student', attributes: ['id', 'name', 'email', 'admission_no', 'roll_no'] },
      { model: User, as: 'grader', attributes: ['id', 'name'] },
    ],
    order: [['submitted_at', 'DESC']],
  });

  res.json(submissions);
};

// ─── Student submits assignment ───
exports.submit = async (req, res) => {
  const assignment = await Assignment.findByPk(req.params.assignment_id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  // Check student is enrolled in the batch
  const enrollment = await Enrollment.findOne({
    where: { batch_id: assignment.batch_id, student_id: req.user.id },
  });
  if (!enrollment) {
    return res.status(403).json({ error: 'You are not enrolled in this batch' });
  }

  const data = z.object({
    file_url: z.string().optional(),
    original_filename: z.string().optional(),
    mime_type: z.string().optional(),
    size_bytes: z.number().optional(),
    notes: z.string().optional(),
  }).parse(req.body);

  // Handle file upload
  if (req.file) {
    data.file_url = req.file.filename;
    data.original_filename = req.file.originalname;
    data.mime_type = req.file.mimetype;
    data.size_bytes = req.file.size;
  }

  // Upsert — one submission per student per assignment
  const [submission, created] = await AssignmentSubmission.findOrCreate({
    where: { assignment_id: assignment.id, student_id: req.user.id },
    defaults: {
      assignment_id: assignment.id,
      student_id: req.user.id,
      ...data,
      submitted_at: new Date(),
    },
  });

  if (!created) {
    Object.assign(submission, data, { submitted_at: new Date(), grade: null, feedback: null, graded_by: null, graded_at: null });
    await submission.save();
  }

  const io = req.app.get('io');
  if (io.refreshAnalytics) io.refreshAnalytics();

  res.status(created ? 201 : 200).json(submission);
};

// ─── Grade a submission ───
exports.grade = async (req, res) => {
  const submission = await AssignmentSubmission.findByPk(req.params.submission_id, {
    include: [{ model: Assignment, attributes: ['batch_id'] }],
  });
  if (!submission) return res.status(404).json({ error: 'Submission not found' });

  // Teacher scoping
  if (req.user.role === 'teacher') {
    const batch = await Batch.findByPk(submission.Assignment.batch_id);
    if (batch.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only grade submissions for your own assignments' });
    }
  }

  const data = z.object({
    grade: z.number().min(0).optional(),
    feedback: z.string().optional(),
  }).parse(req.body);

  Object.assign(submission, data, { graded_by: req.user.id, graded_at: new Date() });
  await submission.save();

  const full = await AssignmentSubmission.findByPk(submission.id, {
    include: [
      { model: User, as: 'student', attributes: ['id', 'name'] },
      { model: User, as: 'grader', attributes: ['id', 'name'] },
    ],
  });

  const io = req.app.get('io');
  if (io.refreshAnalytics) io.refreshAnalytics();

  res.json(full);
};

// ─── Student's pending assignments (for my records) ───
exports.myAssignments = async (req, res) => {
  const enrollments = await Enrollment.findAll({
    where: { student_id: req.user.id },
    attributes: ['batch_id'],
  });
  const batchIds = enrollments.map(e => e.batch_id);

  const assignments = await Assignment.findAll({
    where: { batch_id: { [Op.in]: batchIds } },
    include: [
      { model: Batch, attributes: ['id', 'name'] },
      { model: User, as: 'creator', attributes: ['id', 'name'] },
    ],
    order: [['due_date', 'ASC']],
  });

  const result = await Promise.all(assignments.map(async (a) => {
    const submission = await AssignmentSubmission.findOne({
      where: { assignment_id: a.id, student_id: req.user.id },
    });
    return {
      ...a.toJSON(),
      my_submission: submission,
      is_overdue: a.due_date ? new Date(a.due_date + 'T23:59:59') < new Date() : false,
    };
  }));

  res.json(result);
};

// ─── Download assignment file ───
exports.downloadFile = async (req, res) => {
  const assignment = await Assignment.findByPk(req.params.id);
  if (!assignment || !assignment.file_url) return res.status(404).json({ error: 'File not found' });

  // Access check
  if (req.user.role === 'student') {
    const enrolled = await Enrollment.findOne({ where: { student_id: req.user.id, batch_id: assignment.batch_id } });
    if (!enrolled) return res.status(403).json({ error: 'Forbidden' });
  } else if (req.user.role === 'teacher') {
    const batch = await Batch.findByPk(assignment.batch_id);
    if (!batch || batch.teacher_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  }

  const filePath = path.resolve(process.cwd(), env.UPLOAD_DIR, assignment.file_url);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing' });
  res.download(filePath, assignment.original_filename || assignment.file_url);
};

// ─── Download submission file ───
exports.downloadSubmission = async (req, res) => {
  const sub = await AssignmentSubmission.findByPk(req.params.submission_id, {
    include: [{ model: Assignment, attributes: ['batch_id'] }],
  });
  if (!sub || !sub.file_url) return res.status(404).json({ error: 'File not found' });

  // Access check
  if (req.user.role === 'student' && sub.student_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  } else if (req.user.role === 'teacher') {
    const batch = await Batch.findByPk(sub.Assignment.batch_id);
    if (!batch || batch.teacher_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  }

  const filePath = path.resolve(process.cwd(), env.UPLOAD_DIR, sub.file_url);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing' });
  res.download(filePath, sub.original_filename || sub.file_url);
};
