/**
 * Script to create database indexes for performance
 * Run this once with: npx ts-node scripts/create-indexes.ts
 * Or use the API endpoint at /api/admin/create-indexes (if you create it)
 */

import { createIndexes } from '../lib/dbIndexes';

async function main() {
  console.log('🚀 Starting database index creation...');
  try {
    await createIndexes();
    console.log('✅ Done! Your database is now optimized.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create indexes:', error);
    process.exit(1);
  }
}

main();

