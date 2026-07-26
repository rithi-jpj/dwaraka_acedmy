const { z } = require('zod');
const { User, Enrollment, Batch, Subject, Attendance, Mark, ParentLink, ParentRequest, AssignmentSubmission } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
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
    page = '1', limit = '20', search = '', sort_by = 'name', sort_order = 'ASC',
    is_active, current_class, batch_id,
  } = req.query;

  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (p - 1) * l;

  const allowedSort = ['name', 'email', 'admission_no', 'current_class', 'is_active', 'created_at'];
  const sortField = allowedSort.includes(sort_by) ? sort_by : 'name';
  const sortDir = sort_order === 'DESC' ? 'DESC' : 'ASC';

  const where = { role: 'student' };

  // Search
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { admission_no: { [Op.iLike]: `%${search}%` } },

      { guardian_name: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } },
    ];
  }

  // Filters
  if (is_active !== undefined && is_active !== '') {
    where.is_active = is_active === 'true';
  }
  if (current_class) {
    where.current_class = current_class;
  }

  // If filtering by batch, get student IDs from Enrollment
  let batchFilterIds = null;
  if (batch_id) {
    const enrollments = await Enrollment.findAll({ where: { batch_id }, attributes: ['student_id'] });
    batchFilterIds = enrollments.map(e => e.student_id);
    where.id = { [Op.in]: batchFilterIds };
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    order: [[sortField, sortDir]],
    limit: l,
    offset,
    distinct: true,
    include: [{ model: Enrollment, as: 'enrollments', attributes: ['id', 'batch_id'], required: false, include: [{ model: Batch, attributes: ['id', 'name', 'shift'] }] }],
  });

  // Get distinct classes for filter dropdown
  const classes = await User.findAll({
    where: { role: 'student', current_class: { [Op.ne]: null } },
    attributes: [[fn('DISTINCT', col('current_class')), 'class']],
    raw: true,
  });

  res.json({
    students: rows.map(formatStudent),
    pagination: { page: p, limit: l, total: count, pages: Math.ceil(count / l) },
    filters: { classes: classes.map(c => c.class).filter(Boolean).sort() },
  });
};

exports.getById = async (req, res) => {
  const student = await User.findOne({
    where: { id: req.params.id, role: 'student' },
    include: [
      { model: Enrollment, as: 'enrollments', include: [{
        model: Batch,
        include: [Subject],
      }] },
      { model: ParentLink, as: 'linked_parents', include: [{ model: User, as: 'parent', attributes: ['id', 'name', 'email', 'phone'] }] },
    ],
  });
  if (!student) return res.status(404).json({ error: 'Student not found' });

  // Attendance stats
  const attendanceStats = await Attendance.findAll({
    where: { student_id: student.id },
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    group: ['status'],
    raw: true,
  });

  // Marks summary
  const marksData = await Mark.findAll({
    where: { student_id: student.id },
    include: [{ model: Batch, attributes: ['name'] }],
    order: [['exam_date', 'DESC']],
    limit: 20,
  });

  res.json({
    ...formatStudent(student),
    enrollments: student.enrollments || [],
    linked_parents: student.linked_parents || [],
    attendance_stats: attendanceStats.reduce((acc, s) => ({ ...acc, [s.status]: parseInt(s.count) }), {}),
    recent_marks: marksData,
  });
};

exports.create = async (req, res) => {
  const data = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    address: z.string().optional(),
    guardian_name: z.string().optional(),
    guardian_phone: z.string().optional(),
    current_class: z.string().optional(),
    batch_id: z.string().uuid().optional().nullable().or(z.literal('')),
  }).strip().parse(req.body);

  const tempPassword = randomPassword(10);
  const admissionNo = await generateAdmissionNo();

  const { sequelize } = require('../models');
  const user = await sequelize.transaction(async (t) => {
    const u = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      role: 'student',
      password_hash: await hash(tempPassword),
      must_change_password: true,
      admission_no: admissionNo,
      address: data.address,
      guardian_name: data.guardian_name,
      guardian_phone: data.guardian_phone,
      current_class: data.current_class,
    }, { transaction: t });

    // Auto-enroll in the specified batch
    if (data.batch_id && data.batch_id !== '') {
      await Enrollment.destroy({ where: { student_id: u.id }, transaction: t });
      await Enrollment.create({ student_id: u.id, batch_id: data.batch_id }, { transaction: t });
    }

    return u;
  });

  await sendMail({
    to: user.email,
    ...welcomeEmail({ name: user.name, email: user.email, username: admissionNo, tempPassword, role: 'student', subject: 'Welcome to Dwaraka Academy — Your Student Account' }),
  }).catch(() => {});

  console.log(`[student:created] ${user.email} admission=${admissionNo} temp_password=${tempPassword}`);
  res.status(201).json({ student: formatStudent(user), tempPassword });
};

