const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Enrollment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id: { type: DataTypes.UUID, allowNull: false },
  batch_id: { type: DataTypes.UUID, allowNull: false },
}, { tableName: 'enrollments', indexes: [{ unique: true, fields: ['student_id', 'batch_id'] }] });
