const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Enquiry', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  studentName: { type: DataTypes.STRING, allowNull: false },
  parentName: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
  studentClass: { type: DataTypes.STRING },
  course: { type: DataTypes.STRING },
  message: { type: DataTypes.TEXT },
  // STRING instead of ENUM to avoid sync conflicts with existing tables on production
  // Zod schema in the controller still enforces the three allowed values ('new', 'contacted', 'closed')
  status: { type: DataTypes.STRING, defaultValue: 'new' },
}, { tableName: 'enquiries' });
