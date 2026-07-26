const { z } = require('zod');
const { User, ParentLink, Enrollment, Batch, Subject, Attendance, Mark, Announcement } = require('../models');
const { Op, fn, col } = require('sequelize');
const { hash, randomPassword } = require('../utils/password');
const { sendMail, welcomeEmail, resetPasswordEmail, parentApprovalEmail } = require('../utils/mailer');

// Admin: List all parent accounts
exports.list = async (req, res) => {
  const {
    page = '1', limit = '20', search = '', sort_by = 'name', sort_order = 'ASC',
    is_active, has_students,
  } = req.query;

  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (p - 1) * l;

  const allowedSort = ['name', 'email', 'phone', 'is_active', 'created_at'];
  const sortField = allowedSort.includes(sort_by) ? sort_by : 'name';
  const sortDir = sort_order === 'DESC' ? 'DESC' : 'ASC';

  const where = { role: 'parent' };

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

  // Handle has_students filter via subquery for correctness
  if (has_students === 'true') {
    const idsWithStudents = await ParentLink.findAll({ attributes: ['parent_id'], group: ['parent_id'] });
    const existingIds = idsWithStudents.map(p => p.parent_id);
    if (where.id) {
      // If already filtering by ID (from search that might include ID), intersect
      where.id = { [Op.and]: [where.id, { [Op.in]: existingIds }] };
    } else {
      where.id = { [Op.in]: existingIds };
    }
  } else if (has_students === 'false') {
    const idsWithStudents = await ParentLink.findAll({ attributes: ['parent_id'], group: ['parent_id'] });
    const existingIds = idsWithStudents.map(p => p.parent_id);
    if (existingIds.length > 0) {
      where.id = { [Op.notIn]: existingIds };
    }
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    include: [{
      model: ParentLink, as: 'linked_students',
      include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email', 'admission_no', 'current_class'] }],
      required: false,
    }],
    order: [[sortField, sortDir]],
    limit: l,
    offset,
    distinct: true,
  });

  res.json({
    parents: rows.map(formatParent),
    pagination: { page: p, limit: l, total: count, pages: Math.ceil(count / l) },
  });
};

// Admin: Get parent by ID with full details
exports.getById = async (req, res) => {
  const parent = await User.findOne({
    where: { id: req.params.id, role: 'parent' },
    include: [{
      model: ParentLink, as: 'linked_students',
      include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email', 'admission_no', 'current_class', 'section', 'phone'] }],
    }],
  });
  if (!parent) return res.status(404).json({ error: 'Parent not found' });

  // For each linked student, get attendance stats and recent marks
  const studentData = [];
  for (const link of parent.linked_students || []) {
    const student = link.student;
    if (!student) continue;

    const attendanceStats = await Attendance.findAll({
      where: { student_id: student.id },
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });

    const marksData = await Mark.findAll({
      where: { student_id: student.id },
      include: [{ model: Batch, attributes: ['name'] }],
      order: [['exam_date', 'DESC']],
      limit: 10,
    });

    const enrollments = await Enrollment.findAll({
      where: { student_id: student.id },
      include: [{ model: Batch, include: [Subject] }],
    });

    studentData.push({
      relationship: link.relationship,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        admission_no: student.admission_no,
        current_class: student.current_class,
        section: student.section,
        phone: student.phone,
      },
      attendance_stats: attendanceStats.reduce((acc, s) => ({ ...acc, [s.status]: parseInt(s.count) }), {}),
      recent_marks: marksData,
      enrollments,
    });
  }

  res.json({
    ...formatParent(parent),
    linked_students: studentData,
  });
};

// Admin: Create parent directly
exports.create = async (req, res) => {
  const data = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    student_id: z.string().uuid().optional(),
    relationship: z.string().optional(),
  }).strip().parse(req.body);

  // Check if email already exists
  const existing = await User.findOne({ where: { email: data.email.toLowerCase() } });
  if (existing) {
    return res.status(409).json({ error: 'A user with this email already exists' });
  }

  const tempPassword = randomPassword(10);

  const parent = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    phone: data.phone || null,
    role: 'parent',
    password_hash: await hash(tempPassword),
    must_change_password: true,
  });

  // If a student_id was provided, create the link
  if (data.student_id) {
    const student = await User.findOne({ where: { id: data.student_id, role: 'student' } });
    if (student) {
      await ParentLink.create({
        parent_id: parent.id,
        student_id: data.student_id,
        relationship: data.relationship || 'guardian',
      });
    }
  }

  // When a parent is created manually (by admin), it's not a request approval,
  // so we use the welcomeEmail template
  await sendMail({
    to: parent.email,
    ...welcomeEmail({ name: parent.name, email: parent.email, tempPassword, role: 'parent', subject: 'Your Parent Account — Dwaraka Academy' }),
  }).catch(() => {});

  console.log(`[parent:created] ${parent.email} temp_password=${tempPassword}`);
  res.status(201).json({ parent: formatParent(parent), tempPassword });
};

// Admin: Update parent
exports.update = async (req, res) => {
  const parent = await User.findOne({ where: { id: req.params.id, role: 'parent' } });
  if (!parent) return res.status(404).json({ error: 'Parent not found' });

  const data = z.object({
    name: z.string().min(1).optional(),
    phone: z.string().optional(),
    is_active: z.boolean().optional(),
    email: z.string().email().optional(),
  }).strip().parse(req.body);

  Object.assign(parent, data);
  await parent.save();
  res.json(formatParent(parent));
};

