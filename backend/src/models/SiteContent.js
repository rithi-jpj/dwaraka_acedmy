const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SiteContent = sequelize.define('SiteContent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    section: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Content section e.g. hero, about, course, faculty, result, testimonial, gallery, download, contact',
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Optional sub-key for section data (e.g. course title, faculty name)',
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: 'Content data stored as JSON — flexible for any section type',
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'site_contents',
    timestamps: true,
    underscored: false,
    indexes: [
      { fields: ['section'] },
      { fields: ['is_active'] },
      { fields: ['section', 'is_active'] },
    ],
  });

  return SiteContent;
};
