const express = require('express');
const router = express.Router();
const Vote = require('../models/Vote');
const { setCache, getFromCache, deleteFromCache } = require('../services/cache');
const crypto = require('crypto');

const generateSessionId = (req) => {
  const sessionData = req.ip + req.get('User-Agent') + Date.now();
  return crypto.createHash('md5').update(sessionData).digest('hex');
};

router.post('/:candidateId', async (req, res) => {
  try {
    const { candidateId } = req.params;
    const sessionId = req.session.id || generateSessionId(req);
    
    if (!req.session.id) {
      req.session.id = sessionId;
    }
    
    const hasVoted = await Vote.hasVoted(candidateId, sessionId);
    if (hasVoted) {
      return res.status(400).json({ error: 'You have already voted for this candidate' });
    }
    
    const voteData = {
      candidate_id: candidateId,
      session_id: sessionId,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    };
    
    const vote = await Vote.create(voteData);
    
    await deleteFromCache('votes:counts');
    await deleteFromCache(`votes:session:${sessionId}`);
    await deleteFromCache('candidates:all');
    await deleteFromCache(`candidate:${candidateId}`);
    
    res.status(201).json({ 
      message: 'Vote recorded successfully',
      vote: {
        id: vote.id,
        candidate_id: vote.candidate_id,
        created_at: vote.created_at
      }
    });
  } catch (error) {
    console.error('Error recording vote:', error);
    
    if (error.message.includes('already voted')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

router.get('/counts', async (req, res) => {
  try {
    const cacheKey = 'votes:counts';
    let voteCounts = await getFromCache(cacheKey);
    
    if (!voteCounts) {
      voteCounts = await Vote.getVoteCounts();
      await setCache(cacheKey, voteCounts, 300);
    }
    
    res.json(voteCounts);
  } catch (error) {
    console.error('Error fetching vote counts:', error);
    res.status(500).json({ error: 'Failed to fetch vote counts' });
  }
});

router.get('/recent/:hours?', async (req, res) => {
  try {
    const hours = parseInt(req.params.hours) || 24;
    const cacheKey = `votes:recent:${hours}`;
    
    let recentVotes = await getFromCache(cacheKey);
    
    if (!recentVotes) {
      recentVotes = await Vote.getVotesByTime(hours);
      await setCache(cacheKey, recentVotes, 300);
    }
    
    res.json(recentVotes);
  } catch (error) {
    console.error('Error fetching recent votes:', error);
    res.status(500).json({ error: 'Failed to fetch recent votes' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const cacheKey = 'votes:stats';
    let stats = await getFromCache(cacheKey);
    
    if (!stats) {
      stats = await Vote.getVoteStats();
      await setCache(cacheKey, stats, 600);
    }
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching vote stats:', error);
    res.status(500).json({ error: 'Failed to fetch vote stats' });
  }
});

router.get('/session', async (req, res) => {
  try {
    const sessionId = req.session.id;
    
    if (!sessionId) {
      return res.json([]);
    }
    
    const cacheKey = `votes:session:${sessionId}`;
    let sessionVotes = await getFromCache(cacheKey);
    
    if (!sessionVotes) {
      sessionVotes = await Vote.findBySession(sessionId);
      await setCache(cacheKey, sessionVotes, 600);
    }
    
    res.json(sessionVotes);
  } catch (error) {
    console.error('Error fetching session votes:', error);
    res.status(500).json({ error: 'Failed to fetch session votes' });
  }
});

router.delete('/:candidateId', async (req, res) => {
  try {
    const { candidateId } = req.params;
    const sessionId = req.session.id;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'No session found' });
    }
    
    const hasVoted = await Vote.hasVoted(candidateId, sessionId);
    if (!hasVoted) {
      return res.status(404).json({ error: 'Vote not found' });
    }
    
    const removed = await Vote.removeVote(candidateId, sessionId);
    
    if (removed) {
      await deleteFromCache('votes:counts');
      await deleteFromCache(`votes:session:${sessionId}`);
      await deleteFromCache('candidates:all');
      await deleteFromCache(`candidate:${candidateId}`);
      
      res.json({ message: 'Vote removed successfully' });
    } else {
      res.status(404).json({ error: 'Vote not found' });
    }
  } catch (error) {
    console.error('Error removing vote:', error);
    res.status(500).json({ error: 'Failed to remove vote' });
  }
});

router.get('/candidate/:candidateId', async (req, res) => {
  try {
    const { candidateId } = req.params;
    const cacheKey = `votes:candidate:${candidateId}`;
    
    let voteCount = await getFromCache(cacheKey);
    
    if (voteCount === null) {
      voteCount = await Vote.findByCandidate(candidateId);
      await setCache(cacheKey, voteCount, 300);
    }
    
    res.json({ candidate_id: candidateId, vote_count: voteCount });
  } catch (error) {
    console.error('Error fetching candidate votes:', error);
    res.status(500).json({ error: 'Failed to fetch candidate votes' });
  }
});

module.exports = router;