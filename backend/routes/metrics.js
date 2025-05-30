const express = require('express');
const router = express.Router();
const Metrics = require('../models/Metrics');
const { setCache, getFromCache } = require('../services/cache');

router.get('/candidate/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;
    
    const cacheKey = `metrics:candidate:${id}:${days}`;
    let metrics = await getFromCache(cacheKey);
    
    if (!metrics) {
      metrics = await Metrics.findByCandidate(id, parseInt(days));
      await setCache(cacheKey, metrics, 600);
    }
    
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

router.get('/candidate/:id/timeseries/:metric', async (req, res) => {
  try {
    const { id, metric } = req.params;
    const { days = 30 } = req.query;
    
    const validMetrics = ['reddit_mentions', 'reddit_sentiment', 'google_trends', 'news_mentions', 'news_sentiment'];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({ error: 'Invalid metric type' });
    }
    
    const cacheKey = `metrics:timeseries:${id}:${metric}:${days}`;
    let data = await getFromCache(cacheKey);
    
    if (!data) {
      data = await Metrics.getTimeSeriesData(id, metric, parseInt(days));
      await setCache(cacheKey, data, 600);
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching time series data:', error);
    res.status(500).json({ error: 'Failed to fetch time series data' });
  }
});

router.get('/comparison/:metric', async (req, res) => {
  try {
    const { metric } = req.params;
    const { days = 7 } = req.query;
    
    const validMetrics = ['reddit_mentions', 'reddit_sentiment', 'google_trends', 'news_mentions', 'news_sentiment'];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({ error: 'Invalid metric type' });
    }
    
    const cacheKey = `metrics:comparison:${metric}:${days}`;
    let data = await getFromCache(cacheKey);
    
    if (!data) {
      data = await Metrics.getComparisonData(metric, parseInt(days));
      await setCache(cacheKey, data, 600);
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching comparison data:', error);
    res.status(500).json({ error: 'Failed to fetch comparison data' });
  }
});

router.get('/latest', async (req, res) => {
  try {
    const cacheKey = 'metrics:latest';
    let metrics = await getFromCache(cacheKey);
    
    if (!metrics) {
      metrics = await Metrics.getLatestMetrics();
      await setCache(cacheKey, metrics, 300);
    }
    
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching latest metrics:', error);
    res.status(500).json({ error: 'Failed to fetch latest metrics' });
  }
});

router.get('/summary/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const cacheKey = `metrics:summary:${id}`;
    let summary = await getFromCache(cacheKey);
    
    if (!summary) {
      summary = await Metrics.getSummaryStats(id);
      await setCache(cacheKey, summary, 3600);
    }
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching summary stats:', error);
    res.status(500).json({ error: 'Failed to fetch summary stats' });
  }
});

router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    const cacheKey = `metrics:date:${date}`;
    let metrics = await getFromCache(cacheKey);
    
    if (!metrics) {
      metrics = await Metrics.findByDate(date);
      await setCache(cacheKey, metrics, 3600);
    }
    
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics by date:', error);
    res.status(500).json({ error: 'Failed to fetch metrics by date' });
  }
});

module.exports = router;