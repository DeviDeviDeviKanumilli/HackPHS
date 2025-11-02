import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { getCoordinatesFromZip } from '@/lib/geocoding';

/**
 * Update coordinates for existing trades that might have incorrect coordinates
 * POST /api/trades/fix-coordinates
 * This will update all active trades with proper coordinates based on their zip codes
 */
export async function POST() {
  try {
    await requireAuth(); // Only authenticated users

    // Get all active trades
    const trades = await prisma.trade.findMany({
      where: { status: 'active' },
      select: { id: true, locationZip: true },
    });
    
    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const trade of trades) {
      try {
        // Re-geocode the zip code
        const coordinates = await getCoordinatesFromZip(trade.locationZip);
        
        if (coordinates) {
          await prisma.trade.update({
            where: { id: trade.id },
            data: {
              latitude: coordinates.lat,
              longitude: coordinates.lng,
            },
          });
          updated++;
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          failed++;
          errors.push(`Failed to geocode zip ${trade.locationZip} for trade ${trade.id}`);
        }
      } catch (error) {
        failed++;
        errors.push(`Error updating trade ${trade.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      message: `Updated ${updated} trades, ${failed} failed`,
      updated,
      failed,
      errors: errors.slice(0, 10) // Only return first 10 errors
    }, { status: 200 });
  } catch (error) {
    console.error('Error fixing coordinates:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

