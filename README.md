# NTG Login - GoLogin Clone Backend

A complete backend API for browser profile management, similar to GoLogin, built with Node.js, TypeScript, Express, and Prisma.

## 🚀 Features

- ✅ **6 Core Models**: Profile, Proxy, Session, Job, Log, User
- ✅ **RESTful API**: Full CRUD operations for all models
- ✅ **JWT Authentication**: Secure admin authentication
- ✅ **TypeScript**: Type-safe code with full TypeScript support
- ✅ **Prisma ORM**: Modern database toolkit with migrations
- ✅ **Docker Support**: Easy setup with Docker Compose
- ✅ **Error Handling**: Global error handler with custom errors
- ✅ **Service Layer Pattern**: Clean architecture with separation of concerns

## 📋 Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) OR **Docker** + **Docker Compose**
- **Git**

### Windows Specific Setup

If you're on Windows and encounter PowerShell script execution errors:

```powershell
# Run PowerShell as Administrator and execute:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 🛠️ Installation & Setup

### Option 1: Using Docker (Recommended)

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd ntglogin
```

2. **Install dependencies**
```bash
npm install
```

3. **Start Docker services** (PostgreSQL + Redis + pgAdmin)
```bash
docker-compose up -d
```

4. **Verify Docker services are running**
```bash
docker-compose ps
```

You should see:
- `ntglogin_postgres` - PostgreSQL on port 5432
- `ntglogin_redis` - Redis on port 6379
- `ntglogin_pgadmin` - pgAdmin on port 5050

5. **Environment variables are already set in `.env`**
```env
DATABASE_URL="postgresql://postgres:1593579@localhost:5432/ntglogin_db"
REDIS_URL="redis://localhost:6379"
PORT=3000
NODE_ENV=development
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

⚠️ **Important**: Change `JWT_SECRET` in production!

6. **Generate Prisma Client**
```bash
npm run prisma:generate
```

7. **Run database migrations**
```bash
npm run prisma:migrate
```

8. **Seed the database with sample data**
```bash
npm run seed
```

This creates:
- Admin user: `admin` / `admin123`
- 2 sample profiles
- 2 sample proxies
- 2 sample sessions
- 2 sample jobs
- 3 sample logs

9. **Start the development server**
```bash
npm run dev
```

Server will start on: **http://localhost:3000**

### Option 2: Using Local PostgreSQL

If you prefer to use a local PostgreSQL installation instead of Docker:

1. **Install PostgreSQL** from [postgresql.org](https://www.postgresql.org/download/)

2. **Create database**
```bash
# Open PostgreSQL command line (psql)
psql -U postgres

# Create database
CREATE DATABASE ntglogin_db;

# Exit psql
\q
```

3. **Update `.env` if needed** (default should work):
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ntglogin_db"
```

4. **Follow steps 2, 6-9 from Option 1 above**

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication

All endpoints except `/auth/*` require JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### 🔐 Authentication
```
POST /api/auth/register  - Register new admin user
POST /api/auth/login     - Login and get JWT token
```

**Login Example:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
}
```

#### 👤 Profiles
```
GET    /api/profiles      - Get all profiles
GET    /api/profiles/:id  - Get profile by ID
POST   /api/profiles      - Create new profile
PUT    /api/profiles/:id  - Update profile
DELETE /api/profiles/:id  - Delete profile
```

**Create Profile Example:**
```bash
curl -X POST http://localhost:3000/api/profiles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Profile",
    "user_agent": "Mozilla/5.0...",
    "fingerprint": {"canvas": "abc123"}
  }'
```

#### 🌐 Proxies
```
GET    /api/proxies      - Get all proxies
GET    /api/proxies/:id  - Get proxy by ID
POST   /api/proxies      - Create new proxy
PUT    /api/proxies/:id  - Update proxy
DELETE /api/proxies/:id  - Delete proxy
```

**Create Proxy Example:**
```bash
curl -X POST http://localhost:3000/api/proxies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "192.168.1.100",
    "port": 8080,
    "type": "http",
    "username": "user",
    "password": "pass"
  }'
```

#### 🔄 Sessions
```
GET    /api/sessions      - Get all sessions
GET    /api/sessions/:id  - Get session by ID
POST   /api/sessions      - Create new session
PUT    /api/sessions/:id  - Update session status
DELETE /api/sessions/:id  - Delete session
```

**Create Session Example:**
```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profile_id": 1,
    "proxy_id": 1,
    "status": "running"
  }'
