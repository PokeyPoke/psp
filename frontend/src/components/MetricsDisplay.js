import React, { useState } from 'react';
import { 
  formatNumber, 
  formatPercentage, 
  formatSentiment, 
  getSentimentColor, 
  getSentimentBgColor,
  getMetricIcon,
  getMetricLabel,
  formatRelativeTime 
} from '../utils/formatters';

const MetricsDisplay = ({ 
  metrics = {}, 
  variant = 'card',
  showTrends = true,
  showLastUpdate = true,
  className = '',
  compact = false 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  
  // Default metrics structure
  const defaultMetrics = {
    reddit_mentions: 0,
    reddit_sentiment: 0,
    google_trends: 0,
    news_mentions: 0,
    news_sentiment: 0,
    vote_count: 0,
    last_updated: null,
    trends: {}
  };

  const currentMetrics = { ...defaultMetrics, ...metrics };
  const trends = currentMetrics.trends || {};

  const periods = [
    { key: '24h', label: '24h' },
    { key: '7d', label: '7d' },
    { key: '30d', label: '30d' }
  ];

  const metricItems = [
    {
      key: 'vote_count',
      label: 'Votes',
      value: currentMetrics.vote_count,
      icon: '🗳️',
      color: 'blue',
      formatter: formatNumber
    },
    {
      key: 'reddit_mentions',
      label: 'Reddit Buzz',
      value: currentMetrics.reddit_mentions,
      icon: '💬',
      color: 'orange',
      formatter: formatNumber
    },
    {
      key: 'reddit_sentiment',
      label: 'Reddit Sentiment',
      value: currentMetrics.reddit_sentiment,
      icon: '😊',
      color: 'sentiment',
      formatter: (val) => formatSentiment(val),
      sentiment: true
    },
    {
      key: 'news_mentions',
      label: 'News Coverage',
      value: currentMetrics.news_mentions,
      icon: '📰',
      color: 'purple',
      formatter: formatNumber
    },
    {
      key: 'news_sentiment',
      label: 'News Sentiment',
      value: currentMetrics.news_sentiment,
      icon: '📊',
      color: 'sentiment',
      formatter: (val) => formatSentiment(val),
      sentiment: true
    },
    {
      key: 'google_trends',
      label: 'Search Interest',
      value: currentMetrics.google_trends,
      icon: '📈',
      color: 'green',
      formatter: formatNumber
    }
  ];

  const getTrendIndicator = (metricKey) => {
    const trend = trends[metricKey];
    if (!trend || !showTrends) return null;

    const change = Number(trend.change) || 0;
    const isPositive = change > 0;
    const isNegative = change < 0;

    if (Math.abs(change) < 0.01) return null; // No significant change

    return (
      <div className={`flex items-center text-xs ml-2 ${
        isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'
      }`}>
        <span className={`mr-1 ${isPositive ? 'rotate-0' : 'rotate-180'}`}>
          {Math.abs(change) > 0.01 ? '📈' : '📊'}
        </span>
        <span className="font-medium">
          {isPositive ? '+' : ''}{formatPercentage(change, 0)}
        </span>
      </div>
    );
  };

  const getColorClasses = (color, sentiment = false, value = null) => {
    if (sentiment && value !== null) {
      return {
        bg: getSentimentBgColor(value),
        text: getSentimentColor(value),
        border: getSentimentColor(value).replace('text-', 'border-')
      };
    }

    const colorMap = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
      red: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
      green: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' }
    };

    return colorMap[color] || colorMap.blue;
  };

  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {metricItems.slice(0, 3).map((item) => {
          const colors = getColorClasses(item.color, item.sentiment, item.value);
          return (
            <div 
              key={item.key}
              className={`flex items-center px-2 py-1 rounded-md ${colors.bg} ${colors.text}`}
            >
              <span className="mr-1">{item.icon}</span>
              <span className="text-sm font-medium">{item.formatter(item.value)}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 ${className}`}>
        {metricItems.map((item) => {
          const colors = getColorClasses(item.color, item.sentiment, item.value);
          return (
            <div 
              key={item.key}
              className={`p-3 rounded-lg border ${colors.bg} ${colors.border} transition-all duration-200 hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{item.icon}</span>
                {getTrendIndicator(item.key)}
              </div>
              <div className={`text-xl font-bold ${colors.text}`}>
                {item.formatter(item.value)}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Default card variant
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="mr-2">📊</span>
          Current Metrics
        </h3>
        
        {showTrends && (
          <div className="flex rounded-md border border-gray-300 overflow-hidden">
            {periods.map((period) => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key)}
                className={`px-3 py-1 text-sm font-medium transition-colors duration-200 ${
                  selectedPeriod === period.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {metricItems.map((item) => {
          const colors = getColorClasses(item.color, item.sentiment, item.value);
          return (
            <div 
              key={item.key}
              className={`p-4 rounded-lg border-2 ${colors.bg} ${colors.border} transition-all duration-200 hover:shadow-md hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{item.icon}</span>
                {getTrendIndicator(item.key)}
              </div>
              
              <div className={`text-2xl font-bold mb-1 ${colors.text}`}>
                {item.formatter(item.value)}
              </div>
              
              <div className="text-sm text-gray-600">
                {item.label}
              </div>
              
              {/* Additional trend info */}
              {showTrends && trends[item.key] && (
                <div className="mt-2 text-xs text-gray-500">
                  vs {selectedPeriod} ago
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Last Updated */}
      {showLastUpdate && currentMetrics.last_updated && (
        <div className="flex items-center justify-center pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-500 flex items-center">
            <span className="mr-1">🕒</span>
            Last updated {formatRelativeTime(currentMetrics.last_updated)}
          </span>
        </div>
      )}

      {/* No data state */}
      {Object.values(currentMetrics).every(val => !val || val === 0) && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-gray-500">No metrics data available</div>
          <div className="text-sm text-gray-400 mt-1">
            Metrics will appear once data is collected
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsDisplay;