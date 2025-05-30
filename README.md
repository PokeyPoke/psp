# Political Sentiment Tracker

A full-stack web application for tracking political candidate sentiment across social media and news sources in real-time.

## Features

- **Real-time Sentiment Analysis**: Track candidate mentions and sentiment across Reddit, Google Trends, and news sources
- **Interactive Voting**: Session-based voting system for user engagement
- **Data Visualization**: Charts and graphs showing sentiment trends over time
- **Admin Dashboard**: Manage candidates and view analytics
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Caching**: Redis caching for improved performance
- **Scheduled Data Fetching**: Daily automated updates of sentiment metrics

## Tech Stack

### Backend
- **Node.js** with **Express** - RESTful API server
- **PostgreSQL** - Primary database for candidates, metrics, and votes
- **Redis** - Caching layer for improved performance
- **External APIs**:
  - Reddit API for social media sentiment
  - Google Trends API for search interest data
  - NewsAPI for news coverage analysis

### Frontend
- **React 18** - Modern UI framework
- **Tailwind CSS** - Utility-first CSS framework
- **Chart.js & Recharts** - Data visualization
- **React Router** - Client-side routing
- **React Query** - Server state management
- **Framer Motion** - Animations

### Deployment
- **Heroku** - Cloud platform with PostgreSQL and Redis add-ons
- **GitHub Integration** - Automatic deployments

## Getting Started

### Prerequisites
- Node.js 16+ 
- PostgreSQL 12+
- Redis 6+
- Git

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/psp_db

# Redis Cache
REDIS_URL=redis://localhost:6379

# API Keys
NEWS_API_KEY=your_newsapi_key_here

# Admin Authentication
ADMIN_PASSWORD=your_secure_admin_password

# Application
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
SESSION_SECRET=your_session_secret_here
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/PokeyPoke/psp.git
   cd psp
   ```

2. **Install dependencies**
   ```bash
   npm run install-deps
   ```

3. **Set up the database**
   ```bash
   npm run migrate
   ```

4. **Start the development servers**
   ```bash
   # Start both frontend and backend
   npm run dev

   # Or start individually
   npm run server  # Backend only
   npm run client  # Frontend only
   ```

5. **Visit the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Production Deployment

#### Heroku Deployment

1. **Create a Heroku app**
   ```bash
   heroku create your-app-name
   ```

2. **Add PostgreSQL and Redis**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   heroku addons:create heroku-redis:hobby-dev
   ```

3. **Set environment variables**
   ```bash
   heroku config:set NEWS_API_KEY=your_key
   heroku config:set ADMIN_PASSWORD=your_password
   heroku config:set SESSION_SECRET=your_secret
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **Run migrations**
   ```bash
   heroku run npm run migrate
   ```

6. **Set up scheduler** (optional)
   ```bash
   heroku addons:create scheduler:standard
   # Add job: node scripts/fetchMetrics.js (daily at 02:00 UTC)
   ```

## API Documentation

### Candidates
- `GET /api/candidates` - Get all candidates
- `GET /api/candidates/:id` - Get candidate by ID
- `GET /api/candidates/:id/metrics` - Get candidate metrics
- `GET /api/candidates/leaderboard/:metric` - Get leaderboard

### Metrics
- `GET /api/metrics/candidate/:id` - Get candidate metrics
- `GET /api/metrics/candidate/:id/timeseries/:metric` - Get time series data
- `GET /api/metrics/comparison/:metric` - Get comparison data
- `GET /api/metrics/latest` - Get latest metrics

### Votes
- `POST /api/votes/:candidateId` - Vote for candidate
- `DELETE /api/votes/:candidateId` - Remove vote
- `GET /api/votes/counts` - Get vote counts
- `GET /api/votes/session` - Get session votes

### Admin (Protected)
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard` - Dashboard data
- `POST /api/admin/candidates` - Create candidate
- `PUT /api/admin/candidates/:id` - Update candidate
- `DELETE /api/admin/candidates/:id` - Delete candidate

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development servers
- `npm run build` - Build frontend for production
- `npm run migrate` - Run database migrations
- `npm run fetch-metrics` - Manual metrics fetch
- `npm test` - Run tests

## Data Sources

### Reddit API
- Searches r/politics and other political subreddits
- Analyzes post titles, content, and comments
- Sentiment analysis using VADER sentiment analyzer

### Google Trends API
- Tracks search interest over time
- Provides relative popularity scores (0-100)
- Geographic and temporal trend data

### News API
- Aggregates articles from 150,000+ sources
- Searches headlines and descriptions
- Sentiment analysis of news content

## Architecture

```
Frontend (React/Tailwind)
    ↓
Backend API (Express/Node.js)
    ↓
Database (PostgreSQL) + Cache (Redis)
    ↓
External APIs (Reddit, Google Trends, News)
```

### Key Components

1. **Data Fetching Service** - Scheduled jobs to collect metrics
2. **Sentiment Analysis** - Real-time text analysis
3. **Caching Layer** - Redis for API response caching
4. **Vote Management** - Session-based voting system
5. **Admin Panel** - CRUD operations for candidates
6. **Real-time Updates** - Automatic data refresh

## Security Features

- **Environment-based configuration** - Secrets stored in env vars
- **Session management** - Secure admin authentication
- **Input validation** - Server-side data validation
- **Rate limiting** - API request throttling
- **CORS protection** - Cross-origin request security
- **SQL injection prevention** - Parameterized queries

## Performance Optimizations

- **Redis caching** - Reduces database load
- **Data pagination** - Efficient large dataset handling
- **Lazy loading** - Components loaded on demand
- **Image optimization** - Compressed candidate photos
- **Bundle splitting** - Reduced initial load time

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@example.com or create an issue on GitHub.

## Acknowledgments

- NewsAPI.org for news data
- Reddit API for social media data
- Google Trends for search trend data
- Heroku for hosting platform