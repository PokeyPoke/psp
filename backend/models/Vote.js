const { getDB } = require('./database');

class Vote {
  static async create(voteData) {
    const db = getDB();
    const { candidate_id, session_id, ip_address, user_agent } = voteData;

    const existingVote = await db.query(
      'SELECT id FROM votes WHERE candidate_id = $1 AND session_id = $2',
      [candidate_id, session_id]
    );

    if (existingVote.rows.length > 0) {
      throw new Error('User has already voted for this candidate');
    }

    const result = await db.query(`
      INSERT INTO votes (candidate_id, session_id, ip_address, user_agent)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [candidate_id, session_id, ip_address, user_agent]);

    return result.rows[0];
  }

  static async findByCandidate(candidateId) {
    const db = getDB();
    const result = await db.query(`
      SELECT COUNT(*) as vote_count
      FROM votes 
      WHERE candidate_id = $1
    `, [candidateId]);

    return parseInt(result.rows[0].vote_count) || 0;
  }

  static async findBySession(sessionId) {
    const db = getDB();
    const result = await db.query(`
      SELECT v.*, c.name as candidate_name
      FROM votes v
      JOIN candidates c ON v.candidate_id = c.id
      WHERE v.session_id = $1
      ORDER BY v.created_at DESC
    `, [sessionId]);

    return result.rows;
  }

  static async hasVoted(candidateId, sessionId) {
    const db = getDB();
    const result = await db.query(
      'SELECT id FROM votes WHERE candidate_id = $1 AND session_id = $2',
      [candidateId, sessionId]
    );

    return result.rows.length > 0;
  }

  static async getVoteCounts() {
    const db = getDB();
    const result = await db.query(`
      SELECT c.id, c.name, c.party, COUNT(v.id) as vote_count
      FROM candidates c
      LEFT JOIN votes v ON c.id = v.candidate_id
      GROUP BY c.id, c.name, c.party
      ORDER BY vote_count DESC
    `);

    return result.rows.map(row => ({
      ...row,
      vote_count: parseInt(row.vote_count) || 0
    }));
  }

  static async getVotesByTime(hours = 24) {
    const db = getDB();
    const result = await db.query(`
      SELECT c.id, c.name, c.party, COUNT(v.id) as recent_votes
      FROM candidates c
      LEFT JOIN votes v ON c.id = v.candidate_id 
        AND v.created_at >= NOW() - INTERVAL '${hours} hours'
      GROUP BY c.id, c.name, c.party
      ORDER BY recent_votes DESC
    `);

    return result.rows.map(row => ({
      ...row,
      recent_votes: parseInt(row.recent_votes) || 0
    }));
  }

  static async getVoteStats() {
    const db = getDB();
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_votes,
        COUNT(DISTINCT session_id) as unique_voters,
        COUNT(DISTINCT candidate_id) as candidates_with_votes,
        DATE(created_at) as vote_date,
        COUNT(*) as daily_votes
      FROM votes
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY vote_date DESC
    `);

    const summary = await db.query(`
      SELECT 
        COUNT(*) as total_votes,
        COUNT(DISTINCT session_id) as unique_voters,
        COUNT(DISTINCT candidate_id) as candidates_with_votes
      FROM votes
    `);

    return {
      summary: summary.rows[0],
      daily: result.rows
    };
  }

  static async removeVote(candidateId, sessionId) {
    const db = getDB();
    const result = await db.query(
      'DELETE FROM votes WHERE candidate_id = $1 AND session_id = $2 RETURNING *',
      [candidateId, sessionId]
    );

    return result.rows.length > 0;
  }

  static async cleanupOldVotes(daysToKeep = 365) {
    const db = getDB();
    const result = await db.query(`
      DELETE FROM votes 
      WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
      RETURNING COUNT(*)
    `);

    return result.rows[0];
  }
}

module.exports = Vote;