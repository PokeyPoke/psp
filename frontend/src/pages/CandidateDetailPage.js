import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import VoteButton from '../components/VoteButton';
import MetricsDisplay from '../components/MetricsDisplay';
import LoadingSpinner from '../components/LoadingSpinner';
import { candidateService, metricsService } from '../services/api';
import { 
  formatParty, 
  getPartyColor, 
  getPartyTextColor, 
  generateInitials,
  formatNumber,
  formatDate,
  formatSocialHandle,
  validateUrl
} from '../utils/formatters';
import toast from 'react-hot-toast';

const CandidateDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [candidate, setCandidate] = useState(null);
  const [metrics, setMetrics] = useState({});
  const [timeSeriesData, setTimeSeriesData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('vote_count');
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (id) {
      loadCandidateData();
    }
  }, [id]);

  const loadCandidateData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load candidate basic info
      const candidateData = await candidateService.getById(id);
      setCandidate(candidateData);

      // Load candidate metrics
      const [metricsData, timeSeriesPromises] = await Promise.all([
        candidateService.getMetrics(id, selectedPeriod),
        Promise.all([
          metricsService.getTimeSeries(id, 'vote_count', selectedPeriod).catch(() => []),
          metricsService.getTimeSeries(id, 'reddit_sentiment', selectedPeriod).catch(() => []),
          metricsService.getTimeSeries(id, 'reddit_mentions', selectedPeriod).catch(() => []),
          metricsService.getTimeSeries(id, 'news_sentiment', selectedPeriod).catch(() => []),
          metricsService.getTimeSeries(id, 'news_mentions', selectedPeriod).catch(() => []),
          metricsService.getTimeSeries(id, 'google_trends', selectedPeriod).catch(() => [])
        ])
      ]);

      setMetrics(metricsData);

      // Process time series data
      const [voteData, redditSentData, redditMentionsData, newsSentData, newsMentionsData, trendsData] = timeSeriesPromises;
      setTimeSeriesData({
        vote_count: voteData,
        reddit_sentiment: redditSentData,
        reddit_mentions: redditMentionsData,
        news_sentiment: newsSentData,
        news_mentions: newsMentionsData,
        google_trends: trendsData
      });

    } catch (error) {
      console.error('Error loading candidate data:', error);
      if (error.response?.status === 404) {
        setError('Candidate not found');
      } else {
        setError('Failed to load candidate data');
      }
      toast.error('Failed to load candidate details');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod) => {
    setSelectedPeriod(newPeriod);
    setLoading(true);
    loadCandidateData();
  };

  const renderCandidateHeader = () => {
    if (!candidate) return null;

    const partyColor = getPartyColor(candidate.party);
    const partyTextColor = getPartyTextColor(candidate.party);

    return (
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
            {/* Candidate Image */}
            <div className="flex-shrink-0">
              {imageError || !candidate.image_url ? (
                <div className={`w-32 h-32 rounded-full flex items-center justify-center text-white font-bold text-3xl ${partyColor}`}>
                  {generateInitials(candidate.name)}
                </div>
              ) : (
                <img
                  src={candidate.image_url}
                  alt={candidate.name}
                  className="w-32 h-32 rounded-full object-cover shadow-lg"
                  onError={() => setImageError(true)}
                />
              )}
            </div>

            {/* Candidate Info */}
            <div className="flex-grow">
              <div className="flex items-center mb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mr-4">
                  {candidate.name}
                </h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${partyColor}`}>
                  {formatParty(candidate.party)}
                </span>
              </div>

              {candidate.position && (
                <p className="text-xl text-gray-600 mb-4">
                  {candidate.position}
                </p>
              )}

              {candidate.bio && (
                <p className="text-gray-700 mb-6 max-w-3xl">
                  {candidate.bio}
                </p>
              )}

              {/* Social Links */}
              {candidate.social_links && Object.keys(candidate.social_links).length > 0 && (
                <div className="flex flex-wrap gap-4">
                  {Object.entries(candidate.social_links).map(([platform, handle]) => {
                    if (!handle) return null;
                    
                    const icons = {
                      twitter: { icon: '🐦', name: 'Twitter' },
                      facebook: { icon: '📘', name: 'Facebook' },
                      instagram: { icon: '📷', name: 'Instagram' },
                      linkedin: { icon: '💼', name: 'LinkedIn' },
                      youtube: { icon: '📺', name: 'YouTube' },
                      tiktok: { icon: '🎵', name: 'TikTok' }
                    };
                    
                    const platformInfo = icons[platform] || { icon: '🔗', name: platform };
                    const url = validateUrl(handle) ? handle : formatSocialHandle(platform, handle);
                    
                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                        title={`${candidate.name} on ${platformInfo.name}`}
                      >
                        <span className="text-lg mr-2">{platformInfo.icon}</span>
                        <span className="text-sm font-medium text-gray-700">
                          {platformInfo.name}
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Vote Button */}
            <div className="flex-shrink-0">
              <VoteButton 
                candidateId={candidate.id}
                candidateName={candidate.name}
                size="lg"
                variant="primary"
                showCount={true}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMetricsSection = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Metrics Display */}
      <div className="mb-8">
        <MetricsDisplay 
          metrics={metrics}
          variant="horizontal"
          showTrends={true}
          showLastUpdate={true}
        />
      </div>

      {/* Time Series Charts Controls */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
            Trends Over Time
          </h2>
          
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            {/* Metric Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metric:
              </label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="vote_count">Votes</option>
                <option value="reddit_mentions">Reddit Mentions</option>
                <option value="reddit_sentiment">Reddit Sentiment</option>
                <option value="news_mentions">News Mentions</option>
                <option value="news_sentiment">News Sentiment</option>
                <option value="google_trends">Google Trends</option>
              </select>
            </div>

            {/* Period Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period:
              </label>
              <div className="flex rounded-md border border-gray-300 overflow-hidden">
                {[7, 30, 90].map((days) => (
                  <button
                    key={days}
                    onClick={() => handlePeriodChange(days)}
                    className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                      selectedPeriod === days
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {days}d
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Simple Chart Placeholder */}
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">📈</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {selectedMetric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Trend
          </h3>
          <p className="text-gray-600 mb-4">
            {timeSeriesData[selectedMetric]?.length || 0} data points over the last {selectedPeriod} days
          </p>
          
          {/* Simple data visualization */}
          {timeSeriesData[selectedMetric] && timeSeriesData[selectedMetric].length > 0 ? (
            <div className="grid grid-cols-7 gap-2 max-w-md mx-auto">
              {timeSeriesData[selectedMetric].slice(-7).map((point, index) => {
                const maxValue = Math.max(...timeSeriesData[selectedMetric].map(p => p.value));
                const height = maxValue > 0 ? (point.value / maxValue) * 100 : 0;
                
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-8 bg-blue-500 rounded-t-md mb-1 transition-all duration-300"
                      style={{ height: `${Math.max(height, 5)}%`, minHeight: '4px' }}
                      title={`${formatDate(point.date)}: ${formatNumber(point.value)}`}
                    />
                    <span className="text-xs text-gray-500">
                      {formatDate(point.date, 'dd')}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-gray-500">
              No trend data available for this metric
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderRelatedCandidates = () => (
    <div className="bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Explore Other Candidates
        </h2>
        <div className="flex justify-center space-x-4">
          <Link
            to="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
          >
            <span className="mr-2">🏠</span>
            View All Candidates
          </Link>
          <Link
            to="/leaderboard"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center"
          >
            <span className="mr-2">🏆</span>
            View Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner size="lg" text="Loading candidate details..." className="py-20" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">😞</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error === 'Candidate not found' ? 'Candidate Not Found' : 'Something Went Wrong'}
            </h2>
            <p className="text-gray-600 mb-6">
              {error === 'Candidate not found' 
                ? 'The candidate you\'re looking for doesn\'t exist or has been removed.'
                : error
              }
            </p>
            <div className="space-x-4">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Go Home
              </button>
              {error !== 'Candidate not found' && (
                <button
                  onClick={loadCandidateData}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                >
                  Try Again
                </button>
              )}
            </div>
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
            <span className="text-gray-900 font-medium">
              {candidate?.name || 'Candidate Details'}
            </span>
          </nav>
        </div>
      </div>

      {renderCandidateHeader()}
      {renderMetricsSection()}
      {renderRelatedCandidates()}
    </div>
  );
};

export default CandidateDetailPage;