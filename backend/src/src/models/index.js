const sequelize = require('../config/db');
const User = require('./User')(sequelize);
const Subject = require('./Subject')(sequelize);
const Batch = require('./Batch')(sequelize);
const Enrollment = require('./Enrollment')(sequelize);
const Attendance = require('./Attendance')(sequelize);
const Mark = require('./Mark')(sequelize);
const Note = require('./Note')(sequelize);
const Announcement = require('./Announcement')(sequelize);
const ParentRequest = require('./ParentRequest')(sequelize);
const ParentLink = require('./ParentLink')(sequelize);
const Class = require('./Class')(sequelize);
const Assignment = require('./Assignment')(sequelize);
const AssignmentSubmission = require('./AssignmentSubmission')(sequelize);

// Associations
Batch.belongsTo(Subject, { foreignKey: 'subject_id' });
Subject.hasMany(Batch, { foreignKey: 'subject_id' });

Batch.belongsTo(User, { as: 'teacher', foreignKey: 'teacher_id' });
User.hasMany(Batch, { as: 'batches', foreignKey: 'teacher_id' });

Enrollment.belongsTo(User, { as: 'student', foreignKey: 'student_id' });
Enrollment.belongsTo(Batch, { foreignKey: 'batch_id' });
Batch.hasMany(Enrollment, { foreignKey: 'batch_id' });
User.hasMany(Enrollment, { as: 'enrollments', foreignKey: 'student_id' });

Attendance.belongsTo(Batch, { foreignKey: 'batch_id' });
Attendance.belongsTo(User, { as: 'student', foreignKey: 'student_id' });

Mark.belongsTo(Batch, { foreignKey: 'batch_id' });
Mark.belongsTo(User, { as: 'student', foreignKey: 'student_id' });

Note.belongsTo(Batch, { foreignKey: 'batch_id' });
Note.belongsTo(User, { as: 'uploader', foreignKey: 'uploaded_by' });

Announcement.belongsTo(User, { as: 'author', foreignKey: 'author_id' });

// Parent Request associations
ParentRequest.belongsTo(User, { as: 'student', foreignKey: 'student_id' });
ParentRequest.belongsTo(User, { as: 'reviewer', foreignKey: 'reviewed_by' });
User.hasMany(ParentRequest, { as: 'parent_requests', foreignKey: 'student_id' });

// Parent Link associations
ParentLink.belongsTo(User, { as: 'parent', foreignKey: 'parent_id' });
ParentLink.belongsTo(User, { as: 'student', foreignKey: 'student_id' });
User.hasMany(ParentLink, { as: 'linked_students', foreignKey: 'parent_id' });
User.hasMany(ParentLink, { as: 'linked_parents', foreignKey: 'student_id' });

// Class associations
Class.belongsTo(User, { as: 'teacher', foreignKey: 'teacher_id' });
Class.belongsTo(Subject, { foreignKey: 'subject_id' });
User.hasMany(Class, { as: 'classes', foreignKey: 'teacher_id' });
Subject.hasMany(Class, { foreignKey: 'subject_id' });

// Assignment associations
Assignment.belongsTo(Batch, { foreignKey: 'batch_id' });
Assignment.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
Batch.hasMany(Assignment, { foreignKey: 'batch_id' });
User.hasMany(Assignment, { as: 'created_assignments', foreignKey: 'created_by' });

AssignmentSubmission.belongsTo(Assignment, { foreignKey: 'assignment_id', onDelete: 'CASCADE' });
AssignmentSubmission.belongsTo(User, { as: 'student', foreignKey: 'student_id' });
AssignmentSubmission.belongsTo(User, { as: 'grader', foreignKey: 'graded_by' });
Assignment.hasMany(AssignmentSubmission, { foreignKey: 'assignment_id', onDelete: 'CASCADE' });
User.hasMany(AssignmentSubmission, { as: 'submissions', foreignKey: 'student_id' });

module.exports = {
  sequelize,
  User, Subject, Batch, Enrollment, Attendance, Mark, Note, Announcement,
  ParentRequest, ParentLink, Class,
  Assignment, AssignmentSubmission,
};
