const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('AssignmentSubmission', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  assignment_id: { type: DataTypes.UUID, allowNull: false },
  student_id: { type: DataTypes.UUID, allowNull: false },
  file_url: { type: DataTypes.STRING },
  original_filename: { type: DataTypes.STRING },
  mime_type: { type: DataTypes.STRING },
  size_bytes: { type: DataTypes.INTEGER },
  notes: { type: DataTypes.TEXT },
  submitted_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  grade: { type: DataTypes.FLOAT },
  feedback: { type: DataTypes.TEXT },
  graded_by: { type: DataTypes.UUID },
  graded_at: { type: DataTypes.DATE },
}, { tableName: 'assignment_submissions', indexes: [
  { unique: true, fields: ['assignment_id', 'student_id'] },
] });
