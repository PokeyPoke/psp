import React, { createContext, useContext, useState, useEffect } from 'react';
import { voteService } from '../services/api';
import toast from 'react-hot-toast';

const VoteContext = createContext();

export const useVote = () => {
  const context = useContext(VoteContext);
  if (!context) {
    throw new Error('useVote must be used within a VoteProvider');
  }
  return context;
};

export const VoteProvider = ({ children }) => {
  const [sessionVotes, setSessionVotes] = useState([]);
  const [voteCounts, setVoteCounts] = useState({});
  const [loading, setLoading] = useState(false);

  const loadSessionVotes = async () => {
    try {
      const votes = await voteService.getSessionVotes();
      setSessionVotes(votes);
      
      // Update local storage
      const voteMap = {};
      votes.forEach(vote => {
        voteMap[vote.candidate_id] = true;
      });
      localStorage.setItem('userVotes', JSON.stringify(voteMap));
    } catch (error) {
      console.error('Error loading session votes:', error);
    }
  };

  const loadVoteCounts = async () => {
    try {
      const counts = await voteService.getVoteCounts();
      const countMap = {};
      counts.forEach(candidate => {
        countMap[candidate.id] = candidate.vote_count;
      });
      setVoteCounts(countMap);
    } catch (error) {
      console.error('Error loading vote counts:', error);
    }
  };

  const hasVoted = (candidateId) => {
    const localVotes = JSON.parse(localStorage.getItem('userVotes') || '{}');
    return localVotes[candidateId] || sessionVotes.some(vote => vote.candidate_id === candidateId);
  };

  const voteForCandidate = async (candidateId) => {
    if (hasVoted(candidateId)) {
      toast.error('You have already voted for this candidate!');
      return false;
    }

    setLoading(true);
    try {
      await voteService.vote(candidateId);
      
      // Update local state
      const newVote = {
        candidate_id: candidateId,
        created_at: new Date().toISOString()
      };
      setSessionVotes(prev => [...prev, newVote]);
      
      // Update local storage
      const localVotes = JSON.parse(localStorage.getItem('userVotes') || '{}');
      localVotes[candidateId] = true;
      localStorage.setItem('userVotes', JSON.stringify(localVotes));
      
      // Update vote count
      setVoteCounts(prev => ({
        ...prev,
        [candidateId]: (prev[candidateId] || 0) + 1
      }));
      
      toast.success('Vote recorded successfully!');
      return true;
    } catch (error) {
      console.error('Error voting:', error);
      toast.error(error.response?.data?.error || 'Failed to record vote');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeVote = async (candidateId) => {
    if (!hasVoted(candidateId)) {
      toast.error('You have not voted for this candidate!');
      return false;
    }

    setLoading(true);
    try {
      await voteService.removeVote(candidateId);
      
      // Update local state
      setSessionVotes(prev => prev.filter(vote => vote.candidate_id !== candidateId));
      
      // Update local storage
      const localVotes = JSON.parse(localStorage.getItem('userVotes') || '{}');
      delete localVotes[candidateId];
      localStorage.setItem('userVotes', JSON.stringify(localVotes));
      
      // Update vote count
      setVoteCounts(prev => ({
        ...prev,
        [candidateId]: Math.max(0, (prev[candidateId] || 0) - 1)
      }));
      
      toast.success('Vote removed successfully!');
      return true;
    } catch (error) {
      console.error('Error removing vote:', error);
      toast.error(error.response?.data?.error || 'Failed to remove vote');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getVoteCount = (candidateId) => {
    return voteCounts[candidateId] || 0;
  };

  useEffect(() => {
    loadSessionVotes();
    loadVoteCounts();
  }, []);

  const value = {
    sessionVotes,
    voteCounts,
    loading,
    hasVoted,
    voteForCandidate,
    removeVote,
    getVoteCount,
    loadVoteCounts,
    loadSessionVotes
  };

  return (
    <VoteContext.Provider value={value}>
      {children}
    </VoteContext.Provider>
  );
};