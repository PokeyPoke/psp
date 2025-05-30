const axios = require('axios');
const Sentiment = require('sentiment');

class NewsService {
  constructor() {
    this.apiKey = process.env.NEWS_API_KEY;
    this.baseURL = 'https://newsapi.org/v2';
    this.sentiment = new Sentiment();
    
    this.headers = {
      'X-API-Key': this.apiKey,
      'User-Agent': 'PoliticalSentimentTracker/1.0.0'
    };
  }

  isConfigured() {
    return !!this.apiKey;
  }

  async searchArticles(query, options = {}) {
    if (!this.isConfigured()) {
      console.warn('News API key not configured');
      return [];
    }

    try {
      const {
        language = 'en',
        sortBy = 'publishedAt',
        pageSize = 100,
        from,
        to
      } = options;

      const params = {
        q: query,
        language,
        sortBy,
        pageSize,
        apiKey: this.apiKey
      };

      if (from) params.from = from;
      if (to) params.to = to;

      console.log(`Searching news for: "${query}"`);

      const response = await axios.get(`${this.baseURL}/everything`, {
        params,
        timeout: 15000
      });

      if (response.data && response.data.articles) {
        return response.data.articles.filter(article => 
          article.title && 
          article.title !== '[Removed]' && 
          article.description &&
          article.description !== '[Removed]'
        );
      }

      return [];
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.warn('News API rate limit exceeded');
      } else if (error.response && error.response.status === 401) {
        console.error('News API authentication failed - check API key');
      } else {
        console.error(`News API error for "${query}":`, error.message);
      }
      return [];
    }
  }

  async getTopHeadlines(country = 'us', category = 'general', pageSize = 50) {
    if (!this.isConfigured()) {
      console.warn('News API key not configured');
      return [];
    }

    try {
      const params = {
        country,
        category,
        pageSize,
        apiKey: this.apiKey
      };

      const response = await axios.get(`${this.baseURL}/top-headlines`, {
        params,
        timeout: 15000
      });

      if (response.data && response.data.articles) {
        return response.data.articles.filter(article => 
          article.title && 
          article.title !== '[Removed]'
        );
      }

      return [];
    } catch (error) {
      console.error('Error fetching top headlines:', error.message);
      return [];
    }
  }

  analyzeSentiment(text) {
    if (!text || typeof text !== 'string') return 0;
    
    try {
      const result = this.sentiment.analyze(text);
      return Math.max(-1, Math.min(1, result.score / 10));
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return 0;
    }
  }

  async getCandidateMetrics(candidateName, options = {}) {
    try {
      const {
        days = 1,
        language = 'en'
      } = options;

      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      
      const searchOptions = {
        language,
        from: fromDate.toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
      };

      console.log(`Fetching news metrics for ${candidateName}...`);

      const articles = await this.searchArticles(candidateName, searchOptions);
      
      let totalMentions = 0;
      let sentimentScores = [];
      let sources = new Set();
      let categories = new Set();

      for (const article of articles) {
        const titleLower = (article.title || '').toLowerCase();
        const descriptionLower = (article.description || '').toLowerCase();
        const candidateLower = candidateName.toLowerCase();

        if (titleLower.includes(candidateLower) || descriptionLower.includes(candidateLower)) {
          totalMentions++;
          
          const titleSentiment = this.analyzeSentiment(article.title);
          const descSentiment = this.analyzeSentiment(article.description);
          const avgSentiment = (titleSentiment + descSentiment) / 2;
          
          sentimentScores.push(avgSentiment);
          
          if (article.source && article.source.name) {
            sources.add(article.source.name);
          }
          
          if (article.urlToImage) {
            categories.add('with-image');
          }
        }
      }

      const averageSentiment = sentimentScores.length > 0 
        ? sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length
        : 0;

      const result = {
        mentions: totalMentions,
        sentiment: Math.round(averageSentiment * 100) / 100,
        sources: Array.from(sources),
        sourceCount: sources.size,
        searchPeriod: {
          from: searchOptions.from,
          to: searchOptions.to,
          days
        },
        timestamp: new Date().toISOString()
      };

      console.log(`News metrics for ${candidateName}:`, {
        mentions: result.mentions,
        sentiment: result.sentiment,
        sources: result.sourceCount
      });

      return result;

    } catch (error) {
      console.error(`Error fetching news metrics for ${candidateName}:`, error);
      return {
        mentions: 0,
        sentiment: 0,
        sources: [],
        sourceCount: 0,
        searchPeriod: {
          from: null,
          to: null,
          days: options.days || 1
        },
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async getRecentArticles(candidateName, limit = 10) {
    try {
      const articles = await this.searchArticles(candidateName, {
        pageSize: limit,
        sortBy: 'publishedAt'
      });

      return articles.slice(0, limit).map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source?.name,
        publishedAt: article.publishedAt,
        urlToImage: article.urlToImage,
        sentiment: this.analyzeSentiment(`${article.title} ${article.description}`)
      }));

    } catch (error) {
      console.error(`Error fetching recent articles for ${candidateName}:`, error);
      return [];
    }
  }

  async getTrendingTopics(category = 'politics', limit = 20) {
    try {
      const headlines = await this.getTopHeadlines('us', category, limit);
      
      const topics = new Map();
      
      for (const article of headlines) {
        const title = article.title.toLowerCase();
        const words = title.split(/\s+/).filter(word => 
          word.length > 3 && 
          !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'men', 'way', 'who'].includes(word)
        );
        
        for (const word of words) {
          topics.set(word, (topics.get(word) || 0) + 1);
        }
      }
      
      return Array.from(topics.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([topic, count]) => ({ topic, count }));
        
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      return [];
    }
  }
}

module.exports = new NewsService();