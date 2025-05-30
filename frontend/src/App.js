import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { VoteProvider } from './contexts/VoteContext';
import { AdminProvider } from './contexts/AdminContext';

import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import CandidateDetailPage from './pages/CandidateDetailPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import NotFoundPage from './pages/NotFoundPage';

import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  return (
    <Router>
      <VoteProvider>
        <AdminProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/candidate/:id" element={<CandidateDetailPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </AdminProvider>
      </VoteProvider>
    </Router>
  );
}

export default App;