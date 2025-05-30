// Simple scheduler entry point for Heroku
// This file runs the metrics fetching script

require('dotenv').config();

// Import and run the metrics fetcher
const { runDailyFetch } = require('./backend/scripts/fetchMetrics');

console.log('🚀 Starting scheduled metrics fetch job...');

runDailyFetch()
  .then(() => {
    console.log('✅ Scheduled job completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Scheduled job failed:', error);
    process.exit(1);
  });