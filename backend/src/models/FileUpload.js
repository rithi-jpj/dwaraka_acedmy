const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('FileUpload', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  filename: { type: DataTypes.STRING, allowNull: false },
  original_name: { type: DataTypes.STRING, allowNull: false },
  mime_type: { type: DataTypes.STRING, allowNull: false },
  size: { type: DataTypes.BIGINT, allowNull: false },
  extension: { type: DataTypes.STRING },
  is_image: { type: DataTypes.BOOLEAN, defaultValue: false },
  path: { type: DataTypes.STRING, allowNull: false },
  uploaded_by: { type: DataTypes.UUID, allowNull: false },
  category: { type: DataTypes.STRING, defaultValue: 'general' },
}, {
  tableName: 'file_uploads',
  timestamps: true,
  indexes: [
    { fields: ['uploaded_by'] },
    { fields: ['category'] },
    { fields: ['mime_type'] },
    { fields: ['created_at'] },
  ],
});
