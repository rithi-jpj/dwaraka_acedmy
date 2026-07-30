const { Op, fn, col, literal } = require('sequelize');
const {
  User, Subject, Batch, Enrollment, Attendance, Mark, Announcement, ParentLink,
} = require('../models');

exports.dashboard = async (req, res) => {
  const { role, id } = req.user;

  if (role === 'parent') {
    // Find linked student via ParentLink
    const link = await ParentLink.findOne({
      where: { parent_id: id },
      include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email', 'admission_no', 'current_class', 'section'] }],
    });

    if (!link) {
      return res.json({ role: 'parent', data: { linked_student: null, attendance: {}, recent_marks: [] } });
    }

    const studentId = link.student.id;

    const attendanceStats = await Attendance.findAll({
      where: { student_id: studentId },
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });

    const marks = await Mark.findAll({
      where: { student_id: studentId },
      include: [{ model: Batch, attributes: ['name'] }],
      order: [['exam_date', 'DESC']],
      limit: 10,
    });

    return res.json({
      role: 'parent',
      data: {
        linked_student: link.student,
        attendance: attendanceStats.reduce((acc, s) => ({ ...acc, [s.status]: parseInt(s.count) }), {}),
        recent_marks: marks.map(m => ({
          exam_name: m.exam_name,
          score: m.score,
          max_score: m.max_score,
          percentage: m.max_score > 0 ? parseFloat(((m.score / m.max_score) * 100).toFixed(1)) : 0,
          batch: m.Batch?.name || '',
          date: m.exam_date,
        })),
      },
    });
  }

  if (role === 'student') {
    const attendanceStats = await Attendance.findAll({
      where: { student_id: id },
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });

    const marks = await Mark.findAll({
      where: { student_id: id },
      include: [{ model: Batch, attributes: ['name'] }],
      order: [['exam_date', 'DESC']],
      limit: 5,
    });

    const enrollments = await Enrollment.count({ where: { student_id: id } });

    return res.json({
      role: 'student',
      data: {
        total_enrollments: enrollments,
        attendance: attendanceStats.reduce((acc, s) => ({ ...acc, [s.status]: parseInt(s.count) }), {}),
        recent_marks: marks.map(m => ({
          exam_name: m.exam_name,
          score: m.score,
          max_score: m.max_score,
          percentage: m.max_score > 0 ? parseFloat(((m.score / m.max_score) * 100).toFixed(1)) : 0,
          batch: m.Batch?.name || '',
          date: m.exam_date,
        })),
      },
    });
  }

  if (role === 'teacher') {
    const batches = await Batch.findAll({
      where: { teacher_id: id, is_active: true },
      attributes: ['id', 'name', 'shift', 'start_time', 'end_time'],
      order: [['shift', 'ASC']],
    });
    const batchIds = batches.map(b => b.id);

    const studentCount = await Enrollment.count({
      where: { batch_id: { [Op.in]: batchIds } },
      distinct: true,
      col: 'student_id',
    });

    // Per-batch stats
    const today = new Date().toISOString().split('T')[0];
    const batchStats = await Promise.all(batches.map(async (b) => {
      const totalStudents = await Enrollment.count({ where: { batch_id: b.id } });
      const presentToday = await Attendance.count({
        where: { batch_id: b.id, date: today, status: 'present' },
      });
      return { id: b.id, name: b.name, shift: b.shift, start_time: b.start_time, end_time: b.end_time, total_students: totalStudents, present_today: presentToday };
    }));

    // Weekly attendance for teacher's batches
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const weeklyAttendance = await Attendance.findAll({
      where: {
        batch_id: { [Op.in]: batchIds },
        date: { [Op.gte]: sevenDaysAgo.toISOString().split('T')[0] },
      },
      attributes: ['date', 'status', [fn('COUNT', col('id')), 'count']],
      group: ['date', 'status'],
      raw: true,
    });

    return res.json({
      role: 'teacher',
      data: {
        total_batches: batches.length,
        total_students: studentCount,
        my_batches: batchStats,
        weekly_attendance: weeklyAttendance,
      },
    });
  }

  // Admin — aggregate analytics
  const [
    studentCount, teacherCount, adminCount, parentCount,
    subjectCount, batchCount, activeBatchCount,
    enrollmentCount, totalMarks,
  ] = await Promise.all([
    User.count({ where: { role: 'student', is_active: true } }),
    User.count({ where: { role: 'teacher', is_active: true } }),
    User.count({ where: { role: 'admin', is_active: true } }),
    User.count({ where: { role: 'parent', is_active: true } }),
    Subject.count(),
    Batch.count(),
    Batch.count({ where: { is_active: true } }),
    Enrollment.count(),
    Mark.count(),
  ]);

  // Weekly attendance (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const weeklyAttendance = await Attendance.findAll({
    where: { date: { [Op.gte]: sevenDaysAgo.toISOString().split('T')[0] } },
    attributes: [
      'date', 'status', [fn('COUNT', col('id')), 'count'],
    ],
    group: ['date', 'status'],
    raw: true,
    order: [['date', 'ASC']],
  });

  // Build day-by-day chart data
  const chartData = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en', { weekday: 'short' });
    const present = weeklyAttendance.find(r => r.date === dateStr && r.status === 'present');
    const absent = weeklyAttendance.find(r => r.date === dateStr && r.status === 'absent');
    const late = weeklyAttendance.find(r => r.date === dateStr && r.status === 'late');
    const total = (parseInt(present?.count || 0)) + (parseInt(absent?.count || 0)) + (parseInt(late?.count || 0));
    chartData.push({
      date: dateStr,
      day: dayName,
      present: parseInt(present?.count || 0),
      absent: parseInt(absent?.count || 0),
      late: parseInt(late?.count || 0),
      total,
      rate: total > 0 ? parseFloat((((parseInt(present?.count || 0)) / total) * 100).toFixed(1)) : 0,
    });
  }

  // Recent activity feed
  const recentAnnouncements = await Announcement.findAll({
    include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
    order: [['created_at', 'DESC']],
    limit: 5,
  });

  const recentMarks = await Mark.findAll({
    include: [
      { model: User, as: 'student', attributes: ['id', 'name'] },
      { model: Batch, attributes: ['name'] },
    ],
    order: [['created_at', 'DESC']],
    limit: 5,
  });

  const recentAttendance = await Attendance.findAll({
    include: [
      { model: User, as: 'student', attributes: ['id', 'name'] },
      { model: Batch, attributes: ['name'] },
    ],
    order: [['created_at', 'DESC']],
    limit: 5,
  });

  // Active batches with student counts
  const activeBatches = await Batch.findAll({
    where: { is_active: true },
    include: [
      { model: Subject, attributes: ['name'] },
      { model: User, as: 'teacher', attributes: ['id', 'name'] },
    ],
    limit: 5,
    order: [['created_at', 'DESC']],
  });

  const batchStudentCounts = await Promise.all(
    activeBatches.map(b =>
      Enrollment.count({ where: { batch_id: b.id } })
    )
  );

  // Batch stats by shift for dashboard cards
  const today = new Date().toISOString().split('T')[0];
  const allBatches = await Batch.findAll({
    where: { is_active: true },
    attributes: ['id', 'name', 'shift', 'start_time', 'end_time'],
  });
  const morningBatches = [];
  const eveningBatches = [];
  for (const b of allBatches) {
    const totalStudents = await Enrollment.count({ where: { batch_id: b.id } });
    const presentToday = await Attendance.count({
      where: { batch_id: b.id, date: today, status: 'present' },
    });
    const stats = { id: b.id, name: b.name, total_students: totalStudents, present_today: presentToday };
    if (b.shift === 'morning') morningBatches.push(stats);
    else eveningBatches.push(stats);
  }

  // Fee statistics for admin
  let feeStats = { total_collected: 0, total_pending: 0, pending_count: 0, collection_rate: 0, today_collection: 0 };
  try {
    const { Fee } = require('../models');
    const { fn, col, literal, Op } = require('sequelize');
    const today = new Date().toISOString().split('T')[0];
    const feeTotals = await Fee.findAll({
      attributes: [
        [fn('SUM', col('paid_amount')), 'total_collected'],
        [fn('SUM', literal('amount - paid_amount')), 'total_pending'],
        [fn('SUM', col('amount')), 'total_amount'],
        [fn('COUNT', col('id')), 'total_records'],
      ],
      raw: true,
    });
    const pendingCount = await Fee.count({ where: { status: ['pending', 'partial'] } });
    const todayCol = await Fee.sum('paid_amount', {
      where: { payment_date: today },
    });
    const ft = feeTotals[0] || {};
    feeStats = {
      total_collected: parseFloat(ft.total_collected || 0),
      total_pending: parseFloat(ft.total_pending || 0),
      pending_count: pendingCount,
      collection_rate: parseFloat(ft.total_amount || 0) > 0
        ? parseFloat((((ft.total_collected || 0) / (ft.total_amount || 0)) * 100).toFixed(1))
        : 0,
      today_collection: parseFloat(todayCol || 0),
    };
  } catch (_e) {
    // Fee table may not exist yet
  }

  // Default fallback for unhandled roles
  if (role !== 'admin') {
    return res.status(403).json({ error: 'No analytics available for this role' });
  }

  res.json({
    role: 'admin',
    data: {
      totals: {
        students: studentCount,
        teachers: teacherCount,
        admins: adminCount,
        parents: parentCount,
        subjects: subjectCount,
        batches: batchCount,
        active_batches: activeBatchCount,
        enrollments: enrollmentCount,
        total_marks: totalMarks,
        student_teacher_ratio: teacherCount > 0 ? parseFloat((studentCount / teacherCount).toFixed(1)) : 0,
      },
      weekly_attendance: chartData,
      recent_activity: {
        announcements: recentAnnouncements.map(a => ({
          id: a.id,
          type: 'announcement',
          title: a.title,
          body: a.body?.substring(0, 100),
          author: a.author?.name || '',
          created_at: a.created_at,
        })),
        marks: recentMarks.map(m => ({
          id: m.id,
          type: 'mark',
          student: m.student?.name || '',
          exam: m.exam_name,
          score: `${m.score}/${m.max_score}`,
          batch: m.Batch?.name || '',
          created_at: m.created_at,
        })),
        attendance: recentAttendance.map(a => ({
          id: a.id,
          type: 'attendance',
          student: a.student?.name || '',
          status: a.status,
          batch: a.Batch?.name || '',
          date: a.date,
          created_at: a.created_at,
        })),
      },
      active_batches: activeBatches.map((b, i) => ({
        id: b.id,
        name: b.name,
        subject: b.Subject?.name || '',
        teacher: b.teacher?.name || '',
        student_count: batchStudentCounts[i] || 0,
      })),
      shift_stats: { morning: morningBatches, evening: eveningBatches },
      fees: feeStats,
    },
  });
};
