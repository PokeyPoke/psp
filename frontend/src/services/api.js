import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.warn('Unauthorized access');
    }
    return Promise.reject(error);
  }
);

// Candidate Service
export const candidateService = {
  getAll: async () => {
    const response = await api.get('/candidates');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/candidates/${id}`);
    return response.data;
  },

  getMetrics: async (id, days = 30) => {
    const response = await api.get(`/candidates/${id}/metrics?days=${days}`);
    return response.data;
  },

  getLeaderboard: async (metric = 'vote_count') => {
    const response = await api.get(`/candidates/leaderboard/${metric}`);
    return response.data;
  },
};

// Metrics Service
export const metricsService = {
  getByCandidate: async (candidateId, days = 30) => {
    const response = await api.get(`/metrics/candidate/${candidateId}?days=${days}`);
    return response.data;
  },

  getTimeSeries: async (candidateId, metric, days = 30) => {
    const response = await api.get(`/metrics/candidate/${candidateId}/timeseries/${metric}?days=${days}`);
    return response.data;
  },

  getComparison: async (metric, days = 7) => {
    const response = await api.get(`/metrics/comparison/${metric}?days=${days}`);
    return response.data;
  },

  getLatest: async () => {
    const response = await api.get('/metrics/latest');
    return response.data;
  },

  getSummary: async (candidateId) => {
    const response = await api.get(`/metrics/summary/${candidateId}`);
    return response.data;
  },
};

// Vote Service
export const voteService = {
  vote: async (candidateId) => {
    const response = await api.post(`/votes/${candidateId}`);
    return response.data;
  },

  removeVote: async (candidateId) => {
    const response = await api.delete(`/votes/${candidateId}`);
    return response.data;
  },

  getVoteCounts: async () => {
    const response = await api.get('/votes/counts');
    return response.data;
  },

  getRecentVotes: async (hours = 24) => {
    const response = await api.get(`/votes/recent/${hours}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/votes/stats');
    return response.data;
  },

  getSessionVotes: async () => {
    const response = await api.get('/votes/session');
    return response.data;
  },

  getCandidateVotes: async (candidateId) => {
    const response = await api.get(`/votes/candidate/${candidateId}`);
    return response.data;
  },
};

// Admin Service
export const adminService = {
  login: async (password) => {
    const response = await api.post('/admin/login', { password });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/admin/logout');
    return response.data;
  },

  checkStatus: async () => {
    const response = await api.get('/admin/status');
    return response.data;
  },

  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  createCandidate: async (candidateData) => {
    const response = await api.post('/admin/candidates', candidateData);
    return response.data;
  },

  updateCandidate: async (id, candidateData) => {
    const response = await api.put(`/admin/candidates/${id}`, candidateData);
    return response.data;
  },

  deleteCandidate: async (id) => {
    const response = await api.delete(`/admin/candidates/${id}`);
    return response.data;
  },

  createMetrics: async (metricsData) => {
    const response = await api.post('/admin/metrics', metricsData);
    return response.data;
  },

  deleteMetrics: async (candidateId, date) => {
    const response = await api.delete(`/admin/metrics/${candidateId}/${date}`);
    return response.data;
  },

  getVoteAnalytics: async () => {
    const response = await api.get('/admin/votes/analytics');
    return response.data;
  },

  cleanupOldData: async (daysToKeep = 365) => {
    const response = await api.delete(`/admin/cleanup/old-data?daysToKeep=${daysToKeep}`);
    return response.data;
  },
};

export default api;