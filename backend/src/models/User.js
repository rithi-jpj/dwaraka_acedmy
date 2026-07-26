const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  phone: { type: DataTypes.STRING },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'teacher', 'student', 'parent'), allowNull: false },
  must_change_password: { type: DataTypes.BOOLEAN, defaultValue: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  meta: { type: DataTypes.JSONB, defaultValue: {} },
  // Student-specific fields
  admission_no: { type: DataTypes.STRING, unique: true },
  roll_no: { type: DataTypes.STRING },
  date_of_birth: { type: DataTypes.DATEONLY },
  address: { type: DataTypes.TEXT },
  guardian_name: { type: DataTypes.STRING },
  guardian_phone: { type: DataTypes.STRING },
  current_class: { type: DataTypes.STRING },
  section: { type: DataTypes.STRING },
}, { tableName: 'users', indexes: [
  { fields: ['admission_no'] },
  { fields: ['role'] },
  { fields: ['current_class'] },
  { fields: ['is_active'] },
] });
