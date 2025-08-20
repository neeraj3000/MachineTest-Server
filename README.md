## MachineTest-Server

A minimal Node.js/Express REST API with MongoDB and JWT authentication. It supports two roles: ADMIN and AGENT. Admins can manage agents and upload CSV/Excel files to distribute tasks among agents; agents can view their assigned tasks.

### Tech stack
- **Runtime**: Node.js + Express
- **Database**: MongoDB (via Mongoose)
- **Auth**: JWT (Bearer tokens)
- **Upload/Parsing**: Multer, csv-parse, xlsx

### Quick start
1) Install dependencies
```bash
npm install
```

2) Create an environment file at `server/.env`
```env
# MongoDB connection
MONGO_URI=mongodb://localhost:27017/machinetest

# JWT secret for signing tokens
JWT_SECRET=replace-with-a-long-random-string

# CORS: allowed frontend origin
CORS_ORIGIN=http://localhost:5173

# Optional: initial admin for seeding
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_MOBILE=+10000000000
ADMIN_PASSWORD=Admin@123

# Optional: uploads directory (defaults to server/uploads)
UPLOAD_DIR=
```

3) Seed an initial admin user
```bash
npm run seed
```

4) Run the server
```bash
# Development (with restart on changes)
npm run dev

# or Production
npm start
```

The API listens on `http://localhost:4000` by default. Health check: `GET /api/health`.

### Authentication
- Login to receive a JWT:
  - `POST /api/auth/login` with JSON body `{ "email": string, "password": string }`
- Send the token as `Authorization: Bearer <token>` for protected endpoints.
- Get current user: `GET /api/auth/me`.

### Core endpoints (overview)
- **Agents (ADMIN only)**
  - `GET /api/agents` — list agents
  - `POST /api/agents` — create agent
  - `PUT /api/agents/:id` — update agent
  - `DELETE /api/agents/:id` — delete agent and their tasks

- **Tasks**
  - `GET /api/tasks/me` — agent: own tasks; admin: all tasks
  - `GET /api/tasks/by-agent/:agentId` — admin: tasks for a specific agent

- **Upload (ADMIN only)**
  - `POST /api/upload` — multipart/form-data with field `file` containing a `.csv`, `.xlsx`, or `.xls`
  - Expected columns (case-insensitive): `FirstName`, `Phone`, optional `Notes`
  - Rows missing `FirstName` or `Phone` are ignored
  - Tasks are distributed round-robin to up to 5 agents

### Project structure (high-level)
- `src/server.js` — Express app entry, middleware, routes, error handler
- `src/middleware/auth.js` — JWT auth and role-based authorization
- `src/models/User.js` — User schema with password hashing and roles
- `src/models/Task.js` — Task schema assigned to an agent
- `src/routes/*.routes.js` — Route modules (auth, agents, upload, tasks)
- `src/utils/db.js` — MongoDB connection helper
- `src/utils/uploadParser.js` — CSV/Excel parsing helpers
- `scripts/seedAdmin.js` — Seed an initial admin from env

### Notes
- Default port is `4000` (override via `PORT` in `server/.env`).
- Default CORS origin is `http://localhost:5173`.
- Uploads are saved temporarily to `server/uploads` and deleted after processing.


