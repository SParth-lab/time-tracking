# Time Tracking & Salary Reporting System

A full-stack web application for tracking work hours, managing jobs, and generating salary reports. Built with React, Node.js, Express, and MongoDB.

## 📋 Features

- **User Authentication**: Secure registration, login, and password recovery
- **Job Management**: Create, update, and track multiple jobs/clients
- **Time Entry Tracking**: Log work hours with start/end times and notes
- **Salary Calculation**: Automatic calculation based on time entries and hourly rates
- **Rate Changes**: Track salary rate changes over time
- **Reports & Analytics**: Visual dashboards with charts and detailed reports
- **Responsive Design**: Modern UI built with Material-UI and Tailwind CSS
- **Real-time Updates**: Optimized data fetching with React Query

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Material-UI (MUI)** - Component library
- **Tailwind CSS** - Utility-first CSS
- **React Router** - Navigation
- **React Query** - Server state management
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **Moment.js** - Date manipulation

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Winston** - Logging
- **Helmet** - Security headers
- **Express Rate Limit** - API rate limiting

## 📁 Project Structure

```
new1/
├── backend/
│   ├── config/          # Database and logger configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth and error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── tests/           # Jest tests
│   ├── utils/           # Helper functions
│   └── server.js        # Entry point
├── frontend/
│   ├── public/          # Static files
│   └── src/
│       ├── components/  # Reusable components
│       ├── context/     # React context providers
│       ├── hooks/       # Custom hooks
│       ├── pages/       # Page components
│       ├── services/    # API services
│       ├── theme/       # MUI theme configuration
│       └── utils/       # Utility functions
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd new1
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Create Backend Environment Variables**
   
   Create a `.env` file in the `backend` directory:
   ```env
   # Server
   NODE_ENV=development
   PORT=5000
   
   # Database
   MONGO_URI=mongodb://localhost:27017/timetracking
   
   # JWT
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRE=7d
   
   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   
   # Email (optional - for password recovery)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_email_password
   EMAIL_FROM=noreply@timetracking.com
   ```

4. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Create Frontend Environment Variables**
   
   Create a `.env` file in the `frontend` directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

### Running the Application

1. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

2. **Start Backend Server**
   ```bash
   cd backend
   npm run dev    # Development mode with nodemon
   # OR
   npm start      # Production mode
   ```
   Backend will run on `http://localhost:5000`

3. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm start
   ```
   Frontend will run on `http://localhost:3000`

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test              # Run tests
npm test -- --coverage  # Run tests with coverage
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password
- `GET /api/auth/me` - Get current user

### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get single job
- `POST /api/jobs` - Create job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Time Entries
- `GET /api/time-entries` - Get all time entries
- `GET /api/time-entries/:id` - Get single time entry
- `POST /api/time-entries` - Create time entry
- `PUT /api/time-entries/:id` - Update time entry
- `DELETE /api/time-entries/:id` - Delete time entry

### Reports
- `GET /api/reports/summary` - Get summary report
- `GET /api/reports/by-job` - Get job-based report
- `GET /api/reports/salary` - Get salary report

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt encryption for passwords
- **Rate Limiting**: Protection against brute-force attacks
- **Helmet**: Security headers
- **CORS**: Configured cross-origin resource sharing
- **Input Validation**: Express-validator for request validation

## 📊 Key Features in Detail

### Time Entry Management
- Log work hours with precise start and end times
- Add notes to time entries
- Edit and delete entries
- Automatic duration calculation

### Job Management
- Track multiple clients/jobs
- Store company details and contact information
- Activate/deactivate jobs
- View time entries per job

### Reporting & Analytics
- Visual dashboard with charts
- Time worked by job
- Earnings summary
- Historical rate changes
- Date range filtering

### Rate Management
- Track hourly rate changes over time
- Automatic salary calculation based on rates
- Historical rate reporting

## 🎨 UI/UX Features

- Modern, clean interface
- Responsive design for all devices
- Dark/Light theme support
- Toast notifications for user feedback
- Loading states and error handling
- Form validation
- Date pickers for easy time entry
- Data visualization with charts

## 🔧 Configuration

### Frontend Configuration
- `frontend/src/theme/muiTheme.js` - MUI theme customization
- `frontend/tailwind.config.js` - Tailwind CSS configuration
- `frontend/src/services/queryClient.js` - React Query configuration

### Backend Configuration
- `backend/config/database.js` - MongoDB connection
- `backend/config/logger.js` - Winston logger setup
- `backend/middleware/auth.js` - JWT authentication
- `backend/middleware/errorHandler.js` - Error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Material-UI for the component library
- React Query for efficient data management
- MongoDB for flexible data storage
- Express.js for robust backend framework

---

For more information or support, please open an issue in the repository.

