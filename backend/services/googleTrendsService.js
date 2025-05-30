const googleTrends = require('google-trends-api');

class GoogleTrendsService {
  constructor() {
    this.defaultOptions = {
      geo: 'US',
      granularTimeUnit: 'day',
      category: 396
    };
  }

  async getInterestOverTime(keyword, options = {}) {
    try {
      const searchOptions = {
        keyword,
        startTime: options.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endTime: options.endDate || new Date(),
        geo: options.geo || this.defaultOptions.geo,
        granularTimeUnit: options.granularTimeUnit || this.defaultOptions.granularTimeUnit,
        category: options.category || this.defaultOptions.category
      };

      console.log(`Fetching Google Trends for "${keyword}"...`);

      const results = await googleTrends.interestOverTime(searchOptions);
      const data = JSON.parse(results);

      if (data && data.default && data.default.timelineData) {
        const timelineData = data.default.timelineData.map(point => ({
          time: point.time,
          formattedTime: point.formattedTime,
          value: point.value && point.value.length > 0 ? point.value[0] : 0
        }));

        const latestValue = timelineData.length > 0 
          ? timelineData[timelineData.length - 1].value 
          : 0;

        const averageValue = timelineData.length > 0
          ? timelineData.reduce((sum, point) => sum + point.value, 0) / timelineData.length
          : 0;

        const result = {
          keyword,
          currentScore: latestValue,
          averageScore: Math.round(averageValue * 100) / 100,
          timeline: timelineData,
          geo: searchOptions.geo,
          timestamp: new Date().toISOString()
        };

        console.log(`Google Trends for ${keyword}: Current=${latestValue}, Average=${averageValue}`);
        return result;
      }

      return {
        keyword,
        currentScore: 0,
        averageScore: 0,
        timeline: [],
        geo: searchOptions.geo,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Google Trends error for "${keyword}":`, error.message);
      return {
        keyword,
        currentScore: 0,
        averageScore: 0,
        timeline: [],
        geo: options.geo || this.defaultOptions.geo,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async getRelatedQueries(keyword, options = {}) {
    try {
      const searchOptions = {
        keyword,
        startTime: options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endTime: options.endDate || new Date(),
        geo: options.geo || this.defaultOptions.geo,
        category: options.category || this.defaultOptions.category
      };

      const results = await googleTrends.relatedQueries(searchOptions);
      const data = JSON.parse(results);

      if (data && data.default && data.default.rankedList) {
        const topQueries = data.default.rankedList[0]?.rankedKeyword || [];
        const risingQueries = data.default.rankedList[1]?.rankedKeyword || [];

        return {
          keyword,
          topQueries: topQueries.slice(0, 10).map(q => ({
            query: q.query,
            value: q.value
          })),
          risingQueries: risingQueries.slice(0, 10).map(q => ({
            query: q.query,
            value: q.value
          })),
          timestamp: new Date().toISOString()
        };
      }

      return {
        keyword,
        topQueries: [],
        risingQueries: [],
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Related queries error for "${keyword}":`, error.message);
      return {
        keyword,
        topQueries: [],
        risingQueries: [],
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async compareKeywords(keywords, options = {}) {
    try {
      if (!Array.isArray(keywords) || keywords.length === 0) {
        throw new Error('Keywords array is required');
      }

      const searchOptions = {
        keyword: keywords,
        startTime: options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endTime: options.endDate || new Date(),
        geo: options.geo || this.defaultOptions.geo,
        granularTimeUnit: options.granularTimeUnit || this.defaultOptions.granularTimeUnit,
        category: options.category || this.defaultOptions.category
      };

      console.log(`Comparing Google Trends for keywords: ${keywords.join(', ')}`);

      const results = await googleTrends.interestOverTime(searchOptions);
      const data = JSON.parse(results);

      if (data && data.default && data.default.timelineData) {
        const comparison = keywords.map((keyword, index) => {
          const values = data.default.timelineData.map(point => 
            point.value && point.value[index] !== undefined ? point.value[index] : 0
          );
          
          const currentValue = values.length > 0 ? values[values.length - 1] : 0;
          const averageValue = values.length > 0 
            ? values.reduce((sum, val) => sum + val, 0) / values.length 
            : 0;

          return {
            keyword,
            currentScore: currentValue,
            averageScore: Math.round(averageValue * 100) / 100,
            values
          };
        });

        const timeline = data.default.timelineData.map(point => ({
          time: point.time,
          formattedTime: point.formattedTime,
          values: point.value || keywords.map(() => 0)
        }));

        return {
          keywords,
          comparison,
          timeline,
          geo: searchOptions.geo,
          timestamp: new Date().toISOString()
        };
      }

      return {
        keywords,
        comparison: keywords.map(keyword => ({
          keyword,
          currentScore: 0,
          averageScore: 0,
          values: []
        })),
        timeline: [],
        geo: searchOptions.geo,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Keyword comparison error:`, error.message);
      return {
        keywords: keywords || [],
        comparison: (keywords || []).map(keyword => ({
          keyword,
          currentScore: 0,
          averageScore: 0,
          values: []
        })),
        timeline: [],
        geo: options.geo || this.defaultOptions.geo,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async getCandidateMetrics(candidateName, options = {}) {
    try {
      const trends = await this.getInterestOverTime(candidateName, options);
      
      return {
        candidate: candidateName,
        trendsScore: trends.currentScore,
        averageScore: trends.averageScore,
        timeline: trends.timeline,
        timestamp: trends.timestamp,
        geo: trends.geo
      };
    } catch (error) {
      console.error(`Error fetching trends for ${candidateName}:`, error);
      return {
        candidate: candidateName,
        trendsScore: 0,
        averageScore: 0,
        timeline: [],
        timestamp: new Date().toISOString(),
        geo: options.geo || this.defaultOptions.geo,
        error: error.message
      };
    }
  }
}

module.exports = new GoogleTrendsService();