import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAdmin } from '../contexts/AdminContext';
import toast from 'react-hot-toast';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiUsers, 
  FiBarChart3, 
  FiTrendingUp,
  FiSave,
  FiX,
  FiExternalLink
} from 'react-icons/fi';
import { formatNumber, formatDate, getPartyColor, getPartyTextColor } from '../utils/formatters';

const AdminDashboard = () => {
  const { logout } = useAdmin();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    party: '',
    photo_url: '',
    campaign_link: '',
    social_links: {}
  });

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery(
    'adminDashboard',
    adminService.getDashboard,
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  // Create candidate mutation
  const createCandidateMutation = useMutation(adminService.createCandidate, {
    onSuccess: () => {
      queryClient.invalidateQueries('adminDashboard');
      setShowAddForm(false);
      resetForm();
      toast.success('Candidate created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create candidate');
    },
  });

  // Update candidate mutation
  const updateCandidateMutation = useMutation(
    ({ id, data }) => adminService.updateCandidate(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminDashboard');
        setEditingCandidate(null);
        resetForm();
        toast.success('Candidate updated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update candidate');
      },
    }
  );

  // Delete candidate mutation
  const deleteCandidateMutation = useMutation(adminService.deleteCandidate, {
    onSuccess: () => {
      queryClient.invalidateQueries('adminDashboard');
      toast.success('Candidate deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete candidate');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      bio: '',
      party: '',
      photo_url: '',
      campaign_link: '',
      social_links: {}
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Candidate name is required');
      return;
    }

    if (editingCandidate) {
      updateCandidateMutation.mutate({
        id: editingCandidate.id,
        data: formData
      });
    } else {
      createCandidateMutation.mutate(formData);
    }
  };

  const handleEdit = (candidate) => {
    setEditingCandidate(candidate);
    setFormData({
      name: candidate.name || '',
      bio: candidate.bio || '',
      party: candidate.party || '',
      photo_url: candidate.photo_url || '',
      campaign_link: candidate.campaign_link || '',
      social_links: candidate.social_links || {}
    });
    setShowAddForm(true);
  };

  const handleDelete = async (candidate) => {
    if (window.confirm(`Are you sure you want to delete ${candidate.name}? This action cannot be undone.`)) {
      deleteCandidateMutation.mutate(candidate.id);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingCandidate(null);
    resetForm();
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" overlay />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">
            {error.response?.data?.error || 'Failed to load dashboard data'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { candidates, votes, metrics } = dashboardData || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage candidates and view analytics</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <FiPlus className="h-4 w-4" />
              <span>Add Candidate</span>
            </button>
            <button
              onClick={logout}
              className="btn btn-ghost"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Candidates</p>
                <p className="text-3xl font-bold text-gray-900">
                  {candidates?.total || 0}
                </p>
              </div>
              <div className="bg-primary-100 p-3 rounded-lg">
                <FiUsers className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Votes</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(votes?.summary?.total_votes || 0)}
                </p>
              </div>
              <div className="bg-success-100 p-3 rounded-lg">
                <FiBarChart3 className="h-6 w-6 text-success-600" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Points</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(metrics?.totalDataPoints || 0)}
                </p>
              </div>
              <div className="bg-accent-100 p-3 rounded-lg">
                <FiTrendingUp className="h-6 w-6 text-accent-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Candidates Table */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Candidates</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Party
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Votes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {candidates?.list?.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {candidate.photo_url ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={candidate.photo_url}
                              alt={candidate.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {candidate.name.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {candidate.name}
                          </div>
                          {candidate.campaign_link && (
                            <div className="text-sm text-gray-500">
                              <a
                                href={candidate.campaign_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-1 hover:text-primary-600"
                              >
                                <span>Campaign</span>
                                <FiExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPartyColor(candidate.party)} text-white`}>
                        {candidate.party || 'Independent'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(candidate.vote_count || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(candidate.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(candidate)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <FiEdit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(candidate)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingCandidate ? 'Edit Candidate' : 'Add New Candidate'}
                  </h3>
                  <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Party</label>
                    <select
                      value={formData.party}
                      onChange={(e) => setFormData({ ...formData, party: e.target.value })}
                      className="input"
                    >
                      <option value="">Select Party</option>
                      <option value="Democratic">Democratic</option>
                      <option value="Republican">Republican</option>
                      <option value="Independent">Independent</option>
                      <option value="Green">Green</option>
                      <option value="Libertarian">Libertarian</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Biography</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="input"
                      rows="3"
                      placeholder="Brief description of the candidate..."
                    />
                  </div>

                  <div>
                    <label className="label">Photo URL</label>
                    <input
                      type="url"
                      value={formData.photo_url}
                      onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                      className="input"
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>

                  <div>
                    <label className="label">Campaign Website</label>
                    <input
                      type="url"
                      value={formData.campaign_link}
                      onChange={(e) => setFormData({ ...formData, campaign_link: e.target.value })}
                      className="input"
                      placeholder="https://candidate2024.com"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={createCandidateMutation.isLoading || updateCandidateMutation.isLoading}
                      className="btn btn-primary flex-1 flex items-center justify-center space-x-2"
                    >
                      {(createCandidateMutation.isLoading || updateCandidateMutation.isLoading) ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <FiSave className="h-4 w-4" />
                          <span>{editingCandidate ? 'Update' : 'Create'}</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn btn-ghost"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;