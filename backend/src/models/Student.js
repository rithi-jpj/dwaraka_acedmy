const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Student', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false, unique: true },
  admission_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  roll_number: { type: DataTypes.STRING },
  first_name: { type: DataTypes.STRING, allowNull: false },
  last_name: { type: DataTypes.STRING, allowNull: false },
  gender: { type: DataTypes.ENUM('male', 'female', 'other'), allowNull: false },
  dob: { type: DataTypes.DATEONLY, allowNull: false },
  blood_group: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
  phone: { type: DataTypes.STRING, allowNull: false },
  parent_phone: { type: DataTypes.STRING },
  address: { type: DataTypes.TEXT },
  city: { type: DataTypes.STRING },
  state: { type: DataTypes.STRING },
  country: { type: DataTypes.STRING },
  pincode: { type: DataTypes.STRING },
  photo: { type: DataTypes.STRING },
  // The project has no Class model; this stores the academy's class identifier/label.
  class_id: { type: DataTypes.STRING, allowNull: false },
  batch_id: { type: DataTypes.UUID },
  status: { type: DataTypes.ENUM('active', 'inactive', 'deleted'), allowNull: false, defaultValue: 'active' },
}, {
  tableName: 'students',
  indexes: [
    { fields: ['admission_number'] },
    { fields: ['class_id'] },
    { fields: ['batch_id'] },
    { fields: ['status'] },
    { fields: ['first_name', 'last_name'] },
  ],
});
