import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import LoadingSpinner from '../LoadingSpinner';

const ProtectedRoute = ({ 
  children, 
  requireAdmin = true,
  fallbackPath = '/admin/login',
  loadingComponent = null 
}) => {
  const { isAdmin, loading } = useAdmin();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    if (loadingComponent) {
      return loadingComponent;
    }
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" color="blue" />
          <p className="mt-4 text-gray-600">Verifying access permissions...</p>
        </div>
      </div>
    );
  }

  // Check if admin access is required and user is not admin
  if (requireAdmin && !isAdmin) {
    // Redirect to login with return URL
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // If all checks pass, render the protected content
  return children;
};

// Higher-order component version for class components or additional options
export const withProtectedRoute = (
  WrappedComponent, 
  options = {}
) => {
  const {
    requireAdmin = true,
    fallbackPath = '/admin/login',
    loadingComponent = null,
    ...otherOptions
  } = options;

  return function ProtectedWrapper(props) {
    return (
      <ProtectedRoute
        requireAdmin={requireAdmin}
        fallbackPath={fallbackPath}
        loadingComponent={loadingComponent}
      >
        <WrappedComponent {...props} {...otherOptions} />
      </ProtectedRoute>
    );
  };
};

// Specific admin route protection
export const AdminRoute = ({ children, ...props }) => {
  return (
    <ProtectedRoute 
      requireAdmin={true}
      fallbackPath="/admin/login"
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
};

// Optional authentication wrapper (for routes that can be accessed by both users and admins)
export const OptionalAuthRoute = ({ children, ...props }) => {
  return (
    <ProtectedRoute 
      requireAdmin={false}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
};

export default ProtectedRoute;