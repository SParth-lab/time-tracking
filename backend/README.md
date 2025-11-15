# Time Tracking & Salary Reporting System - Backend

A comprehensive backend API for time tracking and salary reporting with support for hourly rate changes.

## Features

- **User Management**: Register, login, password reset, JWT authentication, master password login
- **Job Management**: Create/edit jobs, maintain hourly rate history
- **Time Tracking**: Track time entries with validation
- **Salary Reports**: Calculate salaries with mid-period rate changes, export to CSV
- **Security**: JWT auth, bcrypt password hashing, rate limiting, helmet

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT for authentication
- bcrypt for password hashing
- Winston for logging

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/timetracking
JWT_SECRET=your_secret_key
MASTER_PASSWORD=your_master_password
FRONTEND_URL=http://localhost:3000
```

4. Start MongoDB (if running locally):
```bash
mongod
```

5. Run the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/master-login` - Login with master password
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password/:token` - Reset password
- `PUT /api/auth/update-password` - Update password

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create new job
- `GET /api/jobs/:id` - Get single job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `POST /api/jobs/:id/rate-change` - Add rate change
- `GET /api/jobs/:id/rate-history` - Get rate history

### Time Entries
- `GET /api/time-entries` - Get all time entries
- `POST /api/time-entries` - Create time entry
- `GET /api/time-entries/:id` - Get single time entry
- `PUT /api/time-entries/:id` - Update time entry
- `DELETE /api/time-entries/:id` - Delete time entry
- `GET /api/time-entries/summary/stats` - Get time summary

### Reports
- `GET /api/reports/salary` - Get salary report (requires startDate, endDate)
- `GET /api/reports/salary/monthly` - Get monthly salary report (requires year, month)
- `GET /api/reports/salary/export` - Export salary report as CSV
- `GET /api/reports/job-summary` - Get job-wise salary summary

## Data Models

### User
- firstName, lastName, mobile, email, passwordHash, role

### Job
- title, companyName, companyOwnerName, contactNumber, createdBy, active

### RateChange
- jobId, hourlyRate (in cents), effectiveAt, changedBy
- Immutable once created

### TimeEntry
- userId, jobId, startAt, endAt, notes, cachedMinutes

## Salary Calculation

The system correctly handles mid-period hourly rate changes:

1. For each time entry, find all applicable rate changes
2. Split the time entry into segments based on rate change dates
3. Calculate pay for each segment: `duration_hours × hourly_rate`
4. Sum all segments to get total pay

Example:
- Time entry: 9 AM - 5 PM (8 hours)
- Rate changes: $20/hr until 1 PM, then $25/hr
- Calculation:
  - 9 AM - 1 PM: 4 hours × $20 = $80
  - 1 PM - 5 PM: 4 hours × $25 = $100
  - Total: $180

## Currency Storage

All monetary values are stored as **integers in cents** to avoid floating-point rounding errors:
- $20.00 is stored as 2000
- $25.50 is stored as 2550

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Master password for admin access
- Rate limiting (100 requests per 15 minutes)
- Helmet for security headers
- Input validation
- Error handling

## Logging

Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

## Testing

```bash
npm test
```

## License

MIT

