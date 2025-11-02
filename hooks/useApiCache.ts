import { useState, useEffect, useCallback } from 'react';
import { cache, createCacheKey } from '@/lib/cache';

interface UseApiCacheOptions {
  ttl?: number; // Time to live in milliseconds
  enabled?: boolean; // Whether to enable caching
}

export function useApiCache<T>(
  endpoint: string,
  params?: Record<string, any>,
  options: UseApiCacheOptions = {}
) {
  const { ttl = 5 * 60 * 1000, enabled = true } = options; // Default 5 minutes
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = createCacheKey(endpoint, params);

  const fetchData = useCallback(async (force = false) => {
    // Check cache first if enabled and not forcing refresh
    if (enabled && !force) {
      const cachedData = cache.get<T>(cacheKey);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return cachedData;
      }
    }

    setLoading(true);
    setError(null);

    try {
      let url = endpoint;
      if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
        if (searchParams.toString()) {
          url += '?' + searchParams.toString();
        }
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Cache the result if enabled
      if (enabled) {
        cache.set(cacheKey, result, ttl);
      }

      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('API fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, params, cacheKey, enabled, ttl]);

  // Refresh function to force reload
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Clear cache for this key
  const clearCache = useCallback(() => {
    cache.delete(cacheKey);
  }, [cacheKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    clearCache
  };
}
