import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import theme from './theme/muiTheme';
import { queryClient } from './services/queryClient';

import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobForm from './pages/JobForm';
import JobDetail from './pages/JobDetail';
import TimeEntries from './pages/TimeEntries';
import TimeEntryForm from './pages/TimeEntryForm';
import Reports from './pages/Reports';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterMoment}>
          <AuthProvider>
            <Router>
              <div className="App">
                <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Private Routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/jobs"
              element={
                <PrivateRoute>
                  <Jobs />
                </PrivateRoute>
              }
            />
            <Route
              path="/jobs/new"
              element={
                <PrivateRoute>
                  <JobForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/jobs/:id"
              element={
                <PrivateRoute>
                  <JobDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/jobs/:id/edit"
              element={
                <PrivateRoute>
                  <JobForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/time-entries"
              element={
                <PrivateRoute>
                  <TimeEntries />
                </PrivateRoute>
              }
            />
            <Route
              path="/time-entries/new"
              element={
                <PrivateRoute>
                  <TimeEntryForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/time-entries/:id/edit"
              element={
                <PrivateRoute>
                  <TimeEntryForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <PrivateRoute>
                  <Reports />
                </PrivateRoute>
              }
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

                <ToastContainer
                  position="top-right"
                  autoClose={3000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                />
              </div>
            </Router>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
      {/* React Query Devtools - only in development */}
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    </QueryClientProvider>
  );
}

export default App;

