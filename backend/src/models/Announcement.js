const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Announcement', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  author_id: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: false },
  audience: { type: DataTypes.ENUM('all', 'teachers', 'students'), defaultValue: 'all' },
}, { tableName: 'announcements' });
