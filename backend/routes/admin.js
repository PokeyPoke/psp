const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');
const Metrics = require('../models/Metrics');
const Vote = require('../models/Vote');
const { adminAuth, authenticate, logout, checkAuthStatus } = require('../middleware/auth');
const { deleteFromCache } = require('../services/cache');
const validator = require('validator');

router.post('/login', authenticate);
router.post('/logout', logout);
router.get('/status', checkAuthStatus);

router.use(adminAuth);

router.get('/dashboard', async (req, res) => {
  try {
    const candidates = await Candidate.findAll();
    const voteStats = await Vote.getVoteStats();
    const latestMetrics = await Metrics.getLatestMetrics();
    
    const dashboardData = {
      candidates: {
        total: candidates.length,
        list: candidates
      },
      votes: voteStats,
      metrics: {
        latest: latestMetrics,
        totalDataPoints: latestMetrics.length
      },
      lastUpdated: new Date().toISOString()
    };
    
    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

router.post('/candidates', async (req, res) => {
  try {
    const { name, bio, party, photo_url, campaign_link, social_links } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Candidate name is required' });
    }
    
    if (photo_url && !validator.isURL(photo_url)) {
      return res.status(400).json({ error: 'Invalid photo URL' });
    }
    
    if (campaign_link && !validator.isURL(campaign_link)) {
      return res.status(400).json({ error: 'Invalid campaign link URL' });
    }
    
    const candidateData = {
      name: name.trim(),
      bio: bio?.trim() || '',
      party: party?.trim() || '',
      photo_url: photo_url?.trim() || null,
      campaign_link: campaign_link?.trim() || null,
      social_links: social_links || {}
    };
    
    const candidate = await Candidate.create(candidateData);
    
    await deleteFromCache('candidates:all');
    
    res.status(201).json(candidate);
  } catch (error) {
    console.error('Error creating candidate:', error);
    
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Candidate with this name already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create candidate' });
  }
});

router.put('/candidates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bio, party, photo_url, campaign_link, social_links } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Candidate name is required' });
    }
    
    if (photo_url && !validator.isURL(photo_url)) {
      return res.status(400).json({ error: 'Invalid photo URL' });
    }
    
    if (campaign_link && !validator.isURL(campaign_link)) {
      return res.status(400).json({ error: 'Invalid campaign link URL' });
    }
    
    const candidateData = {
      name: name.trim(),
      bio: bio?.trim() || '',
      party: party?.trim() || '',
      photo_url: photo_url?.trim() || null,
      campaign_link: campaign_link?.trim() || null,
      social_links: social_links || {}
    };
    
    const candidate = await Candidate.update(id, candidateData);
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    await deleteFromCache('candidates:all');
    await deleteFromCache(`candidate:${id}`);
    
    res.json(candidate);
  } catch (error) {
    console.error('Error updating candidate:', error);
    
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Candidate with this name already exists' });
    }
    
    res.status(500).json({ error: 'Failed to update candidate' });
  }
});

router.delete('/candidates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await Candidate.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    await deleteFromCache('candidates:all');
    await deleteFromCache(`candidate:${id}`);
    
    res.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
});

router.post('/metrics', async (req, res) => {
  try {
    const {
      candidate_id,
      date,
      reddit_mentions,
      reddit_sentiment,
      google_trends_score,
      news_mentions,
      news_sentiment
    } = req.body;
    
    if (!candidate_id || !date) {
      return res.status(400).json({ error: 'Candidate ID and date are required' });
    }
    
    if (!validator.isDate(date)) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    
    const metricsData = {
      candidate_id,
      date,
      reddit_mentions: reddit_mentions || 0,
      reddit_sentiment: reddit_sentiment || 0,
      google_trends_score: google_trends_score || 0,
      news_mentions: news_mentions || 0,
      news_sentiment: news_sentiment || 0
    };
    
    const metrics = await Metrics.create(metricsData);
    
    await deleteFromCache(`metrics:candidate:${candidate_id}:30`);
    await deleteFromCache('metrics:latest');
    
    res.status(201).json(metrics);
  } catch (error) {
    console.error('Error creating metrics:', error);
    res.status(500).json({ error: 'Failed to create metrics' });
  }
});

router.delete('/metrics/:candidateId/:date', async (req, res) => {
  try {
    const { candidateId, date } = req.params;
    
    const deleted = await Metrics.delete(candidateId, date);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Metrics not found' });
    }
    
    await deleteFromCache(`metrics:candidate:${candidateId}:30`);
    await deleteFromCache('metrics:latest');
    
    res.json({ message: 'Metrics deleted successfully' });
  } catch (error) {
    console.error('Error deleting metrics:', error);
    res.status(500).json({ error: 'Failed to delete metrics' });
  }
});

router.get('/votes/analytics', async (req, res) => {
  try {
    const stats = await Vote.getVoteStats();
    const recent = await Vote.getVotesByTime(24);
    const counts = await Vote.getVoteCounts();
    
    res.json({
      stats,
      recent,
      counts
    });
  } catch (error) {
    console.error('Error fetching vote analytics:', error);
    res.status(500).json({ error: 'Failed to fetch vote analytics' });
  }
});

router.delete('/cleanup/old-data', async (req, res) => {
  try {
    const { daysToKeep = 365 } = req.query;
    
    const metricsDeleted = await Metrics.deleteOldMetrics(parseInt(daysToKeep));
    const votesDeleted = await Vote.cleanupOldVotes(parseInt(daysToKeep));
    
    res.json({
      message: 'Cleanup completed',
      deleted: {
        metrics: metricsDeleted,
        votes: votesDeleted
      }
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ error: 'Failed to cleanup old data' });
  }
});

module.exports = router;