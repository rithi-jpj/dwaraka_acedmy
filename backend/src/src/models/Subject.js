const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Subject', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT },
}, { tableName: 'subjects' });
