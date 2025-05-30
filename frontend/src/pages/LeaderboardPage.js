import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CandidateCard from '../components/CandidateCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { candidateService, metricsService } from '../services/api';
import { 
  formatNumber, 
  formatSentiment, 
  getSentimentColor,
  formatParty, 
  getPartyColor, 
  generateInitials 
} from '../utils/formatters';
import toast from 'react-hot-toast';

const LeaderboardPage = () => {
  const [leaderboards, setLeaderboards] = useState({});
  const [selectedMetric, setSelectedMetric] = useState('vote_count');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const metrics = [
    { key: 'vote_count', label: 'Most Votes', icon: '🗳️', color: 'blue' },
    { key: 'reddit_mentions', label: 'Reddit Buzz', icon: '💬', color: 'orange' },
    { key: 'reddit_sentiment', label: 'Reddit Sentiment', icon: '😊', color: 'green' },
    { key: 'news_mentions', label: 'News Coverage', icon: '📰', color: 'purple' },
    { key: 'news_sentiment', label: 'News Sentiment', icon: '📊', color: 'indigo' },
    { key: 'google_trends', label: 'Search Interest', icon: '📈', color: 'red' }
  ];

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async (showToast = false) => {
    try {
      setRefreshing(true);
      setError(null);

      // Load leaderboards for all metrics
      const leaderboardPromises = metrics.map(async (metric) => {
        try {
          const data = await candidateService.getLeaderboard(metric.key);
          return { metric: metric.key, data };
        } catch (error) {
          console.error(`Error loading leaderboard for ${metric.key}:`, error);
          return { metric: metric.key, data: [] };
        }
      });

      const results = await Promise.all(leaderboardPromises);
      const leaderboardsMap = {};
      results.forEach(({ metric, data }) => {
        leaderboardsMap[metric] = data;
      });

      setLeaderboards(leaderboardsMap);
      
      if (showToast) {
        toast.success('Leaderboards refreshed!');
      }
    } catch (error) {
      console.error('Error loading leaderboards:', error);
      setError('Failed to load leaderboards');
      toast.error('Failed to load leaderboards');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadLeaderboards(true);
  };

  const getCurrentLeaderboard = () => {
    return leaderboards[selectedMetric] || [];
  };

  const getCurrentMetric = () => {
    return metrics.find(m => m.key === selectedMetric) || metrics[0];
  };

  const formatMetricValue = (value, metricKey) => {
    if (metricKey.includes('sentiment')) {
      return formatSentiment(value);
    }
    return formatNumber(value);
  };

  const getMetricColor = (value, metricKey) => {
    if (metricKey.includes('sentiment')) {
      return getSentimentColor(value);
    }
    return 'text-gray-900';
  };

  const getMedalIcon = (position) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${position}`;
    }
  };

  const renderHeader = () => (
    <div className="bg-gradient-to-r from-purple-600 to-blue-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            🏆 Leaderboard
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-purple-100">
            See who's leading across different metrics
          </p>
        </div>
      </div>
    </div>
  );

  const renderControls = () => (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Metric Selector */}
          <div className="flex flex-wrap gap-2">
            {metrics.map((metric) => (
              <button
                key={metric.key}
                onClick={() => setSelectedMetric(metric.key)}
                className={`
                  flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200
                  ${selectedMetric === metric.key
                    ? `bg-${metric.color}-600 text-white shadow-lg`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <span className="mr-2">{metric.icon}</span>
                <span className="hidden md:inline">{metric.label}</span>
                <span className="md:hidden">{metric.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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

  const renderLeaderboardTable = () => {
    const currentMetric = getCurrentMetric();
    const leaderboard = getCurrentLeaderboard();

    if (leaderboard.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No data available
          </h3>
          <p className="text-gray-600">
            Leaderboard data for {currentMetric.label.toLowerCase()} will appear once available
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Table Header */}
        <div className={`bg-${currentMetric.color}-600 text-white px-6 py-4`}>
          <h2 className="text-2xl font-bold flex items-center">
            <span className="mr-3">{currentMetric.icon}</span>
            {currentMetric.label} Leaderboard
          </h2>
        </div>

        {/* Leaderboard Entries */}
        <div className="divide-y divide-gray-200">
          {leaderboard.map((candidate, index) => {
            const position = index + 1;
            const isTopThree = position <= 3;
            const metricValue = candidate[selectedMetric];

            return (
              <div
                key={candidate.id}
                className={`
                  p-6 hover:bg-gray-50 transition-colors duration-200
                  ${isTopThree ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  {/* Left side - Position, Image, Name, Party */}
                  <div className="flex items-center space-x-4">
                    {/* Position */}
                    <div className={`
                      text-2xl font-bold w-12 text-center
                      ${isTopThree ? 'text-yellow-600' : 'text-gray-500'}
                    `}>
                      {getMedalIcon(position)}
                    </div>

                    {/* Candidate Image */}
                    <div className="flex-shrink-0">
                      {candidate.image_url ? (
                        <img
                          src={candidate.image_url}
                          alt={candidate.name}
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getPartyColor(candidate.party)} ${candidate.image_url ? 'hidden' : 'flex'}`}
                      >
                        {generateInitials(candidate.name)}
                      </div>
                    </div>

                    {/* Name and Party */}
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {candidate.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatParty(candidate.party)}
                      </p>
                    </div>
                  </div>

                  {/* Right side - Metric Value and Actions */}
                  <div className="flex items-center space-x-4">
                    {/* Metric Value */}
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getMetricColor(metricValue, selectedMetric)}`}>
                        {formatMetricValue(metricValue, selectedMetric)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {currentMetric.label.toLowerCase()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Link
                        to={`/candidate/${candidate.id}`}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors duration-200 text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTopThreeCards = () => {
    const leaderboard = getCurrentLeaderboard();
    const topThree = leaderboard.slice(0, 3);
    const currentMetric = getCurrentMetric();

    if (topThree.length === 0) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {topThree.map((candidate, index) => {
          const position = index + 1;
          const metricValue = candidate[selectedMetric];
          
          const cardStyles = {
            1: 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-xl transform scale-105',
            2: 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg',
            3: 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-lg'
          };

          return (
            <div
              key={candidate.id}
              className={`rounded-lg p-6 text-center ${cardStyles[position]}`}
            >
              <div className="text-4xl mb-2">
                {getMedalIcon(position)}
              </div>
              
              {/* Candidate Image */}
              <div className="mb-4 flex justify-center">
                {candidate.image_url ? (
                  <img
                    src={candidate.image_url}
                    alt={candidate.name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full flex items-center justify-center bg-white text-gray-700 font-bold text-xl border-4 border-white shadow-lg">
                    {generateInitials(candidate.name)}
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold mb-1">
                {candidate.name}
              </h3>
              
              <p className="text-sm opacity-80 mb-3">
                {formatParty(candidate.party)}
              </p>
              
              <div className="text-3xl font-bold mb-1">
                {formatMetricValue(metricValue, selectedMetric)}
              </div>
              
              <p className="text-sm opacity-80">
                {currentMetric.label}
              </p>

              <Link
                to={`/candidate/${candidate.id}`}
                className="inline-block mt-4 px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-200 backdrop-blur-sm"
              >
                View Profile →
              </Link>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderHeader()}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner size="lg" text="Loading leaderboards..." className="py-20" />
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
              Failed to Load Leaderboards
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => loadLeaderboards(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-blue-600 hover:text-blue-800">
              Home
            </Link>
            <span className="text-gray-500">→</span>
            <span className="text-gray-900 font-medium">Leaderboard</span>
          </nav>
        </div>
      </div>

      {renderHeader()}
      {renderControls()}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top 3 Cards */}
        {renderTopThreeCards()}

        {/* Full Leaderboard */}
        {renderLeaderboardTable()}

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <span className="mr-2">🏠</span>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;