const axios = require('axios');
const Sentiment = require('sentiment');

class RedditService {
  constructor() {
    this.sentiment = new Sentiment();
    this.baseURL = 'https://api.reddit.com';
    this.headers = {
      'User-Agent': 'PoliticalSentimentTracker/1.0.0'
    };
  }

  async searchMentions(candidateName, subreddit = 'all', timeframe = 'day') {
    try {
      const query = encodeURIComponent(candidateName);
      const url = `${this.baseURL}/r/${subreddit}/search.json`;
      
      const params = {
        q: query,
        sort: 'new',
        t: timeframe,
        limit: 100,
        restrict_sr: subreddit !== 'all'
      };
      
      const response = await axios.get(url, {
        headers: this.headers,
        params,
        timeout: 10000
      });
      
      if (response.data && response.data.data && response.data.data.children) {
        return response.data.data.children;
      }
      
      return [];
    } catch (error) {
      console.error(`Reddit API error for ${candidateName}:`, error.message);
      return [];
    }
  }

  async getComments(postId, subreddit) {
    try {
      const url = `${this.baseURL}/r/${subreddit}/comments/${postId}.json`;
      
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 10000
      });
      
      if (response.data && Array.isArray(response.data) && response.data[1]) {
        return response.data[1].data.children || [];
      }
      
      return [];
    } catch (error) {
      console.error(`Reddit comments error for post ${postId}:`, error.message);
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
    const {
      subreddit = 'politics',
      timeframe = 'day',
      includeComments = true
    } = options;

    try {
      console.log(`Fetching Reddit metrics for ${candidateName}...`);
      
      const posts = await this.searchMentions(candidateName, subreddit, timeframe);
      
      let totalMentions = posts.length;
      let sentimentScores = [];
      let allTexts = [];
      
      for (const post of posts) {
        const postData = post.data;
        
        if (postData.title) {
          allTexts.push(postData.title);
        }
        
        if (postData.selftext && postData.selftext !== '[removed]' && postData.selftext !== '[deleted]') {
          allTexts.push(postData.selftext);
        }
        
        if (includeComments && postData.num_comments > 0) {
          try {
            const comments = await this.getComments(postData.id, postData.subreddit);
            
            for (const comment of comments.slice(0, 10)) {
              if (comment.data && comment.data.body && 
                  comment.data.body !== '[removed]' && 
                  comment.data.body !== '[deleted]') {
                
                const commentText = comment.data.body.toLowerCase();
                if (commentText.includes(candidateName.toLowerCase())) {
                  allTexts.push(comment.data.body);
                  totalMentions++;
                }
              }
            }
          } catch (commentError) {
            console.warn(`Failed to fetch comments for post ${postData.id}`);
          }
        }
      }
      
      for (const text of allTexts) {
        const sentiment = this.analyzeSentiment(text);
        sentimentScores.push(sentiment);
      }
      
      const averageSentiment = sentimentScores.length > 0 
        ? sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length
        : 0;
      
      const result = {
        mentions: totalMentions,
        sentiment: Math.round(averageSentiment * 100) / 100,
        subreddit,
        timeframe,
        timestamp: new Date().toISOString()
      };
      
      console.log(`Reddit metrics for ${candidateName}:`, result);
      return result;
      
    } catch (error) {
      console.error(`Error fetching Reddit metrics for ${candidateName}:`, error);
      return {
        mentions: 0,
        sentiment: 0,
        subreddit,
        timeframe,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async getTrendingPosts(subreddit = 'politics', limit = 25) {
    try {
      const url = `${this.baseURL}/r/${subreddit}/hot.json`;
      
      const response = await axios.get(url, {
        headers: this.headers,
        params: { limit },
        timeout: 10000
      });
      
      if (response.data && response.data.data && response.data.data.children) {
        return response.data.data.children.map(post => ({
          id: post.data.id,
          title: post.data.title,
          score: post.data.score,
          num_comments: post.data.num_comments,
          created_utc: post.data.created_utc,
          url: post.data.url,
          subreddit: post.data.subreddit
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching trending posts:', error);
      return [];
    }
  }
}

module.exports = new RedditService();