const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Class', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  section: { type: DataTypes.STRING },
  room: { type: DataTypes.STRING },
  schedule: { type: DataTypes.STRING },
  teacher_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    onDelete: 'SET NULL',
  },
  subject_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'subjects', key: 'id' },
    onDelete: 'SET NULL',
  },
  academic_year: { type: DataTypes.STRING },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'classes',
  indexes: [
    { fields: ['teacher_id'] },
    { fields: ['subject_id'] },
    { fields: ['academic_year'] },
    { fields: ['is_active'] },
  ],
});
