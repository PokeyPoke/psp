import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import VoteButton from './VoteButton';
import MetricsDisplay from './MetricsDisplay';
import LoadingSpinner from './LoadingSpinner';
import { 
  formatParty, 
  getPartyColor, 
  getPartyTextColor, 
  generateInitials,
  formatNumber,
  formatSentiment,
  getSentimentColor 
} from '../utils/formatters';

const CandidateCard = ({ 
  candidate = {}, 
  metrics = {},
  variant = 'default',
  showMetrics = true,
  showVoteButton = true,
  isLoading = false,
  className = '',
  onClick = null 
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Default candidate structure
  const defaultCandidate = {
    id: null,
    name: 'Unknown Candidate',
    party: 'independent',
    position: '',
    bio: '',
    image_url: null,
    social_links: {}
  };

  const candidateData = { ...defaultCandidate, ...candidate };
  const partyColor = getPartyColor(candidateData.party);
  const partyTextColor = getPartyTextColor(candidateData.party);

  // Quick metrics for card display
  const quickMetrics = {
    sentiment: metrics.reddit_sentiment || metrics.news_sentiment || 0,
    mentions: (metrics.reddit_mentions || 0) + (metrics.news_mentions || 0),
    trends: metrics.google_trends || 0,
    votes: metrics.vote_count || 0
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 animate-pulse ${className}`}>
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-2/3"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-300 rounded"></div>
          <div className="h-3 bg-gray-300 rounded w-4/5"></div>
          <div className="h-8 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  const handleCardClick = (e) => {
    // Don't trigger card click if clicking on interactive elements
    if (e.target.closest('button') || e.target.closest('a[href]')) {
      return;
    }
    if (onClick) {
      onClick(candidateData);
    }
  };

  const renderCandidateImage = () => {
    if (imageError || !candidateData.image_url) {
      return (
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg ${partyColor}`}>
          {generateInitials(candidateData.name)}
        </div>
      );
    }

    return (
      <img
        src={candidateData.image_url}
        alt={candidateData.name}
        className="w-16 h-16 rounded-full object-cover"
        onError={() => setImageError(true)}
      />
    );
  };

  const renderQuickMetrics = () => {
    if (!showMetrics) return null;

    return (
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-800">
            {formatNumber(quickMetrics.votes)}
          </div>
          <div className="text-xs text-blue-600">Votes</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-purple-800">
            {formatNumber(quickMetrics.mentions)}
          </div>
          <div className="text-xs text-purple-600">Mentions</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-800">
            {formatNumber(quickMetrics.trends)}
          </div>
          <div className="text-xs text-green-600">Search Interest</div>
        </div>
        
        <div className={`rounded-lg p-3 text-center ${
          quickMetrics.sentiment > 0.1 ? 'bg-green-50' : 
          quickMetrics.sentiment < -0.1 ? 'bg-red-50' : 'bg-gray-50'
        }`}>
          <div className={`text-lg font-bold ${getSentimentColor(quickMetrics.sentiment)}`}>
            {formatSentiment(quickMetrics.sentiment)}
          </div>
          <div className="text-xs text-gray-600">Sentiment</div>
        </div>
      </div>
    );
  };

  if (variant === 'compact') {
    return (
      <div 
        className={`
          bg-white rounded-lg shadow-md hover:shadow-lg
          transition-all duration-200 p-4
          ${onClick ? 'cursor-pointer hover:scale-105' : ''}
          ${className}
        `}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center space-x-3">
          {renderCandidateImage()}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {candidateData.name}
            </h3>
            <div className={`text-sm ${partyTextColor}`}>
              {formatParty(candidateData.party)}
            </div>
          </div>
          {showVoteButton && (
            <VoteButton 
              candidateId={candidateData.id}
              candidateName={candidateData.name}
              size="sm"
              variant="secondary"
              showCount={false}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`
        bg-white rounded-lg shadow-md hover:shadow-xl
        transition-all duration-300 overflow-hidden
        ${onClick ? 'cursor-pointer' : ''}
        ${isHovered ? 'transform scale-105' : ''}
        ${className}
      `}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-center space-x-4 mb-4">
          {renderCandidateImage()}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {candidateData.name}
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${partyColor}`}>
                {formatParty(candidateData.party)}
              </span>
              {candidateData.position && (
                <span className="text-sm text-gray-600">
                  {candidateData.position}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {candidateData.bio && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-3">
            {candidateData.bio}
          </p>
        )}
      </div>

      {/* Quick Metrics */}
      {showMetrics && (
        <div className="px-6">
          {renderQuickMetrics()}
        </div>
      )}

      {/* Actions */}
      <div className="p-6 pt-0 flex items-center justify-between">
        {showVoteButton && (
          <VoteButton 
            candidateId={candidateData.id}
            candidateName={candidateData.name}
            size="md"
            variant="primary"
            showCount={true}
          />
        )}
        
        <Link
          to={`/candidate/${candidateData.id}`}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200 flex items-center"
          onClick={(e) => e.stopPropagation()}
        >
          View Details
          <span className="ml-1">→</span>
        </Link>
      </div>

      {/* Social Links */}
      {candidateData.social_links && Object.keys(candidateData.social_links).length > 0 && (
        <div className="px-6 pb-6">
          <div className="flex space-x-3">
            {Object.entries(candidateData.social_links).map(([platform, handle]) => {
              if (!handle) return null;
              
              const icons = {
                twitter: '🐦',
                facebook: '📘',
                instagram: '📷',
                linkedin: '💼',
                youtube: '📺',
                tiktok: '🎵'
              };
              
              return (
                <a
                  key={platform}
                  href={handle}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  title={`${candidateData.name} on ${platform}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-lg">{icons[platform] || '🔗'}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <LoadingSpinner size="md" text="Loading..." />
        </div>
      )}
    </div>
  );
};

export default CandidateCard;