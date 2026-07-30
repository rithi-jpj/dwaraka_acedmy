const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('AuditLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  user_name: { type: DataTypes.STRING, allowNull: true },
  user_role: { type: DataTypes.ENUM('admin', 'teacher', 'student', 'parent'), allowNull: false },
  action: {
    type: DataTypes.ENUM(
      'login', 'logout', 'create', 'update', 'delete', 'fee_payment',
      'attendance_marked', 'notification_sent', 'password_change',
      'settings_change', 'marks_entered', 'assignment_created',
      'submission_graded', 'upload', 'enrollment', 'export'
    ),
    allowNull: false,
  },
  resource: { type: DataTypes.STRING, allowNull: true },
  resource_id: { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  metadata: { type: DataTypes.JSONB, defaultValue: {} },
  ip_address: { type: DataTypes.STRING, allowNull: true },
  user_agent: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'audit_logs',
  timestamps: true,
  updatedAt: false, // logs are immutable
  indexes: [
    { fields: ['user_id'] },
    { fields: ['action'] },
    { fields: ['resource'] },
    { fields: ['created_at'] },
    { fields: ['user_role'] },
  ],
});
