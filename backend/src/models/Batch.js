const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Batch', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  subject_id: { type: DataTypes.UUID, allowNull: false },
  teacher_id: { type: DataTypes.UUID, allowNull: false },
  schedule: { type: DataTypes.STRING },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'batches' });
