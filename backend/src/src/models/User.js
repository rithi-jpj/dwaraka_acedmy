const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Name is required' },
      len: { args: [1, 200], msg: 'Name must be between 1 and 200 characters' },
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: { msg: 'Email already exists' },
    validate: {
      isEmail: { msg: 'Must be a valid email address' },
      notEmpty: { msg: 'Email is required' },
    },
  },
  phone: {
    type: DataTypes.STRING(20),
    validate: {
      is: /^[+]?[\d\s\-().]{6,20}$/,
    },
  },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  role: {
    type: DataTypes.ENUM('admin', 'teacher', 'student', 'parent'),
    allowNull: false,
    validate: {
      isIn: { args: [['admin', 'teacher', 'student', 'parent']], msg: 'Invalid role' },
    },
  },
  must_change_password: { type: DataTypes.BOOLEAN, defaultValue: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  login_attempts: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
  locked_until: { type: DataTypes.DATE, allowNull: true },
  meta: { type: DataTypes.JSONB, defaultValue: {} },
  // Student-specific fields
  admission_no: { type: DataTypes.STRING(30), unique: true },
  roll_no: { type: DataTypes.STRING(20) },
  date_of_birth: { type: DataTypes.DATEONLY },
  address: { type: DataTypes.TEXT },
  guardian_name: { type: DataTypes.STRING },
  guardian_phone: {
    type: DataTypes.STRING(20),
    validate: {
      is: /^[+]?[\d\s\-().]{6,20}$/,
    },
  },
  current_class: { type: DataTypes.STRING },
  section: { type: DataTypes.STRING },
}, {
  tableName: 'users',
  indexes: [
    { fields: ['admission_no'] },
    { fields: ['role'] },
    { fields: ['current_class'] },
    { fields: ['is_active'] },
    { fields: ['login_attempts'] },
    { fields: ['locked_until'] },
  ],
});
