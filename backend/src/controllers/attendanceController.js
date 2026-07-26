const { z } = require('zod');
const { Attendance, Batch, Subject, User, Enrollment } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

// List batches available for attendance (teacher sees only their batches)
exports.listBatches = async (req, res) => {
  const where = {};
  if (req.user.role === 'teacher') where.teacher_id = req.user.id;
  const batches = await Batch.findAll({
    where,
    include: [
      { model: Subject, attributes: ['id', 'name'] },
      { model: User, as: 'teacher', attributes: ['id', 'name'] },
    ],
    order: [['name', 'ASC']],
  });
  res.json(batches);
};

// Get enrolled students for a batch
exports.batchStudents = async (req, res) => {
  const rows = await Enrollment.findAll({
    where: { batch_id: req.params.batchId },
    include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email', 'admission_no'] }],
  });
  res.json(rows.map(r => r.student));
};

// Get attendance for a specific date and batch
exports.getByDate = async (req, res) => {
  const { batchId } = req.params;
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Date is required' });

  const rows = await Attendance.findAll({
    where: { batch_id: batchId, date },
    include: [{ model: User, as: 'student', attributes: ['id', 'name'] }],
  });
  res.json(rows);
};

// Bulk mark attendance
exports.markBulk = async (req, res) => {
  const data = z.object({
    batch_id: z.string().uuid(),
    date: z.string(),
    entries: z.array(z.object({
      student_id: z.string().uuid(),
      status: z.enum(['present', 'absent', 'late']),
      remarks: z.string().optional(),
    })),
  }).parse(req.body);

  const results = [];
  for (const e of data.entries) {
    const [row] = await Attendance.upsert({
      batch_id: data.batch_id,
      date: data.date,
      student_id: e.student_id,
      status: e.status,
      remarks: e.remarks || null,
    });
    results.push(row);
  }
  const io = req.app.get('io');
  if (io.refreshAnalytics) io.refreshAnalytics();

  res.json({ ok: true, count: results.length });
};

// Attendance summary statistics per student for a batch
exports.summary = async (req, res) => {
  const { batchId } = req.params;
  const { from, to } = req.query;

  const where = { batch_id: batchId };
  if (from) where.date = { ...where.date, [Op.gte]: from };
  if (to) where.date = { ...where.date, [Op.lte]: to };
  if (from && !to) where.date = { [Op.gte]: from };
  if (to && !from) where.date = { [Op.lte]: to };

  const stats = await Attendance.findAll({
    where,
    attributes: [
      'student_id',
      [fn('COUNT', col('id')), 'total'],
      [fn('SUM', literal("CASE WHEN status = 'present' THEN 1 ELSE 0 END")), 'present_count'],
      [fn('SUM', literal("CASE WHEN status = 'late' THEN 1 ELSE 0 END")), 'late_count'],
      [fn('SUM', literal("CASE WHEN status = 'absent' THEN 1 ELSE 0 END")), 'absent_count'],
    ],
    group: ['student_id'],
    raw: true,
  });

  // Get student names
  const studentIds = stats.map(s => s.student_id);
  const students = studentIds.length > 0
    ? await User.findAll({ where: { id: studentIds }, attributes: ['id', 'name', 'admission_no'] })
    : [];
  const studentMap = {};
  students.forEach(s => { studentMap[s.id] = s; });

  const result = stats.map(s => {
    const total = parseInt(s.total, 10);
    const present = parseInt(s.present_count || 0, 10);
    const absent = parseInt(s.absent_count || 0, 10);
    const late = parseInt(s.late_count || 0, 10);
    const attended = present + late;
    return {
      student_id: s.student_id,
      student_name: studentMap[s.student_id]?.name || 'Unknown',
      admission_no: studentMap[s.student_id]?.admission_no || null,
      total,
      present,
      absent,
      late,
      percentage: total > 0 ? Math.round((attended / total) * 100) : 0,
    };
  });

  // Overall stats
  const overall = await Attendance.findAll({
    where,
    attributes: [
      [fn('COUNT', col('id')), 'total'],
      [fn('SUM', literal("CASE WHEN status = 'present' THEN 1 ELSE 0 END")), 'present_count'],
      [fn('SUM', literal("CASE WHEN status = 'late' THEN 1 ELSE 0 END")), 'late_count'],
      [fn('SUM', literal("CASE WHEN status = 'absent' THEN 1 ELSE 0 END")), 'absent_count'],
    ],
    raw: true,
  });
  const o = overall[0];
  const overallTotal = parseInt(o?.total || 0, 10);
  const overallPresent = parseInt(o?.present_count || 0, 10);
  const overallLate = parseInt(o?.late_count || 0, 10);
  const overallAttended = overallPresent + overallLate;

  res.json({
    students: result,
    overall: {
      total: overallTotal,
      present: overallPresent,
      absent: parseInt(o?.absent_count || 0, 10),
      late: overallLate,
      percentage: overallTotal > 0 ? Math.round((overallAttended / overallTotal) * 100) : 0,
    },
    total_students: result.length,
  });
};

// Weekly attendance data (for chart)
exports.weeklyData = async (req, res) => {
  const { batchId } = req.params;
  const { weeks = '4' } = req.query;

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - parseInt(weeks) * 7);
  const from = fromDate.toISOString().slice(0, 10);

  const rows = await Attendance.findAll({
    where: {
      batch_id: batchId,
      date: { [Op.gte]: from },
    },
    attributes: [
      'date',
      [fn('COUNT', col('id')), 'total'],
      [fn('SUM', literal("CASE WHEN status = 'present' THEN 1 ELSE 0 END")), 'present'],
      [fn('SUM', literal("CASE WHEN status = 'late' THEN 1 ELSE 0 END")), 'late'],
      [fn('SUM', literal("CASE WHEN status = 'absent' THEN 1 ELSE 0 END")), 'absent'],
    ],
    group: ['date'],
    order: [['date', 'ASC']],
    raw: true,
  });

  res.json(rows.map(r => ({
    date: r.date,
    total: parseInt(r.total, 10),
    present: parseInt(r.present || 0, 10),
    absent: parseInt(r.absent || 0, 10),
    late: parseInt(r.late || 0, 10),
    rate: parseInt(r.total, 10) > 0
      ? Math.round(((parseInt(r.present || 0, 10) + parseInt(r.late || 0, 10)) / parseInt(r.total, 10)) * 100)
      : 0,
  })));
};

// Export to CSV
exports.exportCSV = async (req, res) => {
  const { batchId } = req.params;
  const { from, to } = req.query;

  const where = { batch_id: batchId };
  if (from) where.date = { ...where.date, [Op.gte]: from };
  if (to) where.date = { ...where.date, [Op.lte]: to };
  if (from && !to) where.date = { [Op.gte]: from };
  if (to && !from) where.date = { [Op.lte]: to };

  const rows = await Attendance.findAll({
    where,
    include: [
      { model: User, as: 'student', attributes: ['name', 'email', 'admission_no'] },
      { model: Batch, attributes: ['name'] },
    ],
    order: [['date', 'ASC'], ['student_id', 'ASC']],
  });

  const header = 'Date,Student Name,Admission No,Email,Batch,Status,Remarks\n';
  const csv = rows.map(r =>
    `${r.date},${r.student?.name || 'Unknown'},${r.student?.admission_no || ''},${r.student?.email || ''},${r.Batch?.name || ''},${r.status},${r.remarks || ''}`
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=attendance_${batchId}_${from || 'all'}_${to || 'all'}.csv`);
  res.send(header + csv);
};
