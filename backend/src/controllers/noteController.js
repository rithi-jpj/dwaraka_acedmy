const path = require('path');
const fs = require('fs');
const env = require('../config/env');
const { Note, Batch, Enrollment } = require('../models');

exports.upload = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File required' });
  const { batch_id, title } = req.body;
  if (!batch_id || !title) return res.status(400).json({ error: 'batch_id and title required' });
  const note = await Note.create({
    batch_id, title, uploaded_by: req.user.id,
    filename: req.file.filename,
    original_name: req.file.originalname,
    mime_type: req.file.mimetype,
    size_bytes: req.file.size,
  });
  res.status(201).json(note);
};

exports.list = async (req, res) => {
  const where = { batch_id: req.params.batchId };
  const rows = await Note.findAll({ where, order: [['created_at', 'DESC']] });
  res.json(rows);
};

exports.download = async (req, res) => {
  const note = await Note.findByPk(req.params.id);
  if (!note) return res.status(404).json({ error: 'Not found' });

  // Access check: teacher of the batch, admin, or enrolled student
  if (req.user.role === 'student') {
    const enrolled = await Enrollment.findOne({ where: { student_id: req.user.id, batch_id: note.batch_id } });
    if (!enrolled) return res.status(403).json({ error: 'Forbidden' });
  } else if (req.user.role === 'teacher') {
    const batch = await Batch.findByPk(note.batch_id);
    if (!batch || batch.teacher_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  }

  const filePath = path.resolve(process.cwd(), env.UPLOAD_DIR, note.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing' });
  res.download(filePath, note.original_name);
};
