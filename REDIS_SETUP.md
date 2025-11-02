# Redis Configuration Guide

This guide will help you set up Redis for SproutShare. The application uses **Upstash Redis** (serverless-friendly) by default, but can also work with standard Redis.

## Option 1: Upstash Redis (Recommended for Serverless/Hosting)

Upstash Redis is perfect for serverless environments like Vercel, Netlify, or any hosting platform.

### Steps:

1. **Sign up for Upstash Redis (Free tier available)**
   - Go to https://upstash.com/
   - Sign up for a free account
   - Create a new Redis database

2. **Get your credentials**
   - Once your database is created, go to the "REST API" tab
   - Copy the `UPSTASH_REDIS_REST_URL` 
   - Copy the `UPSTASH_REDIS_REST_TOKEN`

3. **Add to your `.env.local` file:**
   ```env
   UPSTASH_REDIS_REST_URL=https://your-database-name.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token-here
   ```

4. **Restart your development server:**
   ```bash
   npm run dev
   ```

5. **Verify it's working:**
   - You should see `✅ Redis initialized (Upstash)` in your console
   - The warning `⚠️ Redis not configured. Using in-memory cache fallback.` should disappear

## Option 2: Standard Redis (Local Development)

If you want to run Redis locally or use a self-hosted Redis instance:

### For Local Development:

1. **Install Redis:**
   - **Windows:** Use WSL2 or Docker
   - **macOS:** `brew install redis`
   - **Linux:** `sudo apt-get install redis-server` or `sudo yum install redis`

2. **Start Redis:**
   ```bash
   redis-server
   ```

3. **Update `lib/redis.ts`** to support standard Redis:
   - Uncomment the ioredis code in the `initRedis()` function
   - Install ioredis: `npm install ioredis @types/ioredis`

4. **Add to your `.env.local` file:**
   ```env
   REDIS_URL=redis://localhost:6379
   ```

## Option 3: Redis Cloud / Other Providers

If you're using Redis Cloud, AWS ElastiCache, or another Redis provider:

1. Get your Redis connection URL from your provider
2. Add to `.env.local`:
   ```env
   REDIS_URL=redis://username:password@host:port
   ```

3. Update `lib/redis.ts` to use ioredis (same as Option 2)

## Features Enabled with Redis

Once configured, Redis enables:

- ✅ **Distributed caching** - Shared cache across multiple server instances
- ✅ **Rate limiting** - Distributed rate limiting for API endpoints
- ✅ **Session storage** - Can be used for session management
- ✅ **Better performance** - Faster cache lookups than in-memory

## Troubleshooting

### Redis not connecting?
- Check your environment variables are set correctly
- Verify the URL and token are correct (no extra spaces)
- For Upstash, make sure you're using the REST API credentials, not the regular Redis connection string

### Still seeing "Redis not configured" warning?
- Make sure your `.env.local` file is in the root directory
- Restart your development server after adding environment variables
- Check that the variable names match exactly: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### Testing Redis Connection

You can test if Redis is working by checking the console output when starting your server. You should see:
- `✅ Redis initialized (Upstash)` if using Upstash
- Or no warning messages if configured correctly

## Free Tier Limits (Upstash)

- **10,000 commands per day** - Perfect for development and small projects
- **256 MB storage** - More than enough for caching
- **Global replication** - Low latency worldwide

This is sufficient for most development and small production deployments.

