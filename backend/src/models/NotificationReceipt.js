const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('NotificationReceipt', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  notification_id: { type: DataTypes.UUID, allowNull: false },
  user_id: { type: DataTypes.UUID, allowNull: false },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  read_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'notification_receipts',
  timestamps: true,
  indexes: [
    { fields: ['notification_id'] },
    { fields: ['user_id'] },
    { fields: ['user_id', 'is_read'] },
    { unique: true, fields: ['notification_id', 'user_id'] },
  ],
});
