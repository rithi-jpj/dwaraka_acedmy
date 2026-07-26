const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Batch', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  subject_id: { type: DataTypes.UUID, allowNull: false },
  teacher_id: { type: DataTypes.UUID, allowNull: false },
  shift: { type: DataTypes.ENUM('morning', 'evening'), defaultValue: 'morning' },
  start_time: { type: DataTypes.STRING },
  end_time: { type: DataTypes.STRING },
  max_capacity: { type: DataTypes.INTEGER, defaultValue: 30 },
  description: { type: DataTypes.TEXT },
  schedule: { type: DataTypes.STRING },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'batches', indexes: [
  { fields: ['shift'] },
  { fields: ['is_active'] },
  { fields: ['teacher_id'] },
] });