exports.update = async (req, res) => {
  const student = await User.findOne({ where: { id: req.params.id, role: 'student' } });
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const data = z.object({
    name: z.string().min(1).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    guardian_name: z.string().optional(),
    guardian_phone: z.string().optional(),
    current_class: z.string().optional(),
    is_active: z.boolean().optional(),
    email: z.string().email().optional(),
    batch_id: z.string().uuid().optional().nullable().or(z.literal('')),
  }).strip().parse(req.body);

  Object.assign(student, data);
  await student.save();

  // Update batch enrollment if provided
  if (data.batch_id !== undefined) {
    await Enrollment.destroy({ where: { student_id: student.id } });
    if (data.batch_id) {
      await Enrollment.create({ student_id: student.id, batch_id: data.batch_id });
    }
  }

  res.json(formatStudent(student));
};

exports.remove = async (req, res) => {
  const student = await User.findOne({ where: { id: req.params.id, role: 'student' } });
  if (!student) return res.status(404).json({ error: 'Student not found' });

  // Prevent self-deletion
  if (req.user && req.user.id === student.id) {
    return res.status(400).json({ error: 'You cannot delete your own account.' });
  }

  const { sequelize } = require('../models');
  let summary = null;

  try {
    await sequelize.transaction(async (t) => {
      // 1. Delete attendance records
      const attDeleted = await Attendance.destroy({
        where: { student_id: student.id },
        transaction: t,
      });

      // 2. Delete batch enrollments
      const enrollDeleted = await Enrollment.destroy({
        where: { student_id: student.id },
        transaction: t,
      });

      // 3. Delete marks
      const marksDeleted = await Mark.destroy({
        where: { student_id: student.id },
        transaction: t,
      });

      // 4. Delete assignment submissions (this student's submissions)
      const subDeleted = await AssignmentSubmission.destroy({
        where: { student_id: student.id },
        transaction: t,
      });

      // 5. Delete parent links (where this student is linked)
      const linksDeleted = await ParentLink.destroy({
        where: { student_id: student.id },
        transaction: t,
      });

      // 6. Delete parent requests made by this student
      const reqsDeleted = await ParentRequest.destroy({
        where: { student_id: student.id },
        transaction: t,
      });

      // 7. Delete the student user record
      await student.destroy({ transaction: t });

      summary = {
        attendance: attDeleted,
        enrollments: enrollDeleted,
        marks: marksDeleted,
        submissions: subDeleted,
        parentLinks: linksDeleted,
        parentRequests: reqsDeleted,
      };

      // Log the deletion
      const ts = new Date().toISOString();
      console.log(`[security] ${ts} event=student_deleted`, JSON.stringify({
        userId: student.id,
        email: student.email,
        admission_no: student.admission_no,
        deletedBy: req.user?.id,
        recordsRemoved: summary,
      }));
    });

    // Build a descriptive success message
    const parts = [];
    if (summary.attendance) parts.push(`${summary.attendance} attendance record(s)`);
    if (summary.enrollments) parts.push(`${summary.enrollments} batch enrollment(s)`);
    if (summary.marks) parts.push(`${summary.marks} mark record(s)`);
    if (summary.submissions) parts.push(`${summary.submissions} assignment submission(s)`);
    if (summary.parentLinks) parts.push(`${summary.parentLinks} parent link(s)`);
    if (summary.parentRequests) parts.push(`${summary.parentRequests} parent request(s)`);

    const details = parts.length > 0
      ? ' Removed: ' + parts.join(', ') + '.'
      : ' No related records were found.';

    // Notify Socket.IO for dashboard refresh
    const io = req.app.get('io');
    if (io && io.refreshAnalytics) io.refreshAnalytics();

    res.json({
      ok: true,
      message: `Student "${student.name}" (${student.admission_no || student.email}) has been permanently deleted.${details}`,
    });
  } catch (err) {
    if (err.parent && err.parent.code === '23503') {
      return res.status(409).json({
        error: 'Cannot delete: this student has related records that could not be removed. Please check for orphaned data.'
      });
    }
    throw err;
  }
};

