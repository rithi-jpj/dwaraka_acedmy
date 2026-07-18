const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  phone: { type: DataTypes.STRING },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'teacher', 'student'), allowNull: false },
  must_change_password: { type: DataTypes.BOOLEAN, defaultValue: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  meta: { type: DataTypes.JSONB, defaultValue: {} },
}, { tableName: 'users' });
