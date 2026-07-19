# Dwaraka Academy — Dev Server Setup

## Prerequisites

- Node.js (v20+)
- PostgreSQL running on `localhost:5432`
- Database `dwaraka_academy` must exist

## Setup

### 1. Backend environment

Copy `.env` from the main checkout:
```bash
cp "D:/dwaraka-academy/backend/.env" backend/.env
```

### 2. Install dependencies

```bash
cd backend && npm install
cd frontend && npm install
```

### 3. Database migration

```bash
cd backend && node src/scripts/migrate.js
```

## Running the servers

### Backend (Express API on port 4000)

The system `PORT` env var may be set to another value. Override it explicitly:

```bash
cd backend
PORT=4000 nohup node src/server.js > ../backend.log 2>&1 &
```

Verify: `curl http://localhost:4000/health` → `{"ok":true}`

### Frontend (Next.js on port 3000)

```bash
cd frontend
PORT=3000 nohup npx next dev > ../frontend.log 2>&1 &
```

Verify: `curl http://localhost:3000/login` → HTTP 200

## Default credentials

- **Admin**: `admin@dwaraka.local` / `Admin@12345`
- **Teachers**: `teacher1@dwaraka.local` through `teacher4@dwaraka.local` (temporary passwords from seed)
