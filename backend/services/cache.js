const Redis = require('redis');

let redisClient;

const connectRedis = async () => {
  try {
    const redisUrl = process.env.REDIS_TLS_URL || process.env.REDIS_URL;
    
    if (!redisUrl) {
      console.warn('Redis URL not found, running without cache');
      return null;
    }

    const clientOptions = {
      url: redisUrl
    };

    if (process.env.NODE_ENV === 'production' || redisUrl.startsWith('rediss://')) {
      clientOptions.socket = {
        tls: true,
        rejectUnauthorized: false
      };
    }

    redisClient = Redis.createClient(clientOptions);

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis client connected');
    });

    redisClient.on('ready', () => {
      console.log('Redis client ready');
    });

    await redisClient.connect();
    
    await redisClient.ping();
    console.log('Redis connection established');
    
    return redisClient;
  } catch (error) {
    console.error('Redis connection failed:', error);
    console.warn('Continuing without Redis cache');
    return null;
  }
};

const getCache = () => {
  return redisClient;
};

const setCache = async (key, value, expireInSeconds = 3600) => {
  try {
    if (!redisClient) return false;
    
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await redisClient.setEx(key, expireInSeconds, stringValue);
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
};

const getFromCache = async (key) => {
  try {
    if (!redisClient) return null;
    
    const result = await redisClient.get(key);
    if (!result) return null;
    
    try {
      return JSON.parse(result);
    } catch {
      return result;
    }
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

const deleteFromCache = async (key) => {
  try {
    if (!redisClient) return false;
    
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
};

const closeRedis = async () => {
  if (redisClient) {
    await redisClient.disconnect();
    console.log('Redis connection closed');
  }
};

module.exports = {
  connectRedis,
  getCache,
  setCache,
  getFromCache,
  deleteFromCache,
  closeRedis
};