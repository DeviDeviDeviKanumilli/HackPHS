// API middleware utilities for optimizing responses

import { NextRequest, NextResponse } from 'next/server';
import { apiCache, getCacheTTL, generateKey } from './apiCache';

/**
 * Add caching to API response
 */
export async function withCache(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const url = new URL(request.url);
  const endpoint = url.pathname;
  
  // Skip caching for POST, PUT, DELETE requests
  if (request.method !== 'GET') {
    return handler();
  }

  // Generate cache key
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  const cacheKey = generateKey(endpoint, params);

  // Check cache
  const cached = apiCache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      status: 200,
      headers: {
        'X-Cache': 'HIT',
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
      },
    });
  }

  // Execute handler
  const response = await handler();
  
  // Only cache successful responses
  if (response.status === 200) {
    const data = await response.clone().json().catch(() => null);
    if (data) {
      const ttl = getCacheTTL(endpoint);
      apiCache.set(cacheKey, data, ttl);
    }
  }

  // Add cache headers
  const headers = new Headers(response.headers);
  headers.set('X-Cache', 'MISS');
  headers.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=30');

  return new NextResponse(response.body, {
    status: response.status,
    headers,
  });
}

/**
 * Invalidate cache for endpoint
 */
export function invalidateCache(pattern: string): void {
  apiCache.invalidate(pattern);
}

