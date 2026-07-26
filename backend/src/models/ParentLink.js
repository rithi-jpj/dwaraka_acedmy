const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('ParentLink', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  parent_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  relationship: { type: DataTypes.STRING },
}, {
  tableName: 'parent_links',
  indexes: [
    { unique: true, fields: ['parent_id', 'student_id'] },
  ],
});
