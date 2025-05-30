import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CandidateCard from '../components/CandidateCard';
import MetricsDisplay from '../components/MetricsDisplay';
import LoadingSpinner from '../components/LoadingSpinner';
import { candidateService, metricsService, voteService } from '../services/api';
import { useVote } from '../contexts/VoteContext';
import toast from 'react-hot-toast';

const HomePage = () => {
  const [candidates, setCandidates] = useState([]);
  const [candidateMetrics, setCandidateMetrics] = useState({});
  const [globalMetrics, setGlobalMetrics] = useState({});
  const [recentVotes, setRecentVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState('grid');
  const [sortBy, setSortBy] = useState('votes');
  const [refreshing, setRefreshing] = useState(false);

  const { loadVoteCounts, loadSessionVotes } = useVote();

  const loadData = async (showToast = false) => {
    try {
      setRefreshing(true);
      setError(null);

      // Load candidates
      const candidatesData = await candidateService.getAll();
      setCandidates(candidatesData);

      // Load metrics for each candidate
      const metricsPromises = candidatesData.map(async (candidate) => {
        try {
          const metrics = await metricsService.getSummary(candidate.id);
          return { candidateId: candidate.id, metrics };
        } catch (error) {
          console.error(`Error loading metrics for candidate ${candidate.id}:`, error);
          return { candidateId: candidate.id, metrics: {} };
        }
      });

      const metricsResults = await Promise.all(metricsPromises);
      const metricsMap = {};
      metricsResults.forEach(({ candidateId, metrics }) => {
        metricsMap[candidateId] = metrics;
      });
      setCandidateMetrics(metricsMap);

      // Load global metrics and recent activity
      const [globalMetricsData, recentVotesData] = await Promise.all([
        metricsService.getLatest().catch(() => ({})),
        voteService.getRecentVotes(24).catch(() => [])
      ]);

      setGlobalMetrics(globalMetricsData);
      setRecentVotes(recentVotesData);

      // Refresh vote context
      await loadVoteCounts();
      await loadSessionVotes();

      if (showToast) {
        toast.success('Data refreshed successfully!');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please try again.');
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    loadData(true);
  };

  const getSortedCandidates = () => {
    const candidatesWithMetrics = candidates.map(candidate => ({
      ...candidate,
      metrics: candidateMetrics[candidate.id] || {}
    }));

    return candidatesWithMetrics.sort((a, b) => {
      switch (sortBy) {
        case 'votes':
          return (b.metrics.vote_count || 0) - (a.metrics.vote_count || 0);
        case 'sentiment':
          return (b.metrics.reddit_sentiment || 0) - (a.metrics.reddit_sentiment || 0);
        case 'mentions':
          return ((b.metrics.reddit_mentions || 0) + (b.metrics.news_mentions || 0)) - 
                 ((a.metrics.reddit_mentions || 0) + (a.metrics.news_mentions || 0));
        case 'trends':
          return (b.metrics.google_trends || 0) - (a.metrics.google_trends || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  };

  const renderHeader = () => (
    <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Political Sentiment Tracker
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Track, vote, and analyze political sentiment in real-time
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-3xl font-bold">{candidates.length}</div>
              <div className="text-blue-100">Candidates</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-3xl font-bold">
                {Object.values(candidateMetrics).reduce((sum, metrics) => sum + (metrics.vote_count || 0), 0)}
              </div>
              <div className="text-blue-100">Total Votes</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-3xl font-bold">{recentVotes.length}</div>
              <div className="text-blue-100">Recent Votes</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-3xl font-bold">Live</div>
              <div className="text-blue-100">Updates</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderControls = () => (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* View Controls */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">View:</label>
            <div className="flex rounded-md border border-gray-300 overflow-hidden">
              <button
                onClick={() => setSelectedView('grid')}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  selectedView === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setSelectedView('list')}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  selectedView === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                List
              </button>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="votes">Most Votes</option>
              <option value="sentiment">Best Sentiment</option>
              <option value="mentions">Most Mentions</option>
              <option value="trends">Trending</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <span className={`mr-2 ${refreshing ? 'animate-spin' : ''}`}>
              🔄
            </span>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderQuickActions = () => (
    <div className="bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/leaderboard"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 group"
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4">🏆</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                  View Leaderboard
                </h3>
                <p className="text-sm text-gray-600">
                  See rankings across all metrics
                </p>
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📊</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Live Analytics
                </h3>
                <p className="text-sm text-gray-600">
                  Real-time sentiment tracking
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🗳️</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Your Votes
                </h3>
                <p className="text-sm text-gray-600">
                  {recentVotes.length} recent votes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderHeader()}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner size="lg" text="Loading candidates..." className="py-20" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderHeader()}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">😞</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => loadData(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sortedCandidates = getSortedCandidates();

  return (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      {renderControls()}
      {renderQuickActions()}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {candidates.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏛️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No candidates available
            </h2>
            <p className="text-gray-600">
              Check back later or contact an administrator
            </p>
          </div>
        ) : (
          <>
            {/* Candidates Grid/List */}
            <div className={
              selectedView === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {sortedCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  metrics={candidateMetrics[candidate.id] || {}}
                  variant={selectedView === 'list' ? 'compact' : 'default'}
                  showMetrics={true}
                  showVoteButton={true}
                  isLoading={refreshing}
                />
              ))}
            </div>

            {/* Load More Button (for future pagination) */}
            {sortedCandidates.length >= 20 && (
              <div className="text-center mt-12">
                <button className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200">
                  Load More Candidates
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Refresh Button for Mobile */}
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="fixed bottom-6 right-6 md:hidden bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 z-50"
        aria-label="Refresh data"
      >
        <span className={`text-xl ${refreshing ? 'animate-spin' : ''}`}>
          🔄
        </span>
      </button>
    </div>
  );
};

export default HomePage;