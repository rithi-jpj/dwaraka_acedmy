const sequelize = require('../config/db');
const User = require('./User')(sequelize);
const Subject = require('./Subject')(sequelize);
const Batch = require('./Batch')(sequelize);
const Enrollment = require('./Enrollment')(sequelize);
const Attendance = require('./Attendance')(sequelize);
const Mark = require('./Mark')(sequelize);
const Note = require('./Note')(sequelize);
const Announcement = require('./Announcement')(sequelize);
const Student = require('./Student')(sequelize);

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

Student.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
User.hasOne(Student, { as: 'student_profile', foreignKey: 'user_id' });
Student.belongsTo(Batch, { as: 'batch', foreignKey: 'batch_id' });
Batch.hasMany(Student, { as: 'student_profiles', foreignKey: 'batch_id' });

module.exports = {
  sequelize,
  User, Subject, Batch, Enrollment, Attendance, Mark, Note, Announcement, Student,
};
