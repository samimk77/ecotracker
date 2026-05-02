const NodeCache = require('node-cache');
const myCache = new NodeCache({ stdTTL: 15 }); // Default 15 seconds

/**
 * Cache middleware
 * @param {number} duration - Cache duration in seconds
 */
const cacheMiddleware = (duration) => (req, res, next) => {
  // Only cache GET requests
  if (req.method !== 'GET') return next();

  // Create a unique key based on URL and query params
  const key = req.originalUrl || req.url;
  const cachedResponse = myCache.get(key);

  if (cachedResponse) {
    res.set('X-Cache', 'HIT');
    return res.json(cachedResponse);
  }

  // Intercept the original res.json to store the result in cache
  res.originalJson = res.json;
  res.json = (body) => {
    // Only cache successful responses
    if (res.statusCode === 200 && body.success) {
      myCache.set(key, body, duration);
    }
    res.set('X-Cache', 'MISS');
    res.originalJson(body);
  };

  next();
};

// Function to clear cache for specific patterns (e.g. when an issue is updated)
const clearCache = (key) => {
  if (key) {
    myCache.del(key);
  } else {
    myCache.flushAll();
  }
};

module.exports = { cacheMiddleware, clearCache };
