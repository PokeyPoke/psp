import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ children }) => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className={`flex-1 ${isAdminPage ? 'pt-16' : 'pt-20'}`}>
        {children}
      </main>
      {!isAdminPage && <Footer />}
    </div>
  );
};

export default Layout;