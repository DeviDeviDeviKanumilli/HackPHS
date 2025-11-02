// Query performance monitoring for production
// Helps identify slow queries and optimize performance

interface QueryMetric {
  endpoint: string;
  query: string;
  duration: number;
  timestamp: number;
  error?: string;
}

class QueryMetrics {
  private metrics: QueryMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 queries

  record(endpoint: string, query: string, duration: number, error?: string): void {
    const metric: QueryMetric = {
      endpoint,
      query,
      duration,
      timestamp: Date.now(),
      error,
    };
    
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
    
    // Log slow queries in production
    if (duration > 1000 && process.env.NODE_ENV === 'production') {
      console.warn(`⚠️ Slow query detected: ${endpoint} - ${duration}ms`);
      console.warn(`Query: ${query.substring(0, 200)}...`);
    }
  }

  getSlowQueries(threshold: number = 500): QueryMetric[] {
    return this.metrics
      .filter(m => m.duration > threshold)
      .sort((a, b) => b.duration - a.duration);
  }

  getAverageDuration(endpoint?: string): number {
    const relevant = endpoint
      ? this.metrics.filter(m => m.endpoint === endpoint)
      : this.metrics;
    
    if (relevant.length === 0) return 0;
    
    const total = relevant.reduce((sum, m) => sum + m.duration, 0);
    return total / relevant.length;
  }

  getErrorRate(): number {
    if (this.metrics.length === 0) return 0;
    const errors = this.metrics.filter(m => m.error).length;
    return errors / this.metrics.length;
  }

  clear(): void {
    this.metrics = [];
  }

  getStats(): {
    total: number;
    slow: number;
    errors: number;
    averageDuration: number;
    errorRate: number;
  } {
    const slow = this.metrics.filter(m => m.duration > 500).length;
    const errors = this.metrics.filter(m => m.error).length;
    const avgDuration = this.getAverageDuration();
    const errorRate = this.getErrorRate();
    
    return {
      total: this.metrics.length,
      slow,
      errors,
      averageDuration: avgDuration,
      errorRate,
    };
  }
}

export const queryMetrics = new QueryMetrics();

/**
 * Measure query performance
 */
export async function measureQuery<T>(
  endpoint: string,
  query: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  let error: string | undefined;
  
  try {
    const result = await operation();
    const duration = Date.now() - start;
    queryMetrics.record(endpoint, query, duration);
    return result;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
    const duration = Date.now() - start;
    queryMetrics.record(endpoint, query, duration, error);
    throw err;
  }
}

