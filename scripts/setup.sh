#!/bin/bash

# Political Sentiment Tracker Setup Script

echo "🚀 Setting up Political Sentiment Tracker..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 16+ first.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "${RED}❌ Node.js version 16+ is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"

# Check if PostgreSQL is available
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL detected${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL not detected. Make sure it's installed and running.${NC}"
fi

# Check if Redis is available
if command -v redis-cli &> /dev/null; then
    echo -e "${GREEN}✅ Redis detected${NC}"
else
    echo -e "${YELLOW}⚠️  Redis not detected. App will work without caching.${NC}"
fi

# Install root dependencies
echo -e "${BLUE}📦 Installing root dependencies...${NC}"
npm install

# Install backend dependencies
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd backend && npm install && cd ..

# Install frontend dependencies
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
cd frontend && npm install && cd ..

# Copy environment files
echo -e "${BLUE}⚙️  Setting up environment files...${NC}"

if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}📝 Created .env file. Please edit it with your configuration.${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo -e "${YELLOW}📝 Created frontend/.env file.${NC}"
else
    echo -e "${GREEN}✅ Frontend .env file already exists${NC}"
fi

# Database setup
echo -e "${BLUE}🗄️  Setting up database...${NC}"

if [ -n "$DATABASE_URL" ]; then
    echo -e "${GREEN}✅ DATABASE_URL found, running migrations...${NC}"
    npm run migrate
else
    echo -e "${YELLOW}⚠️  DATABASE_URL not set. Please configure your database and run 'npm run migrate'${NC}"
fi

# Check API keys
echo -e "${BLUE}🔑 Checking API keys...${NC}"

if [ -n "$NEWS_API_KEY" ]; then
    echo -e "${GREEN}✅ News API key configured${NC}"
else
    echo -e "${YELLOW}⚠️  NEWS_API_KEY not set. News metrics will not work.${NC}"
    echo -e "${YELLOW}   Get your free key at: https://newsapi.org/${NC}"
fi

if [ -n "$ADMIN_PASSWORD" ]; then
    echo -e "${GREEN}✅ Admin password configured${NC}"
else
    echo -e "${YELLOW}⚠️  ADMIN_PASSWORD not set. Admin access will not work.${NC}"
fi

# Build frontend
echo -e "${BLUE}🏗️  Building frontend...${NC}"
cd frontend && npm run build && cd ..

# Success message
echo -e "${GREEN}"
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Set up your database (if not using DATABASE_URL)"
echo "3. Run 'npm run migrate' to set up database tables"
echo "4. Start the application with 'npm run dev'"
echo ""
echo "🌐 Development URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   Admin:    http://localhost:3000/admin"
echo ""
echo "📚 See README.md for detailed documentation"
echo "🚀 See DEPLOYMENT.md for production deployment"
echo -e "${NC}"

# Optional: Check if we can start the services
echo -e "${BLUE}🔍 Testing basic setup...${NC}"

# Test if we can require the main modules
node -e "
try {
  require('./backend/server.js');
  console.log('✅ Backend modules load successfully');
} catch (e) {
  console.log('❌ Backend module error:', e.message);
}
" 2>/dev/null

echo -e "${GREEN}✨ Setup script completed!${NC}"