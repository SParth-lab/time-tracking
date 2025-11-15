import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from 'react-icons/fa';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [useMasterPassword, setUseMasterPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, masterLogin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let result;
    if (useMasterPassword) {
      result = await masterLogin(formData.email, formData.password);
    } else {
      result = await login(formData.email, formData.password);
    }

    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-block bg-primary-600 text-white rounded-full p-4 mb-4"
          >
            <FaLock className="text-3xl" />
          </motion.div>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-2">
            Welcome Back!
          </h2>
          <p className="text-gray-600">
            Sign in to continue tracking your time
          </p>
        </div>

        <motion.form 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card space-y-6" 
          onSubmit={handleSubmit}
        >
            <div>
            <label htmlFor="email" className="label flex items-center gap-2">
              <FaEnvelope className="text-primary-600" />
              Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input"
              placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
              autoFocus
              />
            </div>

            <div>
            <label htmlFor="password" className="label flex items-center gap-2">
              <FaLock className="text-primary-600" />
                {useMasterPassword ? 'Master Password' : 'Password'}
              </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="input pr-12"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash className="text-xl" /> : <FaEye className="text-xl" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center">
              <input
                id="master-password"
                name="master-password"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={useMasterPassword}
                onChange={(e) => setUseMasterPassword(e.target.checked)}
              />
              <label htmlFor="master-password" className="ml-2 block text-sm text-gray-700">
                Use master password
              </label>
            </div>

            <div className="text-sm">
              <Link 
                to="/forgot-password" 
                className="font-semibold text-primary-600 hover:text-primary-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

            <button
              type="submit"
              disabled={loading}
            className="w-full btn btn-primary btn-lg"
            >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="spinner w-5 h-5"></div>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
            </button>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="font-semibold text-primary-600 hover:text-primary-700 hover:underline"
              >
                Create one now
              </Link>
            </p>
          </div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-gray-500">
            🔒 Your data is secure and encrypted
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;

