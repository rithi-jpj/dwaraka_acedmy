const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Announcement', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  author_id: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: false },
  audience: { type: DataTypes.ENUM('all', 'students', 'teachers', 'parents', 'morning_batch', 'evening_batch'), defaultValue: 'all' },
  batch_id: { type: DataTypes.UUID, allowNull: true },
  batch_name: { type: DataTypes.STRING, allowNull: true },
}, { tableName: 'announcements' });