```

#### ⚙️ Jobs
```
GET    /api/jobs          - Get all jobs (filter by ?status=queued)
GET    /api/jobs/:id      - Get job by ID
POST   /api/jobs          - Create new job
PUT    /api/jobs/:id      - Update job
DELETE /api/jobs/:id      - Delete job
```

#### 📝 Logs
```
GET  /api/logs  - Get all logs (filter by ?level=error)
POST /api/logs  - Create new log entry
```

#### ❤️ Health Check
```
GET /api/health  - Server health check
```

## 🗄️ Database Management

### Prisma Studio (Database GUI)
```bash
npm run prisma:studio
```
Opens at: **http://localhost:5555**

### pgAdmin (via Docker)
Access at: **http://localhost:5050**
- Email: `admin@admin.com`
- Password: `admin`

**To connect to PostgreSQL in pgAdmin:**
1. Add new server
2. Host: `postgres` (or `host.docker.internal` on Windows)
3. Port: `5432`
4. Username: `postgres`
5. Password: `1593579`
6. Database: `ntglogin_db`

### Common Prisma Commands
```bash
# Generate Prisma Client
npm run prisma:generate

# Create and apply migration
npm run prisma:migrate

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# View current database
npm run prisma:studio
```

## 📁 Project Structure

```
ntglogin/
├── src/
│   ├── controllers/      # Request handlers
│   │   ├── authController.ts
│   │   ├── profileController.ts
│   │   ├── proxyController.ts
│   │   ├── sessionController.ts
│   │   ├── jobController.ts
│   │   └── logController.ts
│   ├── services/         # Business logic
│   │   ├── userService.ts
│   │   ├── profileService.ts
│   │   ├── proxyService.ts
│   │   ├── sessionService.ts
│   │   ├── jobService.ts
│   │   └── logService.ts
│   ├── routes/           # API routes
│   │   ├── authRoutes.ts
│   │   ├── profileRoutes.ts
│   │   ├── proxyRoutes.ts
│   │   ├── sessionRoutes.ts
│   │   ├── jobRoutes.ts
│   │   ├── logRoutes.ts
│   │   └── index.ts
│   ├── middleware/       # Custom middleware
│   │   └── auth.ts
│   ├── utils/            # Utility functions
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   ├── prismaClient.ts   # Prisma singleton
│   └── index.ts          # App entry point
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── seed.ts           # Seed script
│   └── migrations/       # Migration files
├── generated/            # Generated Prisma Client
├── docker-compose.yml    # Docker services
├── .env                  # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🧪 Testing API with curl

After starting the server, test the endpoints:

```bash
# 1. Login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Copy the token from response

# 2. Get all profiles
curl http://localhost:3000/api/profiles \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Create a profile
curl -X POST http://localhost:3000/api/profiles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Profile","user_agent":"Mozilla/5.0..."}'

# 4. Get all sessions
curl http://localhost:3000/api/sessions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔧 Development

### Available Scripts

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format

# Database commands
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
npm run prisma:generate  # Generate Prisma Client
npm run seed             # Seed database
```

### n8n Integration (Local)

1) Run n8n service:

```bash
docker compose up -d n8n
```

Open `http://localhost:5678` (login with `N8N_USER`/`N8N_PASS`).

2) In n8n, create the webhook or workflow you want (e.g., Telegram → Send Message).

3) In the Workflow editor (Admin Web): drag "n8n Execute Workflow" or "n8n Call Webhook", fill Workflow ID or Webhook path, and map payload.

4) Bulk run profiles; watch Executions for logs/results.

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Remove all containers and volumes
docker-compose down -v
```

## ⚠️ Security Notes

1. **Change JWT_SECRET in production!**
   ```env
   JWT_SECRET="generate-a-strong-random-secret-here"
   ```

2. **Never commit `.env` file** (already in .gitignore)

3. **Change default passwords** for:
   - Admin user (default: `admin` / `admin123`)
   - PostgreSQL (default: `postgres` / `1593579`)
   - pgAdmin (default: `admin@admin.com` / `admin`)

4. **Use HTTPS in production**

## 📝 Environment Variables Reference

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Redis (optional, for future use)
REDIS_URL="redis://localhost:6379"

# Server
PORT=3000
NODE_ENV=development  # or 'production'

# JWT
JWT_SECRET="your-secret-key-change-in-production"
```

## 🚀 Deployment

### Build for production:
```bash
npm run build
```

### Start production server:
```bash
NODE_ENV=production npm start
```

### Environment setup for production:
1. Set `NODE_ENV=production`
2. Update `DATABASE_URL` to production database
3. Generate strong `JWT_SECRET`
4. Use process manager like PM2 or Docker

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

ISC

## 👨‍💻 Author

Your Name

## 📞 Support

For issues and questions, please create an issue on GitHub.

---

**Happy Coding! 🎉**

