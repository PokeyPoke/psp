const { getDB } = require('./database');

class Metrics {
  static async create(metricsData) {
    const db = getDB();
    const {
      candidate_id,
      date,
      reddit_mentions = 0,
      reddit_sentiment = 0,
      google_trends_score = 0,
      news_mentions = 0,
      news_sentiment = 0
    } = metricsData;

    const result = await db.query(`
      INSERT INTO metrics 
      (candidate_id, date, reddit_mentions, reddit_sentiment, 
       google_trends_score, news_mentions, news_sentiment)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (candidate_id, date) 
      DO UPDATE SET
        reddit_mentions = EXCLUDED.reddit_mentions,
        reddit_sentiment = EXCLUDED.reddit_sentiment,
        google_trends_score = EXCLUDED.google_trends_score,
        news_mentions = EXCLUDED.news_mentions,
        news_sentiment = EXCLUDED.news_sentiment
      RETURNING *
    `, [candidate_id, date, reddit_mentions, reddit_sentiment, 
        google_trends_score, news_mentions, news_sentiment]);

    return result.rows[0];
  }

  static async findByCandidate(candidateId, days = 30) {
    const db = getDB();
    const result = await db.query(`
      SELECT * FROM metrics 
      WHERE candidate_id = $1 
        AND date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY date ASC
    `, [candidateId]);

    return result.rows;
  }

  static async findByDate(date) {
    const db = getDB();
    const result = await db.query(`
      SELECT m.*, c.name as candidate_name
      FROM metrics m
      JOIN candidates c ON m.candidate_id = c.id
      WHERE m.date = $1
      ORDER BY c.name ASC
    `, [date]);

    return result.rows;
  }

  static async getTimeSeriesData(candidateId, metric, days = 30) {
    const db = getDB();
    let column;
    
    switch (metric) {
      case 'reddit_mentions':
        column = 'reddit_mentions';
        break;
      case 'reddit_sentiment':
        column = 'reddit_sentiment';
        break;
      case 'google_trends':
        column = 'google_trends_score';
        break;
      case 'news_mentions':
        column = 'news_mentions';
        break;
      case 'news_sentiment':
        column = 'news_sentiment';
        break;
      default:
        throw new Error('Invalid metric type');
    }

    const result = await db.query(`
      SELECT date, ${column} as value
      FROM metrics 
      WHERE candidate_id = $1 
        AND date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY date ASC
    `, [candidateId]);

    return result.rows;
  }

  static async getComparisonData(metric, days = 7) {
    const db = getDB();
    let column;
    
    switch (metric) {
      case 'reddit_mentions':
        column = 'SUM(reddit_mentions)';
        break;
      case 'reddit_sentiment':
        column = 'AVG(reddit_sentiment)';
        break;
      case 'google_trends':
        column = 'AVG(google_trends_score)';
        break;
      case 'news_mentions':
        column = 'SUM(news_mentions)';
        break;
      case 'news_sentiment':
        column = 'AVG(news_sentiment)';
        break;
      default:
        throw new Error('Invalid metric type');
    }

    const result = await db.query(`
      SELECT c.id, c.name, c.party, 
             COALESCE(${column}, 0) as value
      FROM candidates c
      LEFT JOIN metrics m ON c.id = m.candidate_id 
        AND m.date >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY c.id, c.name, c.party
      ORDER BY value DESC
    `);

    return result.rows;
  }

  static async getLatestMetrics() {
    const db = getDB();
    const result = await db.query(`
      SELECT DISTINCT ON (m.candidate_id) 
             m.*, c.name as candidate_name, c.party
      FROM metrics m
      JOIN candidates c ON m.candidate_id = c.id
      ORDER BY m.candidate_id, m.date DESC
    `);

    return result.rows;
  }

  static async getSummaryStats(candidateId) {
    const db = getDB();
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_days,
        AVG(reddit_mentions) as avg_reddit_mentions,
        AVG(reddit_sentiment) as avg_reddit_sentiment,
        AVG(google_trends_score) as avg_google_trends,
        AVG(news_mentions) as avg_news_mentions,
        AVG(news_sentiment) as avg_news_sentiment,
        MAX(reddit_mentions) as peak_reddit_mentions,
        MAX(google_trends_score) as peak_google_trends,
        MAX(news_mentions) as peak_news_mentions
      FROM metrics 
      WHERE candidate_id = $1
    `, [candidateId]);

    return result.rows[0];
  }

  static async delete(candidateId, date) {
    const db = getDB();
    const result = await db.query(
      'DELETE FROM metrics WHERE candidate_id = $1 AND date = $2 RETURNING *',
      [candidateId, date]
    );
    
    return result.rows.length > 0;
  }

  static async deleteOldMetrics(daysToKeep = 365) {
    const db = getDB();
    const result = await db.query(`
      DELETE FROM metrics 
      WHERE date < CURRENT_DATE - INTERVAL '${daysToKeep} days'
      RETURNING COUNT(*)
    `);
    
    return result.rows[0];
  }
}

module.exports = Metrics;