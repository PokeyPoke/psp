#!/usr/bin/env node

// Standalone database setup script for Heroku
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

async function setupDatabase() {
  console.log('🚀 Starting database setup...');
  
  const client = await pool.connect();
  
  try {
    // Drop all existing tables to start fresh
    console.log('🧹 Cleaning existing tables...');
    await client.query('DROP TABLE IF EXISTS votes CASCADE');
    await client.query('DROP TABLE IF EXISTS metrics CASCADE'); 
    await client.query('DROP TABLE IF EXISTS admin_sessions CASCADE');
    await client.query('DROP TABLE IF EXISTS candidates CASCADE');
    
    // Create candidates table
    console.log('📊 Creating candidates table...');
    await client.query(`
      CREATE TABLE candidates (
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

    // Create metrics table
    console.log('📈 Creating metrics table...');
    await client.query(`
      CREATE TABLE metrics (
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

    // Create votes table
    console.log('🗳️  Creating votes table...');
    await client.query(`
      CREATE TABLE votes (
        id SERIAL PRIMARY KEY,
        candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
        session_id VARCHAR(255),
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create admin sessions table
    console.log('👤 Creating admin_sessions table...');
    await client.query(`
      CREATE TABLE admin_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    console.log('🔍 Creating indexes...');
    await client.query('CREATE INDEX idx_metrics_candidate_date ON metrics(candidate_id, date DESC)');
    await client.query('CREATE INDEX idx_votes_candidate ON votes(candidate_id)');
    await client.query('CREATE INDEX idx_votes_session ON votes(session_id)');

    // Create trigger function
    console.log('⚡ Creating trigger function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    // Create trigger
    await client.query(`
      CREATE TRIGGER update_candidates_updated_at 
      BEFORE UPDATE ON candidates 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    // Insert sample data
    console.log('🌱 Seeding sample data...');
    
    const sampleCandidates = [
      {
        name: 'John Smith',
        bio: 'Progressive candidate focused on healthcare reform and climate action.',
        party: 'Democratic',
        photo_url: 'https://via.placeholder.com/300x300/3b82f6/FFFFFF?text=JS',
        campaign_link: 'https://example.com/johnsmith',
        social_links: {
          twitter: '@johnsmith2024',
          instagram: 'johnsmith_official'
        }
      },
      {
        name: 'Sarah Johnson', 
        bio: 'Conservative leader advocating for economic growth and traditional values.',
        party: 'Republican',
        photo_url: 'https://via.placeholder.com/300x300/ef4444/FFFFFF?text=SJ',
        campaign_link: 'https://example.com/sarahjohnson',
        social_links: {
          twitter: '@sarahjohnson2024',
          facebook: 'SarahJohnsonForAmerica'
        }
      },
      {
        name: 'Michael Chen',
        bio: 'Independent candidate promoting unity and bipartisan solutions.',
        party: 'Independent', 
        photo_url: 'https://via.placeholder.com/300x300/22c55e/FFFFFF?text=MC',
        campaign_link: 'https://example.com/michaelchen',
        social_links: {
          twitter: '@michaelchen2024',
          instagram: 'michael_chen_ind'
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

    console.log('✅ Database setup completed successfully!');
    console.log('📊 Created tables: candidates, metrics, votes, admin_sessions');
    console.log('🌱 Seeded 3 sample candidates');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('🎉 Setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabase };