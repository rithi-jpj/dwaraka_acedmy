const { Op } = require('sequelize');
const { sequelize, Student, User, Batch, Enrollment } = require('../models');
const { hash, randomPassword } = require('../utils/password');

const studentInclude = [{ model: User, as: 'user', attributes: ['id', 'username', 'is_active', 'must_change_password'] }, { model: Batch, as: 'batch', attributes: ['id', 'name', 'schedule'], required: false }];
const emptyToNull = (value) => value === '' ? null : value;
const dataForStudent = (data) => Object.fromEntries(Object.entries(data).filter(([key]) => !['username', 'temporary_password'].includes(key)).map(([key, value]) => [key, emptyToNull(value)]));

exports.serialize = (student) => {
  const row = student.toJSON ? student.toJSON() : student;
  return { ...row, username: row.user?.username, is_active: row.user?.is_active };
};

async function ensureBatch(batchId) {
  if (batchId && !await Batch.findByPk(batchId)) {
    const error = new Error('Batch not found'); error.status = 400; throw error;
  }
}

exports.list = async (query) => {
  const { q, classId, batchId, status, gender, page, pageSize, sortBy, sortOrder } = query;
  const where = {};
  if (classId) where.class_id = classId;
  if (batchId) where.batch_id = batchId;
  if (status) where.status = status;
  if (gender) where.gender = gender;
  if (q) where[Op.or] = [
    { admission_number: { [Op.iLike]: `%${q}%` } }, { first_name: { [Op.iLike]: `%${q}%` } },
    { last_name: { [Op.iLike]: `%${q}%` } }, { phone: { [Op.iLike]: `%${q}%` } }, { email: { [Op.iLike]: `%${q}%` } },
    { class_id: { [Op.iLike]: `%${q}%` } },
  ];
  const { rows, count } = await Student.findAndCountAll({ where, include: studentInclude, order: [[sortBy, sortOrder.toUpperCase()]], limit: pageSize, offset: (page - 1) * pageSize, distinct: true });
  return { items: rows.map(exports.serialize), pagination: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) } };
};

exports.get = async (id) => Student.findByPk(id, { include: studentInclude });

exports.create = async (data, photo) => {
  const result = await sequelize.transaction(async (transaction) => {
  await ensureBatch(data.batch_id);
  const temporaryPassword = data.temporary_password || randomPassword(12);
  const user = await User.create({
    name: `${data.first_name} ${data.last_name}`.trim(), email: data.email.toLowerCase(), username: data.username.toLowerCase(),
    phone: data.phone, role: 'student', password_hash: await hash(temporaryPassword), must_change_password: true,
  }, { transaction });
  const student = await Student.create({ ...dataForStudent(data), email: data.email.toLowerCase(), user_id: user.id, photo: photo?.filename }, { transaction });
  if (student.batch_id) await Enrollment.findOrCreate({ where: { student_id: user.id, batch_id: student.batch_id }, defaults: { student_id: user.id, batch_id: student.batch_id }, transaction });
    return { id: student.id, temporaryPassword };
  });
  return { student: await exports.get(result.id), temporaryPassword: result.temporaryPassword };
};

exports.update = async (student, data, photo) => sequelize.transaction(async (transaction) => {
  await ensureBatch(data.batch_id);
  const previousBatchId = student.batch_id;
  const changes = dataForStudent(data);
  Object.assign(student, changes);
  if (photo) student.photo = photo.filename;
  if (data.email) student.email = data.email.toLowerCase();
  await student.save({ transaction });
  const user = await User.findByPk(student.user_id, { transaction });
  Object.assign(user, {
    name: `${student.first_name} ${student.last_name}`.trim(), email: student.email,
    phone: student.phone,
  });
  if (data.username) user.username = data.username.toLowerCase();
  await user.save({ transaction });
  if (data.batch_id !== undefined && data.batch_id !== previousBatchId) {
    if (previousBatchId) await Enrollment.destroy({ where: { student_id: user.id, batch_id: previousBatchId }, transaction });
    if (student.batch_id) await Enrollment.findOrCreate({ where: { student_id: user.id, batch_id: student.batch_id }, defaults: { student_id: user.id, batch_id: student.batch_id }, transaction });
  }
  return exports.get(student.id);
});

exports.setStatus = async (student, status) => {
  student.status = status; await student.save();
  const user = await User.findByPk(student.user_id); user.is_active = status === 'active'; await user.save();
  return exports.get(student.id);
};

exports.resetPassword = async (student) => {
  const temporaryPassword = randomPassword(12);
  const user = await User.findByPk(student.user_id);
  user.password_hash = await hash(temporaryPassword); user.must_change_password = true; await user.save();
  return temporaryPassword;
};

exports.softDelete = async (student) => exports.setStatus(student, 'deleted');

exports.getForUser = async (userId) => Student.findOne({ where: { user_id: userId }, include: studentInclude });
