# Dwaraka Academy — Production Documentation

## Overview

Dwaraka Academy is a full-stack school management system with public website, admin dashboard, teacher/student/parent portals, fee management, notifications, and website content management.

**Tech Stack:**
- Frontend: Next.js 15 + React + TypeScript + Tailwind CSS
- Backend: Node.js + Express + Sequelize ORM
- Database: PostgreSQL
- Authentication: JWT
- Real-time: Socket.IO
- Deployment: Render

---

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Directory Structure](#directory-structure)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Authentication](#authentication)
6. [Role-Based Access](#role-based-access)
7. [Socket.IO Architecture](#socketio-architecture)
8. [Website Content Management](#website-content-management)
9. [Fee Management](#fee-management)
10. [Notification System](#notification-system)
11. [Audit Logging](#audit-logging)
12. [File Uploads](#file-uploads)
13. [Database Migrations](#database-migrations)
14. [Backup Process](#backup-process)
15. [Deployment](#deployment)
16. [Development Setup](#development-setup)

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | — | JWT signing secret (minimum 32 chars) |
| `PORT` | ❌ | `4000` | API server port |
| `NODE_ENV` | ❌ | `development` | `development`, `production`, `test` |
| `CORS_ORIGIN` | ❌ | `http://localhost:3000` | Comma-separated allowed origins |
| `UPLOAD_DIR` | ❌ | `uploads` | File upload directory |
| `JWT_EXPIRES_IN` | ❌ | `7d` | JWT token expiry duration |
| `SMTP_HOST` | ❌ | — | SMTP server hostname |
| `SMTP_PORT` | ❌ | `587` | SMTP server port |
| `SMTP_USER` | ❌ | — | SMTP username |
| `SMTP_PASS` | ❌ | — | SMTP password |
| `MAIL_FROM` | ❌ | `no-reply@dwaraka.local` | From address for emails |

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | ❌ | `http://localhost:4000/api` | Backend API base URL |
| `NEXT_PUBLIC_SOCKET_URL` | ❌ | `http://localhost:4000` | Socket.IO server URL |
| `NEXT_PUBLIC_SITE_URL` | ❌ | `http://localhost:3000` | Public site URL for SEO |

---

## Directory Structure

```
dwaraka-academy/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & environment config
│   │   ├── controllers/     # Route handlers (business logic)
│   │   ├── middleware/       # Auth, upload, error handling
│   │   ├── models/          # Sequelize models
│   │   ├── routes/          # Express route definitions
│   │   ├── scripts/         # Migration & seed scripts
│   │   ├── sockets/         # Socket.IO configuration
│   │   ├── utils/           # Password, mailer, helpers
│   │   └── server.js        # Application entry point
│   ├── scripts/             # Backup & maintenance scripts
│   └── uploads/             # Uploaded files directory
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js pages (App Router)
│   │   ├── components/      # Shared UI components
│   │   ├── context/         # React contexts (Auth)
│   │   └── lib/             # API client, Socket.IO client
│   └── public/              # Static assets
└── DOCUMENTATION.md         # This file
```

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | All users (admin, teacher, student, parent) |
| `subjects` | Academic subjects |
| `batches` | Class batches with teacher assignment |
| `enrollments` | Student-batch enrollment |
| `attendance` | Daily attendance records |
| `marks` | Exam marks and scores |
| `classes` | Scheduled class sessions |
| `notes` | Study notes uploads |

### Management Tables

| Table | Purpose |
|-------|---------|
| `fees` | Fee structures and payment tracking |
| `notifications` | Notification content and metadata |
| `notification_receipts` | Per-user delivery and read tracking |
| `audit_logs` | Immutable audit trail of all actions |
| `site_content` | Editable website content |

### User Management Tables

| Table | Purpose |
|-------|---------|
| `parent_requests` | Student requests to link parent |
| `parent_links` | Parent-student relationship mapping |

### Content Tables

| Table | Purpose |
|-------|---------|
| `announcements` | Dashboard announcements |
| `assignments` | Teacher-created assignments |
| `assignment_submissions` | Student submissions |
| `enquiries` | Contact form submissions |
| `site_content` | Dynamic website content |

### Full Schema Details

See `backend/src/models/` for complete field definitions.

---

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Login with email/password |
| GET | `/api/auth/me` | JWT | Get current user profile |
| POST | `/api/auth/change-password` | JWT | Change password |
| POST | `/api/auth/forgot-password` | Public | Request password reset |

### User Management (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/users` | List/create users |
| PATCH/DELETE | `/api/users/:id` | Update/delete user |
| POST | `/api/users/:id/reset-password` | Reset user password |

### Students (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/students` | List/create students |
| GET/PATCH/DELETE | `/api/students/:id` | Get/update/delete student |

### Teachers (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/teachers` | List/create teachers |
| GET/PATCH/DELETE | `/api/teachers/:id` | Get/update/delete teacher |

### Batches

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/batches` | JWT | List batches |
| GET | `/api/batches/my` | Teacher/Admin | My assigned batches |
| POST | `/api/batches` | Admin | Create batch |
| PATCH/DELETE | `/api/batches/:id` | Admin | Update/delete batch |
| GET | `/api/batches/:id/students` | Teacher/Admin | Batch students |

### Attendance

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/attendance/batches` | Teacher/Admin | List batches for attendance |
| GET | `/api/attendance/batches/:batchId/students` | Teacher/Admin | Students in batch |
| GET | `/api/attendance/:batchId/date` | Teacher/Admin | Attendance by date |
| POST | `/api/attendance/bulk` | Teacher/Admin | Mark bulk attendance |
| GET | `/api/attendance/:batchId/summary` | Teacher/Admin | Attendance summary |
| GET | `/api/attendance/:batchId/export` | Teacher/Admin | Export CSV |
| GET | `/api/attendance/me` | Student | My attendance |

### Marks

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET/POST | `/api/marks` | Teacher/Admin | List/create marks |
| GET | `/api/marks/stats` | Teacher/Admin | Marks statistics |
| GET | `/api/marks/report-card` | Teacher/Admin | Generate report cards |
| GET | `/api/marks/export` | Teacher/Admin | Export CSV |
| GET/PATCH/DELETE | `/api/marks/:id` | Teacher/Admin | Get/update/delete marks |
| POST | `/api/marks/bulk` | Teacher/Admin | Bulk create marks |
| GET | `/api/marks/me` | Student | My marks |

### Fee Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/fees` | Admin/Teacher | List fees (paginated, filterable) |
| GET | `/api/fees/stats` | Admin/Teacher | Fee statistics |
| GET | `/api/fees/export` | Admin | Export CSV |
| GET | `/api/fees/:id` | Admin/Teacher | Get fee detail |
| POST | `/api/fees` | Admin | Create fee |
| POST | `/api/fees/bulk` | Admin | Bulk create fees |
| PATCH | `/api/fees/:id` | Admin | Update fee |
| POST | `/api/fees/:id/pay` | Admin | Record payment |
| DELETE | `/api/fees/:id` | Admin | Delete fee |
| GET | `/api/my/fees` | Student | My fees |

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/notifications/send` | Admin | Send notification |
| GET | `/api/notifications` | Admin | List sent notifications |
| DELETE | `/api/notifications/:id` | Admin | Delete notification |
| GET | `/api/notifications/inbox` | JWT | User inbox |
| GET | `/api/notifications/unread` | JWT | Unread count |
| POST | `/api/notifications/mark-read/:id` | JWT | Mark as read |
| POST | `/api/notifications/mark-all-read` | JWT | Mark all as read |

### Audit Logs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/audit-logs` | Admin | List audit logs (paginated) |
| GET | `/api/audit-logs/stats` | Admin | Audit statistics |

### Content Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/content` | Admin | List all content |
| GET | `/api/content/:id` | Admin | Get content by ID |
| GET | `/api/content/section/:section` | Public | Get section content |
| POST | `/api/content` | Admin | Create content |
| PATCH | `/api/content/:id` | Admin | Update content |
| DELETE | `/api/content/:id` | Admin | Delete content |
| PATCH | `/api/content/:id/toggle` | Admin | Toggle active status |
| POST | `/api/content/bulk` | Admin | Bulk save content |

### Uploads

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/uploads` | Admin | List uploaded files |
| GET | `/api/uploads/:filename` | Admin | Get file info |
| DELETE | `/api/uploads/:filename` | Admin | Delete file |

### Additional

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/analytics/dashboard` | JWT | Role-based dashboard data |
| GET/POST | `/api/announcements` | JWT | List/create announcements |
| GET/POST | `/api/enquiries` | Public/Admin | Submit/list enquiries |
| GET/POST | `/api/assignments` | JWT | List/create assignments |
| POST | `/api/notes` | Teacher/Admin | Upload notes |
| GET | `/api/batches` | JWT | List batches |
| GET | `/api/subjects` | JWT | List subjects |

---

## Authentication

### Flow

1. User sends `POST /api/auth/login` with `{ email, password }`
2. Server validates credentials using bcrypt
3. Returns JWT token + user object
4. Client stores token in `localStorage` as `token`
5. All subsequent requests include `Authorization: Bearer <token>`
6. Token is verified on every protected route

### Token Payload

```json
{
  "sub": "user-uuid",
  "role": "admin|teacher|student|parent",
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## Role-Based Access

| Role | Access |
|------|--------|
| **Admin** | Full system access — all modules, user management, content management, analytics, audit logs |
| **Teacher** | Assignments, attendance, marks, notes, class batches, announcements |
| **Student** | Personal attendance, marks, assignments, fee status, parent requests |
| **Parent** | Linked student's attendance, marks, fees, announcements |

---

## Socket.IO Architecture

### Connection Flow

1. Client connects with `{ auth: { token } }`
2. Server verifies JWT token
3. Client joins rooms:
   - `user:{userId}` — Personal room
   - `role:{role}` — Role-based room (e.g. `role:student`)
   - `notifications:{role}s` — Notification target room (e.g. `notifications:students`)
   - `notifications:all` — Global notification room
   - `analytics:admin` — Analytics room (admin only)
   - `batch:{batchId}` — Batch-specific rooms (students/teachers)

### Notification Delivery

Notifications are sent via `io.to('notifications:{audience}').emit('notification', data)`.

Audience mapping:
- `all` → room `notifications:all`
- `students` → room `notifications:students`
- `teachers` → room `notifications:teachers`
- `parents` → room `notifications:parents`
- `specific` → individual user rooms

### Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `notification` | Server → Client | `{ id, title, body, type, priority, created_at }` |
| `notifications:new` | Server → Client | `{ id, title, type, audience }` (unread badge) |
| `analytics:refresh` | Server → Client | (no payload — triggers reload) |
| `notification:ack` | Client → Server | `{ notification_id }` |
| `room:join` | Client → Server | Room name string |
| `room:leave` | Client → Server | Room name string |

---

## Website Content Management

The entire public website is powered by the `site_content` table. Each row stores:
- `section` — Section identifier (e.g. `hero`, `about`, `courses`)
- `key` — Unique key within the section
- `data` — JSONB content
- `is_active` — Toggle visibility
- `sort_order` — Drag-and-drop ordering

### Sections

| Section | Key | Content |
|---------|-----|---------|
| `hero` | `main` | Title, subtitle, tags, highlights, stats |
| `about` | `main` | Description, director message, timeline |
| `why-us` | (sorted) | Feature cards with icons |
| `courses` | (sorted) | Course details with subjects, eligibility |
| `faculty` | (sorted) | Faculty profiles |
| `student-results` | (sorted) | Student achievements |
| `testimonials` | (sorted) | Parent/student reviews |
| `gallery` | (sorted) | Gallery images with captions |
| `downloads` | (sorted) | Downloadable resources |
| `contact` | `main` | Address, phone, email, maps |
| `footer` | `main` | Footer content |
| `settings` | `general` | Academy name, tagline, year |

### Content API

```
GET /api/content/section/:section  (public — no auth)
GET /api/content                   (admin — all content)
POST /api/content                  (admin — create)
PATCH /api/content/:id             (admin — update)
DELETE /api/content/:id            (admin — delete)
```

---

## Fee Management

### Fee Status

- `pending` — No payment recorded
- `partial` — Partially paid
- `paid` — Fully paid
- `waived` — Fee waived

### Payment Modes

- `cash`, `card`, `online`, `bank_transfer`, `cheque`

### Invoice Numbers

Auto-generated format: `DAF{timestamp_base36}{random_4_chars}`

### Stats Endpoint

`GET /api/fees/stats` returns:
- Summary (total_collected, total_pending, collection_rate)
- Status breakdown (paid/partial/pending/waived counts)
- Today's collection
- Monthly collection data

---

## Notification System

### Types

`information`, `warning`, `success`, `exam`, `fee_reminder`, `holiday`, `assignment`, `event`

### Priorities

`low`, `normal`, `high`, `urgent`

### Audiences

`all`, `students`, `teachers`, `parents`, `specific` (target_user_ids)

### Delivery

1. Notification created in `notifications` table
2. Receipts created for each target user in `notification_receipts`
3. Socket.IO event emitted for real-time delivery
4. Unread count updated via `notifications:new` event

---

## Audit Logging

Every important action is logged to `audit_logs` table:

| Field | Description |
|-------|-------------|
| `user_id` | Actor UUID |
| `user_name` | Actor name (denormalized for speed) |
| `user_role` | Actor role |
| `action` | See action types below |
| `resource` | Affected entity type (e.g. 'fee', 'user') |
| `resource_id` | Affected entity ID |
| `description` | Human-readable summary |
| `metadata` | JSONB with additional context |
| `ip_address` | Request IP |
| `user_agent` | Browser user agent |

### Action Types

`login`, `logout`, `create`, `update`, `delete`, `fee_payment`, `attendance_marked`, `notification_sent`, `password_change`, `settings_change`, `marks_entered`, `assignment_created`, `submission_graded`, `upload`, `enrollment`, `export`

### Viewing Logs

Admin dashboard → Audit Logs page or `GET /api/audit-logs`

---

## File Uploads

### Configuration

- Upload directory: `backend/uploads/`
- Max file size: 25 MB
- Allowed types: images, PDF, Word, Excel, text

### Storage

Files are stored with unique filenames: `{timestamp}-{random}{extension}`

### Management

Admin can view, preview (images), download, and delete files from the Uploads page in the admin dashboard.

---

## Database Migrations

### Purpose

Replace `sequelize.sync({ alter: true })` with controlled sequential migrations.

### Running Migrations

```bash
cd backend
npm run db:migrate
# or: node src/scripts/migrate.js
```

### Migration Format

Each migration in `src/scripts/migrate.js` is an object:
```js
{
  name: '001_create_audit_logs',
  up: async (sequelize) => { /* SQL queries */ },
}
```

### Tracking

Applied migrations are tracked in the `_migrations` table.

### Current Migrations

1. `001_create_audit_logs` — Creates audit_logs table with indexes
2. `002_add_missing_indexes` — Adds performance indexes to all tables
3. `003_add_created_by_to_tables` — Adds creator/updater columns to attendance and marks
4. `004_add_assignment_fields` — Adds score/description fields to assignments
5. `005_add_teachers_subjects` — Creates teacher_subjects junction table

---

## Backup Process

### Script

Located at `backend/scripts/backup.sh`

### Usage

```bash
# Run backup with defaults
cd backend
bash scripts/backup.sh

# Dry run (preview only)
DRY_RUN=true bash scripts/backup.sh

# Custom backup directory
BACKUP_DIR=/path/to/backups bash scripts/backup.sh

# Custom retention (days)
BACKUP_RETENTION=60 bash scripts/backup.sh

# With S3 upload
S3_BUCKET=s3://my-backups bash scripts/backup.sh
```

### What It Does

1. Dumps PostgreSQL database using `pg_dump`
2. Compresses with gzip
3. Verifies gzip integrity
4. Generates SHA256 checksum
5. Validates SQL structure
6. Cleans up backups older than retention period
7. Optionally uploads to S3

### Restore

```bash
gunzip -c dwaraka_academy_20250101_000000.sql.gz | psql DATABASE_URL
```

---

## Deployment

### Render Deployment

The application is configured for Render's Node.js runtime.

**Backend:**
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/health`

**Frontend:**
- Build command: `npm run build`
- Publish directory: `.next`
- Environment: Next.js with standalone output

### Required Environment Variables

See [Environment Variables](#environment-variables) above.

Ensure the following are set on Render:
- `DATABASE_URL` — Render PostgreSQL connection string
- `JWT_SECRET` — Strong random string
- `NODE_ENV` — `production`
- `CORS_ORIGIN` — Your frontend domain
- `NEXT_PUBLIC_API_URL` — Your backend domain + `/api`

---

## Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL
- npm

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run dev
```

### Frontend Setup

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

The backend runs on `http://localhost:4000` and frontend on `http://localhost:3000`.

---

## Production Readiness Checklist

- [ ] JWT_SECRET is set to a strong random string (production)
- [ ] CORS_ORIGIN is set to the production frontend URL
- [ ] SMTP credentials configured for email delivery
- [ ] Database migrations run on deploy
- [ ] Regular backups configured via cron
- [ ] Audit logging enabled
- [ ] Rate limiting active
- [ ] Helmet security headers active
- [ ] SSL/TLS enabled (Render provides this automatically)
- [ ] Error logging configured (morgan for HTTP, console.error for application)
