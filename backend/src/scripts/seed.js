const { sequelize, User } = require('../models');
const { hash, randomPassword } = require('../utils/password');

(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  // Admin
  const adminEmail = 'rustlessirongolem';
  let admin = await User.findOne({ where: { role: 'admin' } });
  if (admin) {
    // Update existing admin credentials
    admin.email = adminEmail;
    admin.password_hash = await hash('Rithish@9030');
    await admin.save({ validate: false });
    console.log(`Admin updated: ${adminEmail} / Rithish@9030 (change on first login)`);
  } else {
    // Create new admin
    admin = await User.create({
      name: 'Administrator',
      email: adminEmail,
      role: 'admin',
      password_hash: await hash('Rithish@9030'),
      must_change_password: true,
    }, { validate: false });
    console.log(`Admin created: ${adminEmail} / Rithish@9030 (change on first login)`);
  }

  // 4 teachers
  const teachers = [
    { name: 'Teacher One',   email: 'teacher1@dwaraka.local' },
    { name: 'Teacher Two',   email: 'teacher2@dwaraka.local' },
    { name: 'Teacher Three', email: 'teacher3@dwaraka.local' },
    { name: 'Teacher Four',  email: 'teacher4@dwaraka.local' },
  ];
  for (const t of teachers) {
    const exists = await User.findOne({ where: { email: t.email } });
    if (exists) { console.log(`Teacher exists: ${t.email}`); continue; }
    const tempPassword = randomPassword(10);
    await User.create({
      name: t.name, email: t.email, role: 'teacher',
      password_hash: await hash(tempPassword), must_change_password: true,
    });
    console.log(`Teacher created: ${t.email} / ${tempPassword}`);
  }

  console.log('Seed complete.');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
