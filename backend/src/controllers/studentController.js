const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const service = require('../services/studentService');
const { createStudentSchema, updateStudentSchema, statusSchema, listStudentsSchema } = require('../validation/studentValidation');

const findStudent = async (id, res) => {
  const student = await service.get(id);
  if (!student) { res.status(404).json({ error: 'Student not found' }); return null; }
  return student;
};
const removePhoto = (filename) => { if (filename) fs.unlink(path.resolve(process.cwd(), env.UPLOAD_DIR, filename), () => {}); };

exports.list = async (req, res) => res.json(await service.list(listStudentsSchema.parse(req.query)));
exports.me = async (req, res) => {
  const student = await service.getForUser(req.user.id);
  if (!student || student.status !== 'active') return res.status(404).json({ error: 'Student profile not found' });
  res.json(service.serialize(student));
};
exports.get = async (req, res) => { const student = await findStudent(req.params.id, res); if (student) res.json(service.serialize(student)); };
exports.create = async (req, res) => {
  const result = await service.create(createStudentSchema.parse(req.body), req.file);
  res.status(201).json({ student: service.serialize(result.student), temporaryPassword: result.temporaryPassword });
};
exports.update = async (req, res) => {
  const student = await findStudent(req.params.id, res); if (!student) return;
  const result = await service.update(student, updateStudentSchema.parse(req.body), req.file);
  res.json(service.serialize(result));
};
exports.setStatus = async (req, res) => {
  const student = await findStudent(req.params.id, res); if (!student) return;
  res.json(service.serialize(await service.setStatus(student, statusSchema.parse(req.body).status)));
};
exports.resetPassword = async (req, res) => {
  const student = await findStudent(req.params.id, res); if (!student) return;
  res.json({ temporaryPassword: await service.resetPassword(student) });
};
exports.remove = async (req, res) => {
  const student = await findStudent(req.params.id, res); if (!student) return;
  res.json({ student: service.serialize(await service.softDelete(student)) });
};
exports.deletePhoto = async (req, res) => {
  const student = await findStudent(req.params.id, res); if (!student) return;
  removePhoto(student.photo); student.photo = null; await student.save(); res.json(service.serialize(await service.get(student.id)));
};
const sendPhoto = (student, res) => {
  if (!student.photo) return res.status(404).json({ error: 'Photo not found' });
  const filePath = path.resolve(process.cwd(), env.UPLOAD_DIR, student.photo);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Photo file missing' });
  return res.sendFile(filePath);
};
exports.photo = async (req, res) => { const student = await findStudent(req.params.id, res); if (student) sendPhoto(student, res); };
exports.myPhoto = async (req, res) => { const student = await service.getForUser(req.user.id); if (!student) return res.status(404).json({ error: 'Photo not found' }); return sendPhoto(student, res); };
