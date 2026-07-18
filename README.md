# DWARAKA ACADEMY — Tuition Management System

Full-stack Node/Next.js app. **Runs locally only** (Express + Socket.IO + Postgres cannot run in this Lovable sandbox).

## Stack
- **Frontend:** Next.js 15 (App Router, TS, Tailwind), React 19, socket.io-client, axios
- **Backend:** Node 20+, Express 4, Sequelize 6, PostgreSQL, Socket.IO 4, Multer, JWT, bcrypt, Nodemailer
- **DB:** PostgreSQL 14+

## Prerequisites
- Node.js **>= 20**
- PostgreSQL **>= 14** running locally
- npm **>= 10**

## 1. Database

```sql
CREATE DATABASE dwaraka_academy;
CREATE USER dwaraka WITH ENCRYPTED PASSWORD 'dwaraka';
GRANT ALL PRIVILEGES ON DATABASE dwaraka_academy TO dwaraka;
```

## 2. Backend

```bash
cd backend
cp .env.example .env      # edit DATABASE_URL, JWT_SECRET, SMTP_* if you want email
npm install
npm run db:migrate        # sync Sequelize models
npm run db:seed           # creates 1 admin + 4 teachers (see seeders/initial.js)
npm run dev               # http://localhost:4000
```

Default admin (change immediately after first login):
- email: `admin@dwaraka.local`
- password: `Admin@12345`

The 4 teacher accounts and their temporary passwords are printed to the console during seed.

## 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev               # http://localhost:3000
```

## 4. Features
- JWT auth, role-based access (admin / teacher / student)
- Forced password change on first login
- Admin creates teachers & students (no public signup)
- Subjects, Classes/Batches
- Attendance (mark + view)
- Marks entry & report
- Notes upload (Multer) + download
- Announcements with realtime push (Socket.IO)
- Audit-friendly timestamps on every table

## 5. Production build
```bash
cd backend && npm run start        # node src/server.js
cd frontend && npm run build && npm run start
```

## 6. Project layout
```
backend/
  src/
    config/    - db, env
    models/    - Sequelize models
    middleware/- auth, role, error, upload
    routes/    - Express routers
    controllers/
    sockets/   - Socket.IO handlers
    seeders/   - initial admin + teachers
    server.js
  uploads/     - Multer storage (gitignored)
frontend/
  src/
    app/       - Next 15 App Router pages
    components/
    context/   - AuthContext
    lib/       - api client, socket client
```
