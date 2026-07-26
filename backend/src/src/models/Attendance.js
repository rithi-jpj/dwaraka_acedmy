const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Attendance', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  batch_id: { type: DataTypes.UUID, allowNull: false },
  student_id: { type: DataTypes.UUID, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.ENUM('present', 'absent', 'late'), allowNull: false },
  remarks: { type: DataTypes.STRING },
}, { tableName: 'attendance', indexes: [{ unique: true, fields: ['batch_id', 'student_id', 'date'] }] });
