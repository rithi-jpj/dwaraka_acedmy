const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Note', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  batch_id: { type: DataTypes.UUID, allowNull: false },
  uploaded_by: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  filename: { type: DataTypes.STRING, allowNull: false },
  original_name: { type: DataTypes.STRING, allowNull: false },
  mime_type: { type: DataTypes.STRING },
  size_bytes: { type: DataTypes.INTEGER },
}, { tableName: 'notes' });
