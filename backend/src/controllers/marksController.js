const { z } = require('zod');
const { Op, fn, col, literal } = require('sequelize');
const { Mark, Batch, Subject, User, Enrollment } = require('../models');

// Grade helpers
function calculateGrade(percentage) {
  if (percentage >= 90) return { grade: 'A+', points: 4.0 };
  if (percentage >= 80) return { grade: 'A', points: 3.7 };
  if (percentage >= 70) return { grade: 'B+', points: 3.3 };
  if (percentage >= 60) return { grade: 'B', points: 3.0 };
  if (percentage >= 50) return { grade: 'C', points: 2.0 };
  if (percentage >= 40) return { grade: 'D', points: 1.0 };
  return { grade: 'F', points: 0.0 };
}

function gradeColor(grade) {
  const colors = {
    'A+': 'text-green-600 bg-green-100',
    'A': 'text-green-600 bg-green-100',
    'B+': 'text-blue-600 bg-blue-100',
    'B': 'text-blue-600 bg-blue-100',
    'C': 'text-amber-600 bg-amber-100',
    'D': 'text-orange-600 bg-orange-100',
    'F': 'text-red-600 bg-red-100',
  };
  return colors[grade] || 'text-slate-600 bg-slate-100';
}

// Helper to get teacher's batches
async function getTeacherBatches(teacherId) {
  return await Batch.findAll({
    where: { teacher_id: teacherId },
    include: [{ model: Subject, attributes: ['id', 'name'] }],
    order: [['name', 'ASC']],
  });
}

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

exports.listExams = async (req, res) => {
  const { batch_id } = req.query;
  const where = {};
  if (req.user.role === 'teacher') {
    const batches = await getTeacherBatches(req.user.id);
    const batchIds = batches.map(b => b.id);
    if (batch_id && !batchIds.includes(batch_id)) {
      return res.json([]);
    }
    where.batch_id = batch_id || { [Op.in]: batchIds };
  } else if (batch_id) {
    where.batch_id = batch_id;
  }
  const exams = await Mark.findAll({
    where,
    attributes: [[fn('DISTINCT', col('exam_name')), 'exam_name']],
    order: [['exam_name', 'ASC']],
    raw: true,
  });
  res.json(exams.map(e => e.exam_name));
};

exports.list = async (req, res) => {
  const {
    page = '1', limit = '20', search = '',
    batch_id, exam_name, student_id,
    sort_by = 'exam_date', sort_order = 'DESC',
  } = req.query;

  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (p - 1) * l;

  const where = {};
  if (batch_id) where.batch_id = batch_id;
  if (exam_name) where.exam_name = exam_name;
  if (student_id) where.student_id = student_id;

  // Teacher scoping
  if (req.user.role === 'teacher') {
    const batches = await getTeacherBatches(req.user.id);
    const batchIds = batches.map(b => b.id);
    where.batch_id = batch_id ? where.batch_id : { [Op.in]: batchIds };
    if (batch_id && !batchIds.includes(batch_id)) {
      return res.json({ marks: [], pagination: { page: p, limit: l, total: 0, pages: 0 } });
    }
  }

  if (search) {
    where[Op.or] = [
      { exam_name: { [Op.iLike]: `%${search}%` } },
      { '$student.name$': { [Op.iLike]: `%${search}%` } },
    ];
  }

  const allowedSort = ['exam_name', 'score', 'max_score', 'exam_date', 'created_at'];
  const sortField = allowedSort.includes(sort_by) ? sort_by : 'exam_date';
  const sortDir = sort_order === 'ASC' ? 'ASC' : 'DESC';

  const { rows, count } = await Mark.findAndCountAll({
    where,
    include: [
      { model: User, as: 'student', attributes: ['id', 'name', 'email', 'admission_no', 'roll_no'] },
      { model: Batch, attributes: ['id', 'name'], include: [{ model: Subject, attributes: ['id', 'name'] }] },
    ],
    order: [[sortField, sortDir], ['created_at', 'DESC']],
    limit: l,
    offset,
  });

  const marks = rows.map(m => {
    const pct = m.max_score > 0 ? (m.score / m.max_score) * 100 : 0;
    const { grade, points } = calculateGrade(pct);
    return {
      ...m.toJSON(),
      percentage: parseFloat(pct.toFixed(1)),
      grade,
      grade_points: points,
      grade_color: gradeColor(grade),
    };
  });

  res.json({
    marks,
    pagination: { page: p, limit: l, total: count, pages: Math.ceil(count / l) },
  });
};

