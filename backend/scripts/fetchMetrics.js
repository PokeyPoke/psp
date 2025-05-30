require('dotenv').config();
const { connectDB } = require('../models/database');
const { connectRedis } = require('../services/cache');
const Candidate = require('../models/Candidate');
const Metrics = require('../models/Metrics');
const redditService = require('../services/redditService');
const googleTrendsService = require('../services/googleTrendsService');
const newsService = require('../services/newsService');

class MetricsFetcher {
  constructor() {
    this.startTime = new Date();
    this.results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    };
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    console.log(logMessage);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchCandidateMetrics(candidate) {
    const candidateName = candidate.name;
    this.log(`Starting metrics fetch for: ${candidateName}`);

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [redditMetrics, trendsMetrics, newsMetrics] = await Promise.allSettled([
        this.fetchRedditMetrics(candidateName),
        this.fetchGoogleTrendsMetrics(candidateName),
        this.fetchNewsMetrics(candidateName)
      ]);

      const metricsData = {
        candidate_id: candidate.id,
        date: today,
        reddit_mentions: redditMetrics.status === 'fulfilled' ? redditMetrics.value.mentions : 0,
        reddit_sentiment: redditMetrics.status === 'fulfilled' ? redditMetrics.value.sentiment : 0,
        google_trends_score: trendsMetrics.status === 'fulfilled' ? trendsMetrics.value.trendsScore : 0,
        news_mentions: newsMetrics.status === 'fulfilled' ? newsMetrics.value.mentions : 0,
        news_sentiment: newsMetrics.status === 'fulfilled' ? newsMetrics.value.sentiment : 0
      };

      const savedMetrics = await Metrics.create(metricsData);
      
      this.log(`✅ Successfully saved metrics for ${candidateName}: Reddit(${metricsData.reddit_mentions}), Trends(${metricsData.google_trends_score}), News(${metricsData.news_mentions})`);
      
      this.results.successful++;
      return savedMetrics;

    } catch (error) {
      this.log(`❌ Failed to fetch metrics for ${candidateName}: ${error.message}`, 'error');
      this.results.errors.push({
        candidate: candidateName,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      this.results.failed++;
      return null;
    }
  }

  async fetchRedditMetrics(candidateName) {
    try {
      this.log(`  Fetching Reddit metrics for ${candidateName}...`);
      const metrics = await redditService.getCandidateMetrics(candidateName, {
        subreddit: 'politics',
        timeframe: 'day',
        includeComments: true
      });
      
      await this.delay(1000);
      return metrics;
    } catch (error) {
      this.log(`  Reddit fetch failed for ${candidateName}: ${error.message}`, 'warn');
      return { mentions: 0, sentiment: 0 };
    }
  }

  async fetchGoogleTrendsMetrics(candidateName) {
    try {
      this.log(`  Fetching Google Trends for ${candidateName}...`);
      const metrics = await googleTrendsService.getCandidateMetrics(candidateName, {
        geo: 'US',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      });
      
      await this.delay(2000);
      return metrics;
    } catch (error) {
      this.log(`  Google Trends fetch failed for ${candidateName}: ${error.message}`, 'warn');
      return { trendsScore: 0, averageScore: 0 };
    }
  }

  async fetchNewsMetrics(candidateName) {
    try {
      this.log(`  Fetching News metrics for ${candidateName}...`);
      const metrics = await newsService.getCandidateMetrics(candidateName, {
        days: 1,
        language: 'en'
      });
      
      await this.delay(1000);
      return metrics;
    } catch (error) {
      this.log(`  News fetch failed for ${candidateName}: ${error.message}`, 'warn');
      return { mentions: 0, sentiment: 0 };
    }
  }

  async run() {
    try {
      this.log('🚀 Starting daily metrics fetch job...');
      
      await connectDB();
      this.log('✅ Database connected');
      
      await connectRedis();
      this.log('✅ Redis connected');
      
      const candidates = await Candidate.findAll();
      this.log(`📊 Found ${candidates.length} candidates to process`);
      
      if (candidates.length === 0) {
        this.log('⚠️  No candidates found in database');
        return;
      }

      for (const candidate of candidates) {
        this.results.processed++;
        await this.fetchCandidateMetrics(candidate);
        
        await this.delay(3000);
      }

      const duration = Date.now() - this.startTime.getTime();
      const durationMinutes = Math.round(duration / 60000 * 100) / 100;

      this.log('🎉 Metrics fetch job completed!');
      this.log(`📈 Results: ${this.results.successful} successful, ${this.results.failed} failed out of ${this.results.processed} processed`);
      this.log(`⏱️  Total duration: ${durationMinutes} minutes`);

      if (this.results.errors.length > 0) {
        this.log('❌ Errors encountered:', 'warn');
        this.results.errors.forEach(error => {
          this.log(`  - ${error.candidate}: ${error.error}`, 'warn');
        });
      }

      if (!newsService.isConfigured()) {
        this.log('⚠️  News API not configured - news metrics will be 0', 'warn');
      }

    } catch (error) {
      this.log(`💥 Critical error in metrics fetch job: ${error.message}`, 'error');
      console.error(error.stack);
      process.exit(1);
    }
  }
}

async function runDailyFetch() {
  const fetcher = new MetricsFetcher();
  
  process.on('SIGTERM', () => {
    fetcher.log('📤 Received SIGTERM, gracefully shutting down...');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    fetcher.log('📤 Received SIGINT, gracefully shutting down...');
    process.exit(0);
  });

  process.on('unhandledRejection', (reason, promise) => {
    fetcher.log(`💥 Unhandled Rejection at: ${promise}, reason: ${reason}`, 'error');
    process.exit(1);
  });

  await fetcher.run();
  process.exit(0);
}

if (require.main === module) {
  runDailyFetch();
}

module.exports = { MetricsFetcher, runDailyFetch };