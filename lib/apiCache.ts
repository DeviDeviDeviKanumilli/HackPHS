// API response caching for faster responses
// Uses in-memory cache with TTL for frequently accessed endpoints

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class APICache {
  private cache = new Map<string, CacheEntry>();

  /**
   * Get cached response if available and not expired
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cache entry with TTL
   */
  set(key: string, data: any, ttl: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Generate cache key from request URL and params
   */
  generateKey(url: string, params?: Record<string, any>): string {
    if (!params) return url;
    
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${String(params[key])}`)
      .join('&');
    
    return `${url}?${sortedParams}`;
  }

  /**
   * Invalidate cache entries matching pattern
   */
  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries periodically
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const apiCache = new APICache();

// Clean up expired entries every 5 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(() => apiCache.cleanup(), 5 * 60 * 1000);
}

/**
 * Cache configuration for different endpoints
 */
export const CACHE_CONFIG = {
  '/api/plants': 30000,      // 30 seconds - plants don't change often
  '/api/trades': 15000,      // 15 seconds - trades update more frequently
  '/api/forum': 20000,       // 20 seconds - forum posts update moderately
  '/api/users': 60000,       // 60 seconds - user profiles change rarely
  '/api/messages': 5000,     // 5 seconds - messages update frequently
  '/api/messages/conversations': 10000, // 10 seconds - conversations list
  default: 10000,            // 10 seconds default
};

/**
 * Get cache TTL for endpoint
 */
export function getCacheTTL(endpoint: string): number {
  for (const [path, ttl] of Object.entries(CACHE_CONFIG)) {
    if (endpoint.startsWith(path)) {
      return ttl;
    }
  }
  return CACHE_CONFIG.default;
}

/**
 * Generate cache key from URL and params (standalone function)
 */
export function generateKey(url: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) return url;
  
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${String(params[key])}`)
    .join('&');
  
  return `${url}?${sortedParams}`;
}