exports.resetPassword = async (req, res) => {
  const student = await User.findOne({ where: { id: req.params.id, role: 'student' } });
  if (!student) return res.status(404).json({ error: 'Student not found' });
  const tempPassword = randomPassword(10);
  student.password_hash = await hash(tempPassword);
  student.must_change_password = true;
  await student.save();
  sendMail({
    to: student.email,
    ...resetPasswordEmail({ name: student.name, email: student.email, tempPassword, role: 'student' }),
  }).catch(() => {});

  console.log(`[student:reset] ${student.email} temp_password=${tempPassword}`);
  res.json({ tempPassword });
};

exports.myProfile = async (req, res) => {
  const student = await User.findOne({
    where: { id: req.user.id, role: 'student' },
    include: [
      { model: Enrollment, as: 'enrollments', include: [{
        model: Batch,
        include: [Subject, { model: User, as: 'teacher', attributes: ['id', 'name'] }],
      }] },
      { model: ParentLink, as: 'linked_parents', include: [{ model: User, as: 'parent', attributes: ['id', 'name', 'email', 'phone'] }] },
    ],
  });
  if (!student) return res.status(404).json({ error: 'Student profile not found' });

  // Attendance summary
  const attendanceStats = await Attendance.findAll({
    where: { student_id: student.id },
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    group: ['status'],
    raw: true,
  });

  // Marks summary
  const marksData = await Mark.findAll({
    where: { student_id: student.id },
    include: [{ model: Batch, attributes: ['name'] }],
    order: [['exam_date', 'DESC']],
    limit: 10,
  });

  res.json({
    ...formatStudent(student),
    enrollments: student.enrollments || [],
    linked_parents: student.linked_parents || [],
    attendance_stats: attendanceStats.reduce((acc, s) => ({ ...acc, [s.status]: parseInt(s.count) }), {}),
    recent_marks: marksData,
  });
};

exports.myAttendance = async (req, res) => {
  const { page = '1', limit = '30' } = req.query;
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));

  const { rows, count } = await Attendance.findAndCountAll({
    where: { student_id: req.user.id },
    include: [{ model: Batch, attributes: ['name'] }],
    order: [['date', 'DESC']],
    limit: l,
    offset: (p - 1) * l,
  });

  // Stats
  const stats = await Attendance.findAll({
    where: { student_id: req.user.id },
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    group: ['status'],
    raw: true,
  });

  res.json({
    records: rows,
    stats: stats.reduce((acc, s) => ({ ...acc, [s.status]: parseInt(s.count) }), {}),
    pagination: { page: p, limit: l, total: count, pages: Math.ceil(count / l) },
  });
};

exports.myMarks = async (req, res) => {
  const marks = await Mark.findAll({
    where: { student_id: req.user.id },
    include: [{ model: Batch, attributes: ['name'] }],
    order: [['exam_date', 'DESC']],
  });

  // Calculate performance stats
  const totalExams = marks.length;
  const avgScore = totalExams > 0
    ? (marks.reduce((sum, m) => sum + (m.score / m.max_score) * 100, 0) / totalExams).toFixed(1)
    : 0;

  // Group by batch
  const byBatch = {};
  marks.forEach(m => {
    const batchName = m.Batch?.name || 'Unknown';
    if (!byBatch[batchName]) byBatch[batchName] = [];
    byBatch[batchName].push(m);
  });

  res.json({
    marks,
    stats: { total_exams: totalExams, average_percentage: parseFloat(avgScore) },
    by_batch: byBatch,
  });
};

function formatStudent(u) {
  const batch = u.enrollments?.[0]?.Batch || null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    is_active: u.is_active,
    must_change_password: u.must_change_password,
    created_at: u.created_at,
    admission_no: u.admission_no,
    address: u.address,
    guardian_name: u.guardian_name,
    guardian_phone: u.guardian_phone,
    current_class: u.current_class,
    enrollment_count: u.enrollments ? u.enrollments.length : 0,
    batch_id: batch?.id || null,
    batch_name: batch?.name || null,
    batch_shift: batch?.shift || null,
  };
}
