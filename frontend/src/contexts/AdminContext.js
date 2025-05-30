import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminService } from '../services/api';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginTime, setLoginTime] = useState(null);

  const checkAuthStatus = async () => {
    try {
      const status = await adminService.checkStatus();
      setIsAdmin(status.isAdmin);
      setLoginTime(status.loginTime);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAdmin(false);
      setLoginTime(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (password) => {
    try {
      setLoading(true);
      const response = await adminService.login(password);
      setIsAdmin(true);
      setLoginTime(response.session.loginTime);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await adminService.logout();
      setIsAdmin(false);
      setLoginTime(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear local state
      setIsAdmin(false);
      setLoginTime(null);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value = {
    isAdmin,
    loading,
    loginTime,
    login,
    logout,
    checkAuthStatus
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};