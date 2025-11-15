import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FaBars, FaTimes, FaHome, FaBriefcase, FaClock, FaChartLine, FaSignOutAlt } from 'react-icons/fa';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: FaHome },
    { path: '/jobs', label: 'Jobs', icon: FaBriefcase },
    { path: '/time-entries', label: 'Time Entries', icon: FaClock },
    { path: '/reports', label: 'Reports', icon: FaChartLine },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="bg-primary-600 text-white rounded-lg p-2">
                  <FaClock className="text-xl" />
                </div>
                <span className="text-xl font-bold text-gray-900">
                  Time<span className="text-primary-600">Track</span>
                </span>
                </Link>
              
              {/* Desktop Navigation */}
              <div className="hidden md:ml-8 md:flex md:space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                  <Link
                    key={item.path}
                    to={item.path}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                      <Icon />
                    {item.label}
                  </Link>
                  );
                })}
              </div>
            </div>

            {/* Right side - Desktop */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button 
                onClick={handleLogout} 
                className="btn btn-secondary flex items-center gap-2"
              >
                <FaSignOutAlt /> Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:text-gray-900 p-2"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <FaTimes className="text-2xl" /> : <FaBars className="text-2xl" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200"
            >
              <div className="px-4 py-4 space-y-2">
                <div className="bg-gray-100 rounded-lg p-3 mb-4">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-600">{user?.email}</p>
                </div>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                        location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="text-xl" />
                      {item.label}
                    </Link>
                  );
                })}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <FaSignOutAlt className="text-xl" />
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 mb-20 md:mb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 safe-area-bottom">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${
                  isActive
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className={`text-xl mb-1 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {item.label.split(' ')[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Layout;