exports.getById = async (req, res) => {
  const mark = await Mark.findByPk(req.params.id, {
    include: [
      { model: User, as: 'student', attributes: ['id', 'name', 'email', 'admission_no'] },
      { model: Batch, attributes: ['id', 'name'] },
    ],
  });
  if (!mark) return res.status(404).json({ error: 'Mark not found' });
  res.json(mark);
};

exports.create = async (req, res) => {
  const data = z.object({
    batch_id: z.string().uuid(),
    student_id: z.string().uuid(),
    exam_name: z.string().min(1),
    score: z.number().min(0),
    max_score: z.number().min(1),
    exam_date: z.string().optional(),
  }).parse(req.body);

  // Verify batch exists
  const batch = await Batch.findByPk(data.batch_id);
  if (!batch) return res.status(404).json({ error: 'Batch not found' });

  // Teacher can only add marks to their own batches
  if (req.user.role === 'teacher' && batch.teacher_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only add marks to your own batches' });
  }

  // Verify student is enrolled in the batch
  const enrollment = await Enrollment.findOne({
    where: { batch_id: data.batch_id, student_id: data.student_id },
  });
  if (!enrollment) {
    return res.status(400).json({ error: 'Student is not enrolled in this batch' });
  }

  if (data.score > data.max_score) {
    return res.status(400).json({ error: 'Score cannot exceed max score' });
  }

  const mark = await Mark.create(data);
  const full = await Mark.findByPk(mark.id, {
    include: [{ model: User, as: 'student', attributes: ['id', 'name'] }],
  });

  const io = req.app.get('io');
  if (io.refreshAnalytics) io.refreshAnalytics();

  res.status(201).json(full);
};

exports.bulkCreate = async (req, res) => {
  const data = z.object({
    batch_id: z.string().uuid(),
    exam_name: z.string().min(1),
    max_score: z.number().min(1),
    exam_date: z.string().optional(),
    entries: z.array(z.object({
      student_id: z.string().uuid(),
      score: z.number().min(0),
    })).min(1),
  }).parse(req.body);

  // Verify batch
  const batch = await Batch.findByPk(data.batch_id);
  if (!batch) return res.status(404).json({ error: 'Batch not found' });

  // Teacher scoping
  if (req.user.role === 'teacher' && batch.teacher_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only add marks to your own batches' });
  }

  // Validate scores
  for (const entry of data.entries) {
    if (entry.score > data.max_score) {
      return res.status(400).json({ error: `Score cannot exceed max score for student ${entry.student_id}` });
    }
  }

  // Create all marks
  const created = [];
  for (const entry of data.entries) {
    const [mark, created_] = await Mark.findOrCreate({
      where: {
        batch_id: data.batch_id,
        student_id: entry.student_id,
        exam_name: data.exam_name,
      },
      defaults: {
        batch_id: data.batch_id,
        student_id: entry.student_id,
        exam_name: data.exam_name,
        score: entry.score,
        max_score: data.max_score,
        exam_date: data.exam_date || null,
      },
    });

    // If mark already exists, update it
    if (!created_) {
      mark.score = entry.score;
      mark.max_score = data.max_score;
      if (data.exam_date) mark.exam_date = data.exam_date;
      await mark.save();
    }
    created.push(mark);
  }

  const io = req.app.get('io');
  if (io.refreshAnalytics) io.refreshAnalytics();

  res.status(201).json({ ok: true, count: created.length });
};

