// Quick script to test Redis connection
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { initRedis, isRedisEnabled, redisSet, redisGet } from '../lib/redis';

async function testRedis() {
  console.log('🧪 Testing Redis connection...\n');
  
  // Re-initialize Redis (in case env vars changed)
  initRedis();
  
  if (!isRedisEnabled()) {
    console.log('❌ Redis is not enabled. Check your environment variables.');
    console.log('Make sure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set in .env.local');
    process.exit(1);
  }
  
  console.log('✅ Redis is enabled\n');
  
  // Test SET
  console.log('Testing SET operation...');
  const testKey = 'test:sproutshare:connection';
  const testValue = { message: 'Hello from SproutShare!', timestamp: Date.now() };
  
  const setResult = await redisSet(testKey, testValue, 60); // 60 second TTL
  if (setResult) {
    console.log('✅ SET operation successful');
  } else {
    console.log('❌ SET operation failed');
    process.exit(1);
  }
  
  // Test GET
  console.log('\nTesting GET operation...');
  const getValue = await redisGet(testKey);
  if (getValue) {
    console.log('✅ GET operation successful');
    console.log('Retrieved value:', JSON.stringify(getValue, null, 2));
  } else {
    console.log('❌ GET operation failed');
    process.exit(1);
  }
  
  console.log('\n🎉 Redis is working correctly!');
  console.log('Your application will now use Redis for caching and rate limiting.');
}

testRedis().catch((error) => {
  console.error('❌ Redis test failed:', error);
  process.exit(1);
});

