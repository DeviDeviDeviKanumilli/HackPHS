// Redis client setup for distributed caching and rate limiting
// Supports both Upstash Redis (serverless) and standard Redis
import { Redis } from '@upstash/redis';

// Initialize Redis client
let redis: Redis | null = null;
let isRedisAvailable = false;

// Initialize Redis connection
export function initRedis() {
  try {
    const redisUrl = process.env.REDIS_URL;
    const upstashRedisRestUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashRedisRestToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    // Prefer Upstash (serverless Redis) if credentials are provided
    if (upstashRedisRestUrl && upstashRedisRestToken) {
      redis = new Redis({
        url: upstashRedisRestUrl,
        token: upstashRedisRestToken,
      });
      isRedisAvailable = true;
      console.log('✅ Redis initialized (Upstash)');
      return;
    }

    // Fallback to standard Redis if REDIS_URL is provided
    if (redisUrl) {
      // For standard Redis, you'd use ioredis or node-redis
      // This is a placeholder - uncomment and configure if using standard Redis
      // const Redis = require('ioredis');
      // redis = new Redis(redisUrl);
      // isRedisAvailable = true;
      console.log('⚠️ Standard Redis URL provided but not configured. Using Upstash or in-memory fallback.');
    }

    if (!isRedisAvailable) {
      console.log('⚠️ Redis not configured. Using in-memory cache fallback.');
    }
  } catch (error) {
    console.error('❌ Redis initialization error:', error);
    isRedisAvailable = false;
  }
}

// Initialize on module load
if (typeof window === 'undefined') {
  initRedis();
}

/**
 * Get value from Redis cache
 */
export async function redisGet<T>(key: string): Promise<T | null> {
  if (!isRedisAvailable || !redis) {
    return null;
  }

  try {
    const value = await redis.get<T>(key);
    return value;
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
}

/**
 * Set value in Redis cache with TTL
 */
export async function redisSet(
  key: string,
  value: any,
  ttlSeconds?: number
): Promise<boolean> {
  if (!isRedisAvailable || !redis) {
    return false;
  }

  try {
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, value);
    } else {
      await redis.set(key, value);
    }
    return true;
  } catch (error) {
    console.error('Redis SET error:', error);
    return false;
  }
}

/**
 * Delete key from Redis
 */
export async function redisDel(key: string): Promise<boolean> {
  if (!isRedisAvailable || !redis) {
    return false;
  }

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Redis DEL error:', error);
    return false;
  }
}

/**
 * Delete keys matching pattern
 */
export async function redisDelPattern(pattern: string): Promise<number> {
  if (!isRedisAvailable || !redis) {
    return 0;
  }

  try {
    // Upstash Redis supports SCAN
    const keys: string[] = [];
    let cursor = 0;
    
    do {
      const result = await redis.keys(`${pattern}*`);
      if (Array.isArray(result)) {
        keys.push(...result);
      }
    } while (cursor !== 0);

    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return keys.length;
  } catch (error) {
    console.error('Redis DEL pattern error:', error);
    return 0;
  }
}

/**
 * Check if Redis is available
 */
export function isRedisEnabled(): boolean {
  return isRedisAvailable;
}

export { redis };

