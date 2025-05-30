import React, { useState } from 'react';
import { useVote } from '../contexts/VoteContext';
import LoadingSpinner from './LoadingSpinner';
import { formatNumber } from '../utils/formatters';

const VoteButton = ({ 
  candidateId, 
  candidateName = '',
  variant = 'primary',
  size = 'md',
  showCount = true,
  className = '',
  disabled = false 
}) => {
  const { hasVoted, voteForCandidate, removeVote, getVoteCount, loading } = useVote();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const voted = hasVoted(candidateId);
  const voteCount = getVoteCount(candidateId);
  const isLoading = loading;

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const baseClasses = `
    inline-flex items-center justify-center
    font-semibold rounded-lg
    transition-all duration-200 ease-in-out
    transform hover:scale-105 active:scale-95
    focus:outline-none focus:ring-4
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    ${sizeClasses[size]}
  `;

  const variantClasses = {
    primary: voted
      ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg focus:ring-green-300'
      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg focus:ring-blue-300',
    secondary: voted
      ? 'bg-green-100 hover:bg-green-200 text-green-800 border-2 border-green-300 focus:ring-green-300'
      : 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-2 border-blue-300 focus:ring-blue-300',
    outline: voted
      ? 'border-2 border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-300'
      : 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-300'
  };

  const handleVote = async () => {
    if (isLoading || disabled) return;

    setIsAnimating(true);
    
    try {
      let success;
      if (voted) {
        success = await removeVote(candidateId);
      } else {
        success = await voteForCandidate(candidateId);
        if (success) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 1000);
        }
      }
    } finally {
      setTimeout(() => setIsAnimating(false), 200);
    }
  };

  const buttonContent = () => {
    if (isLoading) {
      return (
        <>
          <LoadingSpinner size="sm" color="white" />
          <span className="ml-2">
            {voted ? 'Removing...' : 'Voting...'}
          </span>
        </>
      );
    }

    return (
      <>
        {/* Vote Icon */}
        <span className={`transition-transform duration-200 ${isAnimating ? 'scale-110' : ''}`}>
          {voted ? '✅' : '🗳️'}
        </span>
        
        {/* Button Text */}
        <span className="ml-2">
          {voted ? 'Voted' : 'Vote'}
        </span>
        
        {/* Vote Count */}
        {showCount && (
          <span className={`ml-2 font-bold ${voted ? 'text-green-200' : 'text-blue-200'}`}>
            ({formatNumber(voteCount)})
          </span>
        )}
        
        {/* Confetti Effect */}
        {showConfetti && (
          <span className="absolute -top-2 -right-2 animate-bounce text-yellow-400">
            ✨
          </span>
        )}
      </>
    );
  };

  return (
    <div className="relative">
      <button
        onClick={handleVote}
        disabled={isLoading || disabled}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${className}
          ${isAnimating ? 'animate-pulse' : ''}
          relative overflow-hidden
        `}
        title={voted 
          ? `Remove vote for ${candidateName}` 
          : `Vote for ${candidateName}`
        }
        aria-label={voted 
          ? `Remove vote for ${candidateName}. Current votes: ${voteCount}` 
          : `Vote for ${candidateName}. Current votes: ${voteCount}`
        }
      >
        {buttonContent()}
        
        {/* Ripple effect on click */}
        <div 
          className={`
            absolute inset-0 bg-white opacity-0 rounded-lg
            ${isAnimating ? 'animate-ping opacity-20' : ''}
          `}
        />
      </button>
      
      {/* Vote count tooltip for mobile */}
      {showCount && (
        <div className="md:hidden absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
            {formatNumber(voteCount)} votes
          </span>
        </div>
      )}
    </div>
  );
};

export default VoteButton;