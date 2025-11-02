# Production Optimizations for PostgreSQL/Supabase

This document outlines all the production optimizations implemented for the SproutShare application running on PostgreSQL with Supabase.

## Database Optimizations

### Connection Pooling
- **Supabase Connection Pooling**: Using `DATABASE_URL` with `pgbouncer=true` for connection pooling
- **Direct URL**: Using `DIRECT_URL` for migrations and schema operations
- **Connection Management**: Proper connection lifecycle with graceful shutdown

### Query Optimizations

1. **Selective Field Queries**
   - All queries use `select` instead of `include` where possible
   - Only fetches required fields, reducing data transfer
   - Example: User queries only fetch `id` and `username` instead of full user objects

2. **Geospatial Queries**
   - Uses bounding box filtering before distance calculation
   - Reduces number of records processed in-memory
   - Optimized for PostgreSQL spatial indexing

3. **Parallel Queries**
   - Uses `Promise.all()` for independent queries
   - Registration checks email and username in parallel
   - User profile fetches user, plants, followers, and following simultaneously

4. **Index Optimization**
   - Composite indexes for common query patterns:
     - `(status, latitude, longitude)` for filtered geospatial queries
     - `(status, createdAt)` for filtered latest trades
     - `(receiverId, deleted, timestamp)` for active conversations
     - `(category, timestamp)` for category browsing
   - Single-column indexes for unique lookups (email, username)

5. **Query Limits**
   - All queries have reasonable limits (defaults: 50-100 records)
   - Prevents large result sets that slow down the database
   - Pagination support for all list endpoints

## Performance Monitoring

### Query Metrics
- Tracks query duration and errors
- Logs slow queries (>1000ms) in production
- Provides stats: total queries, slow queries, error rate, average duration

### Error Handling
- Retry logic with exponential backoff for transient errors
- Timeout protection (10 seconds default)
- Graceful error handling with user-friendly messages
- Detailed error logging in development

## Caching Strategy

### Query Result Cache
- Simple in-memory cache for frequently accessed data
- Default TTL: 60 seconds
- Automatic cleanup of expired entries
- Cache key generation for consistent lookups

## Supabase-Specific Optimizations

1. **Connection String Format**
   - Pooled connection (port 6543) for application queries
   - Direct connection (port 5432) for migrations
   - URL-encoded passwords for special characters

2. **Connection Limits**
   - Respects Supabase connection pool limits
   - Single Prisma client instance per process
   - Global instance in development to prevent connection exhaustion

3. **Production Settings**
   - Error-only logging in production
   - Detailed logging in development
   - Connection timeout handling

## API Route Optimizations

### Trades API (`/api/trades`)
- Bounding box filtering for geospatial queries
- Selective field selection
- Optimized distance calculation (in-memory after bounding box)

### Plants API (`/api/plants`)
- Pagination support
- Search optimization with case-insensitive mode
- Selective field selection

### Messages API (`/api/messages`)
- Composite index usage for conversation queries
- Optimized for unread message queries
- Batch operations for marking messages as read

### Forum API (`/api/forum`)
- Category filtering with composite indexes
- Reply count via `_count` instead of loading full replies
- Pagination support

### Users API (`/api/users/[id]`)
- Parallel queries for user profile data
- Selective field selection for plants
- Optimized follower/following queries

## Best Practices

1. **Always use `select` instead of `include`** when you don't need all fields
2. **Use parallel queries** with `Promise.all()` for independent operations
3. **Add composite indexes** for common query patterns
4. **Set reasonable limits** on all list queries
5. **Monitor slow queries** using query metrics
6. **Handle errors gracefully** with retry logic and timeouts
7. **Use connection pooling** provided by Supabase
8. **Cache frequently accessed data** when appropriate

## Monitoring in Production

### Key Metrics to Watch
- Average query duration
- Slow query count (>500ms)
- Error rate
- Connection pool usage
- Cache hit rate

### Recommended Alerts
- Slow query threshold: >1000ms
- Error rate: >5%
- Connection pool usage: >80%

## Next Steps for Further Optimization

1. **PostGIS Extension**: For advanced geospatial queries (if needed)
2. **Read Replicas**: For scaling read operations
3. **Redis Caching**: For more sophisticated caching
4. **CDN**: For static assets and images
5. **Query Result Caching**: For expensive queries
6. **Database Connection Pooling**: Fine-tune pool settings based on traffic

