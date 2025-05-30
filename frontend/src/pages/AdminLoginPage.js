import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminLoginPage = () => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);

  const { login, isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  const maxAttempts = 5;
  const lockDuration = 300; // 5 minutes in seconds

  // Redirect destination after login
  const from = location.state?.from?.pathname || '/admin/dashboard';

  useEffect(() => {
    // If already logged in as admin, redirect
    if (isAdmin && !loading) {
      navigate(from, { replace: true });
    }
  }, [isAdmin, loading, navigate, from]);

  useEffect(() => {
    // Handle lockout timer
    let timer;
    if (isLocked && lockTimeRemaining > 0) {
      timer = setInterval(() => {
        setLockTimeRemaining(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLocked, lockTimeRemaining]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLocked) {
      toast.error('Too many failed attempts. Please wait.');
      return;
    }

    if (!password.trim()) {
      toast.error('Please enter a password');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(password);
      
      if (result.success) {
        toast.success('Admin login successful!');
        navigate(from, { replace: true });
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= maxAttempts) {
          setIsLocked(true);
          setLockTimeRemaining(lockDuration);
          toast.error(`Too many failed attempts. Locked for ${lockDuration / 60} minutes.`);
        } else {
          toast.error(result.error || 'Invalid password');
          const remainingAttempts = maxAttempts - newAttempts;
          if (remainingAttempts <= 2) {
            toast.warning(`${remainingAttempts} attempts remaining`);
          }
        }
        setPassword('');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header */}
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Access
          </h2>
          <p className="text-gray-600">
            Enter your admin password to access the dashboard
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {/* Lockout Notice */}
          {isLocked && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Account Temporarily Locked
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    Too many failed attempts. Try again in {formatTime(lockTimeRemaining)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Attempt Warning */}
          {attempts > 0 && attempts < maxAttempts && !isLocked && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    Failed Login Attempts
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    {maxAttempts - attempts} attempts remaining before lockout
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Admin Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || isLocked}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || isLocked}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                >
                  <span className="text-sm">
                    {showPassword ? '🙈' : '👁️'}
                  </span>
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || isLocked || !password.trim()}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  {isLoading ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    <span className="text-blue-500 group-hover:text-blue-400">
                      🔑
                    </span>
                  )}
                </span>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          {/* Security Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start">
              <span className="text-lg mr-3">ℹ️</span>
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Security Notice
                </h3>
                <ul className="text-xs text-gray-600 mt-1 space-y-1">
                  <li>• Admin access is required for candidate management</li>
                  <li>• Sessions expire after 2 hours of inactivity</li>
                  <li>• Failed attempts are logged for security</li>
                  <li>• Contact system administrator if locked out</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          Political Sentiment Tracker • Admin Panel
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;