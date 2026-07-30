/**
 * Dwaraka Academy — Production Database Migration Script
 *
 * Replaces sequelize.sync({ alter: true }) with controlled sequential
 * migrations that track which have been applied.
 *
 * Usage:
 *   node src/scripts/migrate.js           # Run all pending migrations
 *   DRY_RUN=true node src/scripts/migrate.js  # Preview only
 *
 * Environment:
 *   DATABASE_URL  — PostgreSQL connection string (required)
 *   DRY_RUN       — If 'true', only logs what would be done
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const env = require('../config/env');

// ── Database Connection ──────────────────────────────────────────────────

const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  define: { underscored: true, timestamps: true },
});

// ── Migration Tracking Table ─────────────────────────────────────────────

const MIGRATIONS_TABLE = '_migrations';

async function ensureMigrationsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS "${MIGRATIONS_TABLE}" (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
  await sequelize.query(query);
}

async function getAppliedMigrations() {
  const [rows] = await sequelize.query(
    `SELECT name FROM "${MIGRATIONS_TABLE}" ORDER BY name`
  );
  return new Set(rows.map(r => r.name));
}

async function markApplied(name) {
  await sequelize.query(
    `INSERT INTO "${MIGRATIONS_TABLE}" (name) VALUES (?)`,
    { replacements: [name] }
  );
}

// ── Migration Registry ───────────────────────────────────────────────────
//
// Each migration is a { name, up } object.
// `name` must be unique and should describe what the migration does.
// `up` is an async function that receives the sequelize instance.

const migrations = [
  {
    name: '001_create_audit_logs',
    up: async (sql) => {
      await sql.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          user_name VARCHAR(255),
          user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('admin','teacher','student','parent')),
          action VARCHAR(50) NOT NULL,
          resource VARCHAR(255),
          resource_id VARCHAR(255),
          description TEXT,
          metadata JSONB DEFAULT '{}',
          ip_address VARCHAR(45),
          user_agent VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      // Indexes for audit_logs
      await sql.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)');
      await sql.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)');
      await sql.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)');
      await sql.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource)');
    },
  },
  {
    name: '002_add_missing_indexes',
    up: async (sql) => {
      // Ensure all tables have proper indexes for performance
      const indexQueries = [
        'CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date)',
        'CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status)',
        'CREATE INDEX IF NOT EXISTS idx_marks_exam_name ON marks(exam_name)',
        'CREATE INDEX IF NOT EXISTS idx_marks_student_id ON marks(student_id)',
        'CREATE INDEX IF NOT EXISTS idx_marks_batch_id ON marks(batch_id)',
        'CREATE INDEX IF NOT EXISTS idx_assignments_batch_id ON assignments(batch_id)',
        'CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date)',
        'CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON assignment_submissions(assignment_id)',
        'CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON assignment_submissions(student_id)',
        'CREATE INDEX IF NOT EXISTS idx_enrollments_batch_id ON enrollments(batch_id)',
        'CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id)',
        'CREATE INDEX IF NOT EXISTS idx_notes_batch_id ON notes(batch_id)',
        'CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at)',
        'CREATE INDEX IF NOT EXISTS idx_parent_requests_status ON parent_requests(status)',
        'CREATE INDEX IF NOT EXISTS idx_parent_links_parent_id ON parent_links(parent_id)',
        'CREATE INDEX IF NOT EXISTS idx_parent_links_student_id ON parent_links(student_id)',
        'CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id)',
        'CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status)',
        'CREATE INDEX IF NOT EXISTS idx_site_content_section ON site_content(section)',
        'CREATE INDEX IF NOT EXISTS idx_fees_academic_year ON fees(academic_year)',
        'CREATE INDEX IF NOT EXISTS idx_fees_payment_date ON fees(payment_date)',
        'CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at)',
        'CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON notification_receipts(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_receipts_read ON notification_receipts(user_id, is_read)',
      ];
      for (const q of indexQueries) {
        try { await sql.query(q); } catch (e) { /* index may already exist */ }
      }
    },
  },
  {
    name: '003_add_created_by_to_tables',
    up: async (sql) => {
      // Add created_by and updated_by columns to tables that don't have them
      const columns = [
        { table: 'attendance', col: 'created_by', type: 'UUID' },
        { table: 'marks', col: 'created_by', type: 'UUID' },
        { table: 'marks', col: 'updated_by', type: 'UUID' },
      ];
      for (const { table, col, type } of columns) {
        try {
          await sql.query(
            `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${col}" ${type}`
          );
        } catch (e) {
          // Column may already exist
        }
      }
    },
  },
  {
    name: '004_add_assignment_fields',
    up: async (sql) => {
      const fields = [
        { table: 'assignments', col: 'max_score', type: 'FLOAT' },
        { table: 'assignments', col: 'pass_score', type: 'FLOAT' },
        { table: 'assignments', col: 'description', type: 'TEXT' },
      ];
      for (const { table, col, type } of fields) {
        try {
          await sql.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${col}" ${type}`);
        } catch (e) { /* ok */ }
      }
    },
  },
  {
    name: '005_add_teachers_subjects',
    up: async (sql) => {
      // Create teacher_subjects junction table if it doesn't exist
      try {
        await sql.query(`
          CREATE TABLE IF NOT EXISTS teacher_subjects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(teacher_id, subject_id)
          )
        `);
        await sql.query('CREATE INDEX IF NOT EXISTS idx_ts_teacher_id ON teacher_subjects(teacher_id)');
        await sql.query('CREATE INDEX IF NOT EXISTS idx_ts_subject_id ON teacher_subjects(subject_id)');
      } catch (e) {
        console.log('[migrate] teacher_subjects table may already exist:', e.message.substring(0, 80));
      }
    },
  },
];

// ── Run Migrations ───────────────────────────────────────────────────────

async function runMigrations() {
  console.log('═══════════════════════════════════════════');
  console.log('  Dwaraka Academy — Database Migration');
  console.log('  Environment:', env.NODE_ENV || 'development');
  if (process.env.DRY_RUN === 'true') console.log('  MODE: DRY RUN (no changes applied)');
  console.log('═══════════════════════════════════════════');
  console.log('');

  try {
    await sequelize.authenticate();
    console.log('✓ Database connected\n');

    await ensureMigrationsTable();
    const applied = await getAppliedMigrations();
    console.log(`Found ${applied.size} previously applied migration(s)\n`);

    let pending = 0;
    let applied_count = 0;

    for (const migration of migrations) {
      if (applied.has(migration.name)) {
        console.log(`  [SKIP] ${migration.name} (already applied)`);
        continue;
      }

      pending++;
      console.log(`  [RUN]  ${migration.name}...`);

      if (process.env.DRY_RUN !== 'true') {
        try {
          await migration.up(sequelize);
          await markApplied(migration.name);
          applied_count++;
          console.log(`  [DONE] ${migration.name}`);
        } catch (err) {
          console.error(`  [FAIL] ${migration.name}: ${err.message}`);
          console.error('         Migration aborted. Manual intervention may be required.');
          process.exit(1);
        }
      } else {
        console.log(`  [DRY]  Would apply: ${migration.name}`);
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════');
    if (pending === 0) {
      console.log('  ✓ No pending migrations. Database is up-to-date.');
    } else {
      console.log(`  ✓ ${applied_count} of ${pending} migrations applied successfully`);
    }
    console.log('═══════════════════════════════════════════');

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigrations();
