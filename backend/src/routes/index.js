const router = require('express').Router();
const { authRequired, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const auth = require('../controllers/authController');
const users = require('../controllers/userController');
const ac = require('../controllers/academicController');
const notes = require('../controllers/noteController');
const ann = require('../controllers/announcementController');

// Auth
router.post('/auth/login', auth.login);
router.get('/auth/me', authRequired, auth.me);
router.post('/auth/change-password', authRequired, auth.changePassword);

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

// Batches
router.get('/batches', authRequired, ac.listBatches);
router.post('/batches', authRequired, requireRole('admin'), ac.createBatch);
router.post('/enrollments', authRequired, requireRole('admin'), ac.enroll);
router.get('/batches/:id/students', authRequired, requireRole('admin', 'teacher'), ac.batchStudents);

// Attendance
router.post('/attendance', authRequired, requireRole('admin', 'teacher'), ac.markAttendance);
router.get('/attendance/batch/:batchId', authRequired, requireRole('admin', 'teacher'), ac.getAttendance);
router.get('/attendance/me', authRequired, requireRole('student'), ac.myAttendance);

// Marks
router.post('/marks', authRequired, requireRole('admin', 'teacher'), ac.addMark);
router.get('/marks/batch/:batchId', authRequired, requireRole('admin', 'teacher'), ac.batchMarks);
router.get('/marks/me', authRequired, requireRole('student'), ac.myMarks);

// Notes
router.post('/notes', authRequired, requireRole('admin', 'teacher'), upload.single('file'), notes.upload);
router.get('/notes/batch/:batchId', authRequired, notes.list);
router.get('/notes/:id/download', authRequired, notes.download);

// Announcements
router.get('/announcements', authRequired, ann.list);
router.post('/announcements', authRequired, requireRole('admin', 'teacher'), ann.create);

module.exports = router;
