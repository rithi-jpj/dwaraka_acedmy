const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('ParentRequest', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  parent_name: { type: DataTypes.STRING, allowNull: false },
  parent_email: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
  parent_phone: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending', allowNull: false },
  reviewed_by: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' },
    onDelete: 'SET NULL',
  },
  reviewed_at: { type: DataTypes.DATE },
  rejection_reason: { type: DataTypes.TEXT },
}, {
  tableName: 'parent_requests',
  indexes: [
    { unique: true, fields: ['student_id', 'status'], name: 'idx_parent_req_active', where: { status: 'pending' } },
  ],
});
