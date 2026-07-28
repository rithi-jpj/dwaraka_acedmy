const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { authRequired, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Upload rate limiter: 30 uploads per hour per IP
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: 'Too many uploads. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const auth = require('../controllers/authController');
const users = require('../controllers/userController');
const ac = require('../controllers/academicController');
const notes = require('../controllers/noteController');
const ann = require('../controllers/announcementController');
const teachers = require('../controllers/teacherController');
const parentRequests = require('../controllers/parentRequestController');
const students = require('../controllers/studentController');
const parents = require('../controllers/parentController');
const classes = require('../controllers/classController');
const att = require('../controllers/attendanceController');
const batchCtrl = require('../controllers/batchController');
const marksCtrl = require('../controllers/marksController');
const analytics = require('../controllers/analyticsController');
const assignments = require('../controllers/assignmentController');
const enquiries = require('../controllers/enquiryController');
const content = require('../controllers/contentController');

// Auth
router.post('/auth/login', auth.login);
router.get('/auth/me', authRequired, auth.me);
router.post('/auth/change-password', authRequired, auth.changePassword);
router.post('/auth/forgot-password', auth.forgotPassword);

// Users (admin)
router.get('/users', authRequired, requireRole('admin'), users.list);
router.post('/users', authRequired, requireRole('admin'), users.create);
router.patch('/users/:id', authRequired, requireRole('admin'), users.update);
router.post('/users/:id/reset-password', authRequired, requireRole('admin'), users.resetPassword);
router.delete('/users/:id', authRequired, requireRole('admin'), users.remove);

// Subjects
router.get('/subjects', authRequired, ac.listSubjects);
router.post('/subjects', authRequired, requireRole('admin'), ac.createSubject);
router.delete('/subjects/:id', authRequired, requireRole('admin'), ac.deleteSubject);

// Batches (enhanced)
router.get('/batches', authRequired, batchCtrl.list);
router.get('/batches/my', authRequired, requireRole('teacher', 'admin'), batchCtrl.myBatches);
router.get('/batches/:id', authRequired, batchCtrl.getById);
router.get('/batches/:id/students', authRequired, requireRole('admin', 'teacher'), batchCtrl.students);
router.post('/batches', authRequired, requireRole('admin'), batchCtrl.create);
router.patch('/batches/:id', authRequired, requireRole('admin'), batchCtrl.update);
router.delete('/batches/:id', authRequired, requireRole('admin'), batchCtrl.remove);

// Enrollments (enhanced)
router.post('/enrollments', authRequired, requireRole('admin'), ac.enroll);
router.post('/batches/:id/enroll', authRequired, requireRole('admin'), batchCtrl.enrollStudent);
router.delete('/batches/:id/students/:studentId', authRequired, requireRole('admin'), batchCtrl.unenrollStudent);

// Attendance
router.post('/attendance', authRequired, requireRole('admin', 'teacher'), ac.markAttendance);
router.get('/attendance/batch/:batchId', authRequired, requireRole('admin', 'teacher'), ac.getAttendance);
router.get('/attendance/me', authRequired, requireRole('student'), ac.myAttendance);

// Enhanced Attendance Management
router.get('/attendance/batches', authRequired, requireRole('admin', 'teacher'), att.listBatches);
router.get('/attendance/batches/:batchId/students', authRequired, requireRole('admin', 'teacher'), att.batchStudents);
router.get('/attendance/:batchId/date', authRequired, requireRole('admin', 'teacher'), att.getByDate);
router.post('/attendance/bulk', authRequired, requireRole('admin', 'teacher'), att.markBulk);
router.get('/attendance/:batchId/summary', authRequired, requireRole('admin', 'teacher'), att.summary);
router.get('/attendance/:batchId/weekly', authRequired, requireRole('admin', 'teacher'), att.weeklyData);
router.get('/attendance/:batchId/export', authRequired, requireRole('admin', 'teacher'), att.exportCSV);

// Enhanced Marks Management
router.get('/marks/batches', authRequired, requireRole('admin', 'teacher'), marksCtrl.listBatches);
router.get('/marks/exams', authRequired, requireRole('admin', 'teacher'), marksCtrl.listExams);
router.get('/marks', authRequired, requireRole('admin', 'teacher'), marksCtrl.list);
router.get('/marks/stats', authRequired, requireRole('admin', 'teacher'), marksCtrl.stats);
router.get('/marks/report-card', authRequired, requireRole('admin', 'teacher'), marksCtrl.reportCard);
router.get('/marks/export', authRequired, requireRole('admin', 'teacher'), marksCtrl.exportCSV);
router.get('/marks/:id', authRequired, requireRole('admin', 'teacher'), marksCtrl.getById);
router.post('/marks', authRequired, requireRole('admin', 'teacher'), marksCtrl.create);
router.post('/marks/bulk', authRequired, requireRole('admin', 'teacher'), marksCtrl.bulkCreate);
router.patch('/marks/:id', authRequired, requireRole('admin', 'teacher'), marksCtrl.update);
router.delete('/marks/:id', authRequired, requireRole('admin', 'teacher'), marksCtrl.remove);

// Legacy marks routes (student self-service)
router.get('/marks/me', authRequired, requireRole('student'), ac.myMarks);
router.get('/marks/batch/:batchId', authRequired, requireRole('admin', 'teacher'), ac.batchMarks);

// Notes
router.post('/notes', authRequired, requireRole('admin', 'teacher'), uploadLimiter, upload.single('file'), notes.upload);
router.get('/notes/batch/:batchId', authRequired, notes.list);
router.get('/notes/:id/download', authRequired, notes.download);

// Teachers (admin)
router.get('/teachers', authRequired, requireRole('admin'), teachers.list);
router.get('/teachers/:id', authRequired, requireRole('admin'), teachers.getById);
router.post('/teachers', authRequired, requireRole('admin'), teachers.create);
router.patch('/teachers/:id', authRequired, requireRole('admin'), teachers.update);
router.delete('/teachers/:id', authRequired, requireRole('admin'), teachers.remove);
router.post('/teachers/:id/reset-password', authRequired, requireRole('admin'), teachers.resetPassword);

// Parent Requests (order matters: static routes before parameterized routes)
router.post('/parent-requests', authRequired, parentRequests.submit);
router.get('/parent-requests/my', authRequired, requireRole('student'), parentRequests.myRequest);
router.get('/parent-requests', authRequired, requireRole('admin'), parentRequests.list);
router.get('/parent-requests/:id', authRequired, requireRole('admin'), parentRequests.getById);
router.post('/parent-requests/:id/approve', authRequired, requireRole('admin'), parentRequests.approve);
router.post('/parent-requests/:id/reject', authRequired, requireRole('admin'), parentRequests.reject);
router.delete('/parent-requests/:id', authRequired, requireRole('admin'), parentRequests.remove);

// Students (admin)
router.get('/students', authRequired, requireRole('admin'), students.list);
router.get('/students/:id', authRequired, requireRole('admin'), students.getById);
router.post('/students', authRequired, requireRole('admin'), students.create);
router.patch('/students/:id', authRequired, requireRole('admin'), students.update);
router.delete('/students/:id', authRequired, requireRole('admin'), students.remove);
router.post('/students/:id/reset-password', authRequired, requireRole('admin'), students.resetPassword);

// Student self-service
router.get('/my/profile', authRequired, requireRole('student'), students.myProfile);
router.get('/my/attendance', authRequired, requireRole('student'), students.myAttendance);
router.get('/my/marks', authRequired, requireRole('student'), students.myMarks);

// Parents (admin)
router.get('/parents', authRequired, requireRole('admin'), parents.list);
router.get('/parents/:id', authRequired, requireRole('admin'), parents.getById);
router.post('/parents', authRequired, requireRole('admin'), parents.create);
router.patch('/parents/:id', authRequired, requireRole('admin'), parents.update);
router.delete('/parents/:id', authRequired, requireRole('admin'), parents.remove);
router.post('/parents/:id/reset-password', authRequired, requireRole('admin'), parents.resetPassword);
router.post('/parents/:id/link', authRequired, requireRole('admin'), parents.linkStudent);
router.delete('/parents/:id/unlink/:studentId', authRequired, requireRole('admin'), parents.unlinkStudent);

// Parent self-service
router.get('/my/parent-dashboard', authRequired, requireRole('parent'), parents.myDashboard);

// Classes (admin)
router.get('/classes', authRequired, requireRole('admin'), classes.list);
router.get('/classes/:id', authRequired, requireRole('admin'), classes.getById);
router.post('/classes', authRequired, requireRole('admin'), classes.create);
router.patch('/classes/:id', authRequired, requireRole('admin'), classes.update);
router.delete('/classes/:id', authRequired, requireRole('admin'), classes.remove);

// Dashboard Analytics
router.get('/analytics/dashboard', authRequired, analytics.dashboard);

// Assignments (admin/teacher create, student submits)
router.get('/assignments', authRequired, assignments.list);
router.get('/assignments/batches', authRequired, requireRole('admin', 'teacher'), assignments.listBatches);
router.get('/assignments/my', authRequired, requireRole('student'), assignments.myAssignments);
router.get('/assignments/:id', authRequired, assignments.getById);
router.post('/assignments', authRequired, requireRole('admin', 'teacher'), uploadLimiter, upload.single('file'), assignments.create);
router.patch('/assignments/:id', authRequired, requireRole('admin', 'teacher'), uploadLimiter, upload.single('file'), assignments.update);
router.delete('/assignments/:id', authRequired, requireRole('admin', 'teacher'), assignments.remove);

// Submissions
router.get('/assignments/:assignment_id/submissions', authRequired, requireRole('admin', 'teacher'), assignments.listSubmissions);
router.post('/assignments/:assignment_id/submit', authRequired, requireRole('student'), uploadLimiter, upload.single('file'), assignments.submit);
router.patch('/submissions/:submission_id/grade', authRequired, requireRole('admin', 'teacher'), assignments.grade);

// File downloads
router.get('/assignments/:id/download', authRequired, assignments.downloadFile);
router.get('/submissions/:submission_id/download', authRequired, assignments.downloadSubmission);

// Announcements
router.get('/announcements', authRequired, ann.list);
router.post('/announcements', authRequired, requireRole('admin', 'teacher'), ann.create);

// Enquiries (public submit, admin manage)
router.post('/enquiries', enquiries.submit);
router.get('/enquiries', authRequired, requireRole('admin'), enquiries.list);
router.patch('/enquiries/:id/status', authRequired, requireRole('admin'), enquiries.updateStatus);

// Website Content Management (admin only)
router.get('/content', authRequired, requireRole('admin'), content.list);
router.get('/content/:id', authRequired, requireRole('admin'), content.getById);
router.get('/content/section/:section', content.getBySection);
router.post('/content', authRequired, requireRole('admin'), content.create);
router.post('/content/bulk', authRequired, requireRole('admin'), content.bulkSave);
router.patch('/content/:id', authRequired, requireRole('admin'), content.update);
router.patch('/content/:id/toggle', authRequired, requireRole('admin'), content.toggleActive);
router.delete('/content/:id', authRequired, requireRole('admin'), content.remove);

module.exports = router;
