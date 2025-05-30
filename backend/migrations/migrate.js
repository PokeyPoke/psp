require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Drop existing problematic indexes/triggers first
    try {
      await client.query('DROP INDEX IF EXISTS idx_votes_session');
      await client.query('DROP TRIGGER IF EXISTS update_candidates_updated_at ON candidates');
    } catch (e) {
      // Ignore errors here
    }
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        photo_url TEXT,
        bio TEXT,
        party VARCHAR(100),
        campaign_link TEXT,
        social_links JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS metrics (
        id SERIAL PRIMARY KEY,
        candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        reddit_mentions INTEGER DEFAULT 0,
        reddit_sentiment DECIMAL(3,2) DEFAULT 0,
        google_trends_score INTEGER DEFAULT 0,
        news_mentions INTEGER DEFAULT 0,
        news_sentiment DECIMAL(3,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(candidate_id, date)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
        session_id VARCHAR(255),
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes safely
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_metrics_candidate_date 
      ON metrics(candidate_id, date DESC)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_votes_candidate 
      ON votes(candidate_id)
    `);

    // Only create session index if session_id column exists
    const sessionColumnCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'votes' AND column_name = 'session_id'
    `);
    
    if (sessionColumnCheck.rows.length > 0) {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_votes_session 
        ON votes(session_id)
      `);
    }

    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    await client.query(`
      CREATE TRIGGER update_candidates_updated_at 
      BEFORE UPDATE ON candidates 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    await client.query('COMMIT');
    console.log('✅ Database migration completed successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

const seedData = async () => {
  const client = await pool.connect();
  
  try {
    const { rows } = await client.query('SELECT COUNT(*) FROM candidates');
    const candidateCount = parseInt(rows[0].count);
    
    if (candidateCount === 0) {
      console.log('Seeding initial candidate data...');
      
      const sampleCandidates = [
        {
          name: 'John Smith',
          bio: 'Progressive candidate focused on healthcare reform and climate action.',
          party: 'Democratic',
          photo_url: 'https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=JS',
          campaign_link: 'https://example.com/johnsmith',
          social_links: {
            twitter: '@johnsmith2024',
            instagram: 'johnsmith_official',
            facebook: 'JohnSmithForPresident'
          }
        },
        {
          name: 'Sarah Johnson',
          bio: 'Conservative leader advocating for economic growth and traditional values.',
          party: 'Republican',
          photo_url: 'https://via.placeholder.com/300x300/DC2626/FFFFFF?text=SJ',
          campaign_link: 'https://example.com/sarahjohnson',
          social_links: {
            twitter: '@sarahjohnson2024',
            instagram: 'sarahjohnson_gop',
            facebook: 'SarahJohnsonForAmerica'
          }
        },
        {
          name: 'Michael Chen',
          bio: 'Independent candidate promoting unity and bipartisan solutions.',
          party: 'Independent',
          photo_url: 'https://via.placeholder.com/300x300/059669/FFFFFF?text=MC',
          campaign_link: 'https://example.com/michaelchen',
          social_links: {
            twitter: '@michaelchen2024',
            instagram: 'michael_chen_ind',
            facebook: 'MichaelChenIndependent'
          }
        }
      ];
      
      for (const candidate of sampleCandidates) {
        await client.query(`
          INSERT INTO candidates (name, bio, party, photo_url, campaign_link, social_links)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          candidate.name,
          candidate.bio,
          candidate.party,
          candidate.photo_url,
          candidate.campaign_link,
          JSON.stringify(candidate.social_links)
        ]);
      }
      
      console.log('✅ Sample candidates seeded');
    }
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

const runMigration = async () => {
  try {
    console.log('🚀 Starting database migration...');
    await createTables();
    await seedData();
    console.log('🎉 Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runMigration();
}

module.exports = { createTables, seedData };