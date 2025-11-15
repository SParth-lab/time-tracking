# Time Tracking & Salary Reporting System - Frontend

A modern React frontend for the time tracking and salary reporting system.

## Features

- **User Authentication**: Login, register, password reset, master password login
- **Job Management**: Create, edit, view jobs with rate history
- **Time Tracking**: Add, edit, delete time entries with validation
- **Salary Reports**: Generate detailed salary reports with CSV export
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- **Real-time Updates**: Toast notifications for user feedback

## Tech Stack

- React 18
- React Router v6
- Vite (build tool)
- Tailwind CSS
- Axios
- React Toastify
- date-fns
- Recharts (for future charts)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your backend API URL:
```
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Build for Production

```bash
npm run build
```

The production build will be in the `dist` folder.

## Project Structure

```
src/
├── components/       # Reusable components
│   ├── Layout.jsx
│   └── PrivateRoute.jsx
├── context/         # React context (Auth)
│   └── AuthContext.jsx
├── pages/           # Page components
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── ForgotPassword.jsx
│   ├── Dashboard.jsx
│   ├── Jobs.jsx
│   ├── JobForm.jsx
│   ├── JobDetail.jsx
│   ├── TimeEntries.jsx
│   ├── TimeEntryForm.jsx
│   └── Reports.jsx
├── services/        # API services
│   └── api.js
├── App.jsx          # Main app component
├── main.jsx         # Entry point
└── index.css        # Global styles
```

## Features Overview

### Dashboard
- Overview statistics (total jobs, active jobs, total hours, monthly salary)
- Quick actions (create job, add time entry, view reports)
- Recent time entries list

### Jobs
- List all jobs with filtering (all/active/inactive)
- Create new jobs with initial hourly rate
- Edit job details
- View job details with rate history
- Add rate changes with effective date/time
- Activate/deactivate jobs
- Delete jobs (only if no time entries exist)

### Time Entries
- List all time entries with pagination
- Filter by job, date range
- Add new time entries
- Edit existing time entries
- Delete time entries
- Automatic duration calculation

### Reports
- Generate salary reports for custom date ranges or monthly
- Filter by specific job or all jobs
- View job-wise breakdown with detailed entries
- See rate changes within time entries
- Export reports to CSV
- Expandable job sections for detailed view

## API Integration

The frontend communicates with the backend API using Axios. All API calls are centralized in `src/services/api.js`.

Authentication is handled via JWT tokens stored in localStorage. The API service automatically:
- Adds the token to all requests
- Redirects to login on 401 errors
- Handles response errors

## Styling

The app uses Tailwind CSS with custom utility classes defined in `src/index.css`:
- `.btn` - Base button styles
- `.btn-primary` - Primary button (blue)
- `.btn-secondary` - Secondary button (gray)
- `.btn-danger` - Danger button (red)
- `.input` - Form input styles
- `.card` - Card container styles
- `.label` - Form label styles

## License

MIT