exports.update = async (req, res) => {
  const mark = await Mark.findByPk(req.params.id);
  if (!mark) return res.status(404).json({ error: 'Mark not found' });

  // Teacher scoping
  if (req.user.role === 'teacher') {
    const batch = await Batch.findByPk(mark.batch_id);
    if (batch.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit marks in your own batches' });
    }
  }

  const data = z.object({
    score: z.number().min(0).optional(),
    max_score: z.number().min(1).optional(),
    exam_name: z.string().optional(),
    exam_date: z.string().optional(),
  }).parse(req.body);

  Object.assign(mark, data);
  if (mark.score > mark.max_score) {
    return res.status(400).json({ error: 'Score cannot exceed max score' });
  }
  await mark.save();

  const io = req.app.get('io');
  if (io.refreshAnalytics) io.refreshAnalytics();

  const full = await Mark.findByPk(mark.id, {
    include: [{ model: User, as: 'student', attributes: ['id', 'name'] }],
  });
  res.json(full);
};

exports.remove = async (req, res) => {
  const mark = await Mark.findByPk(req.params.id);
  if (!mark) return res.status(404).json({ error: 'Mark not found' });

  // Teacher scoping
  if (req.user.role === 'teacher') {
    const batch = await Batch.findByPk(mark.batch_id);
    if (batch.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete marks in your own batches' });
    }
  }

  await mark.destroy();
  const io = req.app.get('io');
  if (io.refreshAnalytics) io.refreshAnalytics();
  res.json({ ok: true });
};

exports.stats = async (req, res) => {
  const { batch_id, student_id, exam_name } = req.query;

  const where = {};
  if (batch_id) where.batch_id = batch_id;
  if (student_id) where.student_id = student_id;
  if (exam_name) where.exam_name = exam_name;

  // Teacher scoping
  if (req.user.role === 'teacher') {
    const batches = await getTeacherBatches(req.user.id);
    const batchIds = batches.map(b => b.id);
    if (!where.batch_id) where.batch_id = { [Op.in]: batchIds };
  }

  // Overall stats
  const overall = await Mark.findAll({
    where,
    attributes: [
      [fn('COUNT', col('Mark.id')), 'total_exams'],
      [fn('AVG', col('Mark.score')), 'avg_score'],
      [fn('AVG', col('Mark.max_score')), 'avg_max'],
      [fn('MIN', col('Mark.score')), 'min_score'],
      [fn('MAX', col('Mark.score')), 'max_score'],
    ],
    raw: true,
  });

  const stats = overall[0] || {};
  const avgPct = stats.avg_max > 0 ? (stats.avg_score / stats.avg_max) * 100 : 0;
  const avgGrade = calculateGrade(avgPct);

  // Per-student stats
  const perStudent = await Mark.findAll({
    where,
    attributes: [
      'student_id',
      [fn('COUNT', col('Mark.id')), 'total_exams'],
      [fn('AVG', col('Mark.score')), 'avg_score'],
      [fn('AVG', col('Mark.max_score')), 'avg_max'],
      [fn('MIN', col('Mark.score')), 'min_score'],
      [fn('MAX', col('Mark.score')), 'max_score'],
    ],
    include: [{ model: User, as: 'student', attributes: ['id', 'name', 'admission_no'] }],
    group: ['student_id', 'student.id'],
    raw: true,
    nest: true,
  });

  const studentStats = perStudent.map(s => {
    const pct = s.avg_max > 0 ? (parseFloat(s.avg_score) / parseFloat(s.avg_max)) * 100 : 0;
    const { grade, points } = calculateGrade(pct);
    return {
      student_id: s.student_id,
      student: s.student,
      total_exams: parseInt(s.total_exams),
      avg_score: parseFloat(parseFloat(s.avg_score).toFixed(1)),
      avg_max: parseFloat(parseFloat(s.avg_max).toFixed(1)),
      min_score: parseFloat(s.min_score),
      max_score: parseFloat(s.max_score),
      percentage: parseFloat(pct.toFixed(1)),
      grade,
      grade_points: points,
    };
  });

  res.json({
    overall: {
      total_exams: parseInt(stats.total_exams) || 0,
      avg_score: parseFloat(parseFloat(stats.avg_score || 0).toFixed(1)),
      avg_max: parseFloat(parseFloat(stats.avg_max || 0).toFixed(1)),
      min_score: parseFloat(stats.min_score || 0),
      max_score: parseFloat(stats.max_score || 0),
      percentage: parseFloat(avgPct.toFixed(1)),
      grade: avgGrade.grade,
    },
    per_student: studentStats,
  });
};

