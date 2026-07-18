const { sequelize } = require('../models');

(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  console.log('Migration complete.');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
