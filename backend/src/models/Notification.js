const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Notification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  // Sender
  sender_id: { type: DataTypes.UUID, allowNull: false },
  // Audience
  audience: {
    type: DataTypes.ENUM('all', 'students', 'teachers', 'parents', 'specific'),
    defaultValue: 'all',
  },
  // For 'specific' audience, specify user IDs as JSON array
  target_user_ids: { type: DataTypes.JSONB, defaultValue: [] },
  // Content
  title: { type: DataTypes.STRING, allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: false },
  type: {
    type: DataTypes.ENUM('information', 'warning', 'success', 'exam', 'fee_reminder', 'holiday', 'assignment', 'event'),
    defaultValue: 'information',
  },
  // Optional link/resource
  link_url: { type: DataTypes.STRING },
  // Priority
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal',
  },
  // Tracking
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  scheduled_at: { type: DataTypes.DATE, allowNull: true },
  sent_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    { fields: ['audience'] },
    { fields: ['type'] },
    { fields: ['is_active'] },
    { fields: ['created_at'] },
  ],
});
