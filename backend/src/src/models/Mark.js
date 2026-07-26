const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Mark', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  batch_id: { type: DataTypes.UUID, allowNull: false },
  student_id: { type: DataTypes.UUID, allowNull: false },
  exam_name: { type: DataTypes.STRING, allowNull: false },
  score: { type: DataTypes.FLOAT, allowNull: false },
  max_score: { type: DataTypes.FLOAT, allowNull: false },
  exam_date: { type: DataTypes.DATEONLY },
}, { tableName: 'marks' });