// Admin: Delete parent
exports.remove = async (req, res) => {
  const parent = await User.findOne({ where: { id: req.params.id, role: 'parent' } });
  if (!parent) return res.status(404).json({ error: 'Parent not found' });

  // Cascade delete will handle ParentLink removal
  await parent.destroy();
  res.json({ ok: true });
};

// Admin: Reset parent password
exports.resetPassword = async (req, res) => {
  const parent = await User.findOne({ where: { id: req.params.id, role: 'parent' } });
  if (!parent) return res.status(404).json({ error: 'Parent not found' });

  const tempPassword = randomPassword(10);
  parent.password_hash = await hash(tempPassword);
  parent.must_change_password = true;
  await parent.save();
  sendMail({
    to: parent.email,
    ...resetPasswordEmail({ name: parent.name, email: parent.email, tempPassword, role: 'parent' }),
  }).catch(() => {});

  console.log(`[parent:reset] ${parent.email} temp_password=${tempPassword}`);
  res.json({ tempPassword });
};

// Admin: Link a student to a parent
exports.linkStudent = async (req, res) => {
  const data = z.object({
    student_id: z.string().uuid(),
    relationship: z.string().optional(),
  }).strip().parse(req.body);

  const parent = await User.findOne({ where: { id: req.params.id, role: 'parent' } });
  if (!parent) return res.status(404).json({ error: 'Parent not found' });

  const student = await User.findOne({ where: { id: data.student_id, role: 'student' } });
  if (!student) return res.status(404).json({ error: 'Student not found' });

  // Check for existing link
  const existing = await ParentLink.findOne({ where: { parent_id: parent.id, student_id: data.student_id } });
  if (existing) return res.status(409).json({ error: 'This student is already linked to this parent' });

  await ParentLink.create({
    parent_id: parent.id,
    student_id: data.student_id,
    relationship: data.relationship || 'guardian',
  });

  res.status(201).json({ ok: true, message: 'Student linked to parent' });
};

// Admin: Unlink a student from a parent
exports.unlinkStudent = async (req, res) => {
  const { studentId } = req.params;
  const deleted = await ParentLink.destroy({
    where: { parent_id: req.params.id, student_id: studentId },
  });
  if (!deleted) return res.status(404).json({ error: 'Link not found' });
  res.json({ ok: true, message: 'Student unlinked' });
};

// Parent self-service: Dashboard with linked students data
exports.myDashboard = async (req, res) => {
  const parent = await User.findOne({
    where: { id: req.user.id, role: 'parent' },
    include: [{
      model: ParentLink, as: 'linked_students',
      include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email', 'admission_no', 'current_class', 'section'] }],
    }],
  });
  if (!parent) return res.status(404).json({ error: 'Parent profile not found' });

  // Get full data for each linked student
  const studentData = [];
  for (const link of parent.linked_students || []) {
    const student = link.student;
    if (!student) continue;

    const [attendanceStats, marksData, enrollments, announcements] = await Promise.all([
      Attendance.findAll({
        where: { student_id: student.id },
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      Mark.findAll({
        where: { student_id: student.id },
        include: [{ model: Batch, attributes: ['name'] }],
        order: [['exam_date', 'DESC']],
        limit: 10,
      }),
      Enrollment.findAll({
        where: { student_id: student.id },
        include: [{ model: Batch, include: [Subject, { model: User, as: 'teacher', attributes: ['id', 'name'] }] }],
      }),
      Announcement.findAll({
        order: [['created_at', 'DESC']],
        limit: 5,
        include: [{ model: User, as: 'author', attributes: ['name'] }],
      }),
    ]);

    // Attendance records for table
    const attendanceRecords = await Attendance.findAll({
      where: { student_id: student.id },
      include: [{ model: Batch, attributes: ['name'] }],
      order: [['date', 'DESC']],
      limit: 5,
    });

    // Calculate attendance percentage
    const stats = attendanceStats.reduce((acc, s) => ({ ...acc, [s.status]: parseInt(s.count) }), {});
    const total = (stats.present || 0) + (stats.absent || 0) + (stats.late || 0);
    const percentage = total > 0 ? (((stats.present || 0) + (stats.late || 0)) / total * 100).toFixed(1) : 0;

    studentData.push({
      relationship: link.relationship,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        admission_no: student.admission_no,
        current_class: student.current_class,
        section: student.section,
      },
      attendance: {
        stats,
        percentage: parseFloat(percentage),
        total,
        records: attendanceRecords,
      },
      marks: marksData,
      enrollments,
    });
  }

  // Recent announcements
  const announcements = await Announcement.findAll({
    order: [['created_at', 'DESC']],
    limit: 5,
    include: [{ model: User, as: 'author', attributes: ['name'] }],
  });

  res.json({
    parent: formatParent(parent),
    linked_students: studentData,
    announcements,
  });
};

function formatParent(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    is_active: u.is_active,
    must_change_password: u.must_change_password,
    created_at: u.created_at,
    linked_students: (u.linked_students || []).map(l => ({
      id: l.id,
      relationship: l.relationship,
      student: l.student ? {
        id: l.student.id,
        name: l.student.name,
        email: l.student.email,
        admission_no: l.student.admission_no,
        current_class: l.student.current_class,
      } : null,
    })),
  };
}
