const { getDB } = require('./database');

class Candidate {
  static async findAll() {
    const db = getDB();
    const result = await db.query(`
      SELECT c.*, 
             COUNT(v.id) as vote_count,
             COALESCE(
               (SELECT row_to_json(latest_metrics) 
                FROM (
                  SELECT reddit_mentions, reddit_sentiment, 
                         google_trends_score, news_mentions, news_sentiment
                  FROM metrics 
                  WHERE candidate_id = c.id 
                  ORDER BY date DESC 
                  LIMIT 1
                ) latest_metrics), 
                '{}'::json
             ) as latest_metrics
      FROM candidates c
      LEFT JOIN votes v ON c.id = v.candidate_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);
    
    return result.rows.map(row => ({
      ...row,
      social_links: typeof row.social_links === 'string' 
        ? JSON.parse(row.social_links) 
        : row.social_links,
      latest_metrics: typeof row.latest_metrics === 'string'
        ? JSON.parse(row.latest_metrics)
        : row.latest_metrics,
      vote_count: parseInt(row.vote_count) || 0
    }));
  }

  static async findById(id) {
    const db = getDB();
    const result = await db.query(`
      SELECT c.*, 
             COUNT(v.id) as vote_count
      FROM candidates c
      LEFT JOIN votes v ON c.id = v.candidate_id
      WHERE c.id = $1
      GROUP BY c.id
    `, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const candidate = result.rows[0];
    return {
      ...candidate,
      social_links: typeof candidate.social_links === 'string' 
        ? JSON.parse(candidate.social_links) 
        : candidate.social_links,
      vote_count: parseInt(candidate.vote_count) || 0
    };
  }

  static async create(candidateData) {
    const db = getDB();
    const { name, bio, party, photo_url, campaign_link, social_links } = candidateData;
    
    const result = await db.query(`
      INSERT INTO candidates (name, bio, party, photo_url, campaign_link, social_links)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, bio, party, photo_url, campaign_link, JSON.stringify(social_links || {})]);
    
    const candidate = result.rows[0];
    return {
      ...candidate,
      social_links: typeof candidate.social_links === 'string' 
        ? JSON.parse(candidate.social_links) 
        : candidate.social_links
    };
  }

  static async update(id, candidateData) {
    const db = getDB();
    const { name, bio, party, photo_url, campaign_link, social_links } = candidateData;
    
    const result = await db.query(`
      UPDATE candidates 
      SET name = $1, bio = $2, party = $3, photo_url = $4, 
          campaign_link = $5, social_links = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [name, bio, party, photo_url, campaign_link, JSON.stringify(social_links || {}), id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const candidate = result.rows[0];
    return {
      ...candidate,
      social_links: typeof candidate.social_links === 'string' 
        ? JSON.parse(candidate.social_links) 
        : candidate.social_links
    };
  }

  static async delete(id) {
    const db = getDB();
    const result = await db.query('DELETE FROM candidates WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0;
  }

  static async getMetrics(id, days = 30) {
    const db = getDB();
    const result = await db.query(`
      SELECT * FROM metrics 
      WHERE candidate_id = $1 
        AND date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY date ASC
    `, [id]);
    
    return result.rows;
  }

  static async getLeaderboard(metric = 'vote_count') {
    const db = getDB();
    let query;
    
    switch (metric) {
      case 'reddit_mentions':
        query = `
          SELECT c.*, COALESCE(SUM(m.reddit_mentions), 0) as total_reddit_mentions
          FROM candidates c
          LEFT JOIN metrics m ON c.id = m.candidate_id
          GROUP BY c.id
          ORDER BY total_reddit_mentions DESC
        `;
        break;
      case 'news_mentions':
        query = `
          SELECT c.*, COALESCE(SUM(m.news_mentions), 0) as total_news_mentions
          FROM candidates c
          LEFT JOIN metrics m ON c.id = m.candidate_id
          GROUP BY c.id
          ORDER BY total_news_mentions DESC
        `;
        break;
      case 'google_trends':
        query = `
          SELECT c.*, COALESCE(AVG(m.google_trends_score), 0) as avg_trends_score
          FROM candidates c
          LEFT JOIN metrics m ON c.id = m.candidate_id
          GROUP BY c.id
          ORDER BY avg_trends_score DESC
        `;
        break;
      default: // vote_count
        query = `
          SELECT c.*, COUNT(v.id) as vote_count
          FROM candidates c
          LEFT JOIN votes v ON c.id = v.candidate_id
          GROUP BY c.id
          ORDER BY vote_count DESC
        `;
    }
    
    const result = await db.query(query);
    return result.rows.map(row => ({
      ...row,
      social_links: typeof row.social_links === 'string' 
        ? JSON.parse(row.social_links) 
        : row.social_links
    }));
  }
}

module.exports = Candidate;