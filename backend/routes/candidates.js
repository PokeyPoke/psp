const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');
const { setCache, getFromCache, deleteFromCache } = require('../services/cache');

router.get('/', async (req, res) => {
  try {
    const cacheKey = 'candidates:all';
    let candidates = await getFromCache(cacheKey);
    
    if (!candidates) {
      candidates = await Candidate.findAll();
      await setCache(cacheKey, candidates, 300);
    }
    
    res.json(candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch candidates',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `candidate:${id}`;
    
    let candidate = await getFromCache(cacheKey);
    
    if (!candidate) {
      candidate = await Candidate.findById(id);
      if (candidate) {
        await setCache(cacheKey, candidate, 300);
      }
    }
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    res.json(candidate);
  } catch (error) {
    console.error('Error fetching candidate:', error);
    res.status(500).json({ error: 'Failed to fetch candidate' });
  }
});

router.get('/:id/metrics', async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;
    
    const cacheKey = `candidate:${id}:metrics:${days}`;
    let metrics = await getFromCache(cacheKey);
    
    if (!metrics) {
      metrics = await Candidate.getMetrics(id, parseInt(days));
      await setCache(cacheKey, metrics, 600);
    }
    
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching candidate metrics:', error);
    res.status(500).json({ error: 'Failed to fetch candidate metrics' });
  }
});

router.get('/leaderboard/:metric', async (req, res) => {
  try {
    const { metric } = req.params;
    const validMetrics = ['vote_count', 'reddit_mentions', 'news_mentions', 'google_trends'];
    
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({ error: 'Invalid metric type' });
    }
    
    const cacheKey = `leaderboard:${metric}`;
    let leaderboard = await getFromCache(cacheKey);
    
    if (!leaderboard) {
      leaderboard = await Candidate.getLeaderboard(metric);
      await setCache(cacheKey, leaderboard, 300);
    }
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;