const router = require('express').Router();
const { authRequired, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { photoRequiredIsImage } = require('../middleware/studentMiddleware');
const students = require('../controllers/studentController');

router.use(authRequired, requireRole('admin'));
router.get('/', students.list);
router.post('/', upload.single('photo'), photoRequiredIsImage, students.create);
router.get('/:id/photo', students.photo);
router.get('/:id', students.get);
router.put('/:id', upload.single('photo'), photoRequiredIsImage, students.update);
router.patch('/:id/status', students.setStatus);
router.post('/:id/reset-password', students.resetPassword);
router.delete('/:id/photo', students.deletePhoto);
router.delete('/:id', students.remove);

module.exports = router;
