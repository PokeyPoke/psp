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

      {/* Main Content with Sidebar Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-3">
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
                {selectedView === 'grid' ? (
                  <>
                    {/* Top 3 Candidates - Highlighted Above Main Grid */}
                    {sortedCandidates.length > 0 && (
                      <div className="mb-16">
                        <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
                          🏆 Leading the Stage
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                          {sortedCandidates.slice(0, 3).map((candidate, index) => (
                            <div
                              key={candidate.id}
                              className={`
                                relative bg-gradient-to-br rounded-2xl p-8 text-white transform hover:scale-105 transition-transform duration-200
                                ${index === 0 ? 'from-blue-500 to-blue-700' : ''}
                                ${index === 1 ? 'from-red-500 to-red-700' : ''}
                                ${index === 2 ? 'from-purple-500 to-purple-700' : ''}
                              `}
                            >
                              <div className={`
                                absolute -top-4 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full flex items-center justify-center text-black font-bold text-xl
                                ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'}
                              `}>
                                #{index + 1}
                              </div>
                              <div className="text-center">
                                <div className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-white bg-gray-300 flex items-center justify-center text-2xl font-bold text-gray-600">
                                  {candidate.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </div>
                                <h3 className="text-3xl font-bold mb-2">{candidate.name}</h3>
                                <p className={`mb-4 ${index === 0 ? 'text-blue-200' : index === 1 ? 'text-red-200' : 'text-purple-200'}`}>
                                  {candidate.party} • #{index + 1} Overall
                                </p>
                                
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                  <div className="bg-white bg-opacity-20 rounded-lg p-3">
                                    <div className="text-2xl font-bold">
                                      {(candidateMetrics[candidate.id]?.vote_count || 0).toLocaleString()}
                                    </div>
                                    <div className={`text-sm ${index === 0 ? 'text-blue-200' : index === 1 ? 'text-red-200' : 'text-purple-200'}`}>
                                      Votes
                                    </div>
                                  </div>
                                  <div className="bg-white bg-opacity-20 rounded-lg p-3">
                                    <div className="text-2xl font-bold">
                                      {candidateMetrics[candidate.id]?.reddit_sentiment > 0 ? '+' : ''}
                                      {(candidateMetrics[candidate.id]?.reddit_sentiment || 0).toFixed(2)}
                                    </div>
                                    <div className={`text-sm ${index === 0 ? 'text-blue-200' : index === 1 ? 'text-red-200' : 'text-purple-200'}`}>
                                      Sentiment
                                    </div>
                                  </div>
                                </div>
                                
                                <button className="w-full bg-white text-gray-900 font-bold py-3 rounded-lg hover:bg-gray-100 transition-colors">
                                  View Full Profile
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Remaining Candidates - 5-Column Grid */}
                    {sortedCandidates.length > 3 && (
                      <div>
                        <h2 className="text-3xl font-bold mb-8 text-gray-900">All Candidates on Stage</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                          {sortedCandidates.slice(3).map((candidate, index) => (
                            <CandidateCard
                              key={candidate.id}
                              candidate={candidate}
                              metrics={candidateMetrics[candidate.id] || {}}
                              variant="compact"
                              showMetrics={true}
                              showVoteButton={true}
                              isLoading={refreshing}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* List View */
                  <div className="space-y-4">
                    {sortedCandidates.map((candidate) => (
                      <CandidateCard
                        key={candidate.id}
                        candidate={candidate}
                        metrics={candidateMetrics[candidate.id] || {}}
                        variant="compact"
                        showMetrics={true}
                        showVoteButton={true}
                        isLoading={refreshing}
                      />
                    ))}
                  </div>
                )}

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

          {/* Sidebar */}
          <div className="lg:col-span-1 mt-8 lg:mt-0">
            <div className="space-y-6">
              {/* Advanced Analytics & Insights */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900">
                  📊 Advanced Analytics & Insights
                </h3>
                
                {/* Geographic Performance */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">🗺️ Geographic Leaders</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">🤠 Texas</span>
                      <div className="text-right">
                        <div className="font-bold text-sm">Trump</div>
                        <div className="text-xs text-gray-600">8.9K votes</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">🌴 California</span>
                      <div className="text-right">
                        <div className="font-bold text-sm">Biden</div>
                        <div className="text-xs text-gray-600">12.3K votes</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">🗽 New York</span>
                      <div className="text-right">
                        <div className="font-bold text-sm">Biden</div>
                        <div className="text-xs text-gray-600">8.7K votes</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">🌴 Florida</span>
                      <div className="text-right">
                        <div className="font-bold text-sm">DeSantis</div>
                        <div className="text-xs text-gray-600">4.8K votes</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 24-Hour Achievements */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">🏆 Today's Winners</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center justify-between text-sm">
                      <span>🔥 Most Votes</span>
                      <span className="font-medium">Biden</span>
                    </li>
                    <li className="flex items-center justify-between text-sm">
                      <span>📱 Most Social Buzz</span>
                      <span className="font-medium">Haley</span>
                    </li>
                    <li className="flex items-center justify-between text-sm">
                      <span>📈 Biggest Jump</span>
                      <span className="font-medium">DeSantis</span>
                    </li>
                    <li className="flex items-center justify-between text-sm">
                      <span>😊 Best Sentiment</span>
                      <span className="font-medium">AOC</span>
                    </li>
                  </ul>
                </div>

                {/* Demographic Insights */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">👥 Demographic Leaders</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">18-29 Age Group</span>
                        <span className="font-medium text-sm">AOC</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-pink-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">30-49 Age Group</span>
                        <span className="font-medium text-sm">Biden</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '58%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">50+ Age Group</span>
                        <span className="font-medium text-sm">Trump</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: '62%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historical Performance */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900">
                  📈 Historical Performance
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">Recent Trends (30 Days)</h4>
                    <div className="space-y-2 text-sm">
                      <div>📅 <strong>30 days ago:</strong> Trump led by 15%</div>
                      <div>📅 <strong>7 days ago:</strong> Biden surge began</div>
                      <div>📅 <strong>Today:</strong> Biden takes the lead</div>
                      <div>🔥 <strong>Biggest mover:</strong> DeSantis (+47%)</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Live Tracking</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Vote Velocity:</span>
                        <span className="font-medium text-green-600">+347 votes/min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Active Discussions:</span>
                        <span className="font-medium">18.2K</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Sentiment Changes:</span>
                        <span className="font-medium text-blue-600">23 updates</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all text-sm">
                      📊 View Full Timeline
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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