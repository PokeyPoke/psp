import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

export const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  
  const number = Number(num);
  
  if (number >= 1000000) {
    return (number / 1000000).toFixed(1) + 'M';
  }
  if (number >= 1000) {
    return (number / 1000).toFixed(1) + 'K';
  }
  return number.toString();
};

export const formatPercentage = (num, decimals = 1) => {
  if (num === null || num === undefined || isNaN(num)) return '0%';
  return (Number(num) * 100).toFixed(decimals) + '%';
};

export const formatSentiment = (score) => {
  if (score === null || score === undefined || isNaN(score)) return 'Neutral';
  
  const num = Number(score);
  if (num > 0.1) return 'Positive';
  if (num < -0.1) return 'Negative';
  return 'Neutral';
};

export const getSentimentColor = (score) => {
  if (score === null || score === undefined || isNaN(score)) return 'text-gray-500';
  
  const num = Number(score);
  if (num > 0.1) return 'text-green-600';
  if (num < -0.1) return 'text-red-600';
  return 'text-gray-500';
};

export const getSentimentBgColor = (score) => {
  if (score === null || score === undefined || isNaN(score)) return 'bg-gray-100';
  
  const num = Number(score);
  if (num > 0.1) return 'bg-green-100';
  if (num < -0.1) return 'bg-red-100';
  return 'bg-gray-100';
};

export const formatDate = (dateString, formatStr = 'MMM d, yyyy') => {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    if (!isValid(date)) return '';
    return format(date, formatStr);
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    if (!isValid(date)) return '';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Relative time formatting error:', error);
    return '';
  }
};

export const formatParty = (party) => {
  if (!party) return 'Independent';
  
  const partyMap = {
    'democratic': 'Democratic',
    'democrat': 'Democratic',
    'republican': 'Republican',
    'independent': 'Independent',
    'green': 'Green',
    'libertarian': 'Libertarian'
  };
  
  return partyMap[party.toLowerCase()] || party;
};

export const getPartyColor = (party) => {
  if (!party) return 'bg-gray-500';
  
  const colorMap = {
    'democratic': 'bg-blue-600',
    'democrat': 'bg-blue-600',
    'republican': 'bg-red-600',
    'independent': 'bg-green-600',
    'green': 'bg-green-700',
    'libertarian': 'bg-yellow-600'
  };
  
  return colorMap[party.toLowerCase()] || 'bg-gray-500';
};

export const getPartyTextColor = (party) => {
  if (!party) return 'text-gray-600';
  
  const colorMap = {
    'democratic': 'text-blue-600',
    'democrat': 'text-blue-600',
    'republican': 'text-red-600',
    'independent': 'text-green-600',
    'green': 'text-green-700',
    'libertarian': 'text-yellow-600'
  };
  
  return colorMap[party.toLowerCase()] || 'text-gray-600';
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength).trim() + '...';
};

export const generateInitials = (name) => {
  if (!name) return '??';
  
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  
  return words.map(word => word[0]).join('').substring(0, 2).toUpperCase();
};

export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const formatSocialHandle = (platform, handle) => {
  if (!handle) return '';
  
  // Remove @ symbol if present
  const cleanHandle = handle.replace('@', '');
  
  const baseUrls = {
    twitter: 'https://twitter.com/',
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/',
    linkedin: 'https://linkedin.com/in/',
    youtube: 'https://youtube.com/@',
    tiktok: 'https://tiktok.com/@'
  };
  
  const baseUrl = baseUrls[platform.toLowerCase()];
  return baseUrl ? baseUrl + cleanHandle : `@${cleanHandle}`;
};

export const getMetricIcon = (metric) => {
  const iconMap = {
    reddit_mentions: '💬',
    reddit_sentiment: '😊',
    google_trends: '📈',
    news_mentions: '📰',
    news_sentiment: '📊',
    vote_count: '🗳️'
  };
  
  return iconMap[metric] || '📊';
};

export const getMetricLabel = (metric) => {
  const labelMap = {
    reddit_mentions: 'Reddit Mentions',
    reddit_sentiment: 'Reddit Sentiment',
    google_trends: 'Google Trends',
    news_mentions: 'News Mentions',
    news_sentiment: 'News Sentiment',
    vote_count: 'Votes'
  };
  
  return labelMap[metric] || metric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const generateChartColors = (count) => {
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#22c55e', // green
    '#f59e0b', // yellow
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#6366f1', // indigo
  ];
  
  return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
};