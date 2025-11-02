import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

/**
 * API endpoint to verify database indexes
 * Note: Prisma automatically creates indexes based on @@index directives in schema
 * This endpoint is kept for compatibility but indexes are managed via Prisma migrations
 * POST /api/admin/create-indexes
 */
export async function POST() {
  try {
    await requireAuth(); // Only authenticated users can run this
    
    // Prisma indexes are defined in schema.prisma and created via:
    // - `npx prisma db push` (development)
    // - `npx prisma migrate dev` (with migrations)
    // All indexes are automatically created based on @@index directives
    
    return NextResponse.json(
      { 
        message: 'Indexes are managed via Prisma schema. Run `npx prisma db push` to apply.',
        note: 'Prisma automatically creates all indexes defined in schema.prisma'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

