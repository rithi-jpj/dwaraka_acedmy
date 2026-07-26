const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Assignment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  batch_id: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  due_date: { type: DataTypes.DATEONLY },
  file_url: { type: DataTypes.STRING },
  original_filename: { type: DataTypes.STRING },
  mime_type: { type: DataTypes.STRING },
  size_bytes: { type: DataTypes.INTEGER },
  created_by: { type: DataTypes.UUID, allowNull: false },
}, { tableName: 'assignments' });