exports.reportCard = async (req, res) => {
  const { student_id } = req.query;
  if (!student_id) return res.status(400).json({ error: 'student_id is required' });

  const student = await User.findByPk(student_id, {
    attributes: ['id', 'name', 'email', 'admission_no', 'current_class', 'section'],
  });
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const marks = await Mark.findAll({
    where: { student_id },
    include: [{ model: Batch, attributes: ['id', 'name'], include: [{ model: Subject, attributes: ['name'] }] }],
    order: [['exam_date', 'DESC']],
  });

  // Group by batch
  const byBatch = {};
  let totalScore = 0;
  let totalMax = 0;
  let totalExams = 0;

  for (const m of marks) {
    const batchKey = m.Batch?.id || 'unknown';
    if (!byBatch[batchKey]) byBatch[batchKey] = { batch: m.Batch, batchName: m.Batch?.name || 'Unknown', marks: [], total: 0, max: 0 };
    byBatch[batchKey].marks.push(m);
    byBatch[batchKey].total += m.score;
    byBatch[batchKey].max += m.max_score;
    totalScore += m.score;
    totalMax += m.max_score;
    totalExams++;
  }

  const overallPct = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
  const overallGrade = calculateGrade(overallPct);

  // Per-batch stats
  const batchStats = Object.entries(byBatch).map(([key, data]) => {
    const pct = data.max > 0 ? (data.total / data.max) * 100 : 0;
    const { grade } = calculateGrade(pct);
    return {
      batch_name: data.batchName,
      batch_id: key,
      subject: data.batch?.Subject?.name || '',
      total_exams: data.marks.length,
      total_score: parseFloat(data.total.toFixed(1)),
      total_max: parseFloat(data.max.toFixed(1)),
      percentage: parseFloat(pct.toFixed(1)),
      grade,
    };
  });

  res.json({
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      admission_no: student.admission_no,
      current_class: student.current_class,
      section: student.section,
    },
    summary: {
      total_exams: totalExams,
      total_score: parseFloat(totalScore.toFixed(1)),
      total_max: parseFloat(totalMax.toFixed(1)),
      overall_percentage: parseFloat(overallPct.toFixed(1)),
      overall_grade: overallGrade.grade,
      overall_gpa: overallGrade.points,
    },
    by_batch: batchStats,
  });
};

exports.exportCSV = async (req, res) => {
  const { batch_id, exam_name } = req.query;
  const where = {};
  if (batch_id) where.batch_id = batch_id;
  if (exam_name) where.exam_name = exam_name;

  if (req.user.role === 'teacher') {
    const batches = await getTeacherBatches(req.user.id);
    const batchIds = batches.map(b => b.id);
    if (!where.batch_id) where.batch_id = { [Op.in]: batchIds };
  }

  const marks = await Mark.findAll({
    where,
    include: [
      { model: User, as: 'student', attributes: ['id', 'name', 'email', 'admission_no', 'roll_no'] },
      { model: Batch, attributes: ['id', 'name'] },
    ],
    order: [['exam_date', 'DESC']],
  });

  const header = 'Student Name,Admission No,Roll No,Email,Batch,Exam,Score,Max Score,Percentage,Grade,Exam Date\n';
  const csv = marks.map(m => {
    const pct = m.max_score > 0 ? ((m.score / m.max_score) * 100).toFixed(1) : '0.0';
    const { grade } = calculateGrade(parseFloat(pct));
    return [
      `"${m.student?.name || ''}"`,
      m.student?.admission_no || '',
      m.student?.roll_no || '',
      m.student?.email || '',
      `"${m.Batch?.name || ''}"`,
      `"${m.exam_name}"`,
      m.score,
      m.max_score,
      pct + '%',
      grade,
      m.exam_date || '',
    ].join(',');
  }).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=marks_${batch_id || 'all'}.csv`);
  res.send(header + csv);
};
