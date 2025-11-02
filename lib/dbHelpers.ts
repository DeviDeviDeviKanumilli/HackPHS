// Database helper functions for PostgreSQL/Supabase production optimization
import prisma from './db';

/**
 * Retry a database operation with exponential backoff
 * Useful for handling transient PostgreSQL connection issues
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on validation errors or not found
      if (
        error instanceof Error &&
        (
          error.message.includes('Unique constraint') ||
          error.message.includes('Record to update not found') ||
          error.message.includes('Record to delete does not exist')
        )
      ) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
}

/**
 * Execute query with timeout
 */
export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  return Promise.race([
    operation,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * Safe query execution with error handling
 */
export async function safeQuery<T>(
  operation: () => Promise<T>,
  defaultValue: T,
  errorMessage?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(errorMessage || 'Database query error:', error);
    return defaultValue;
  }
}

/**
 * Batch operations for better performance
 */
export async function batchOperation<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(operation));
    results.push(...batchResults);
  }
  
  return results;
}

