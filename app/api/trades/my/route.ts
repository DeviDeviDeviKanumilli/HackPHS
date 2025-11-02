import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { formatTradeResponse, TradeWithRelations } from '@/lib/tradeFormatter';
import { tradeInclude } from '@/lib/tradeIncludes';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    // Fetch all trades for the authenticated user, regardless of status
    const tradesQuery = await prisma.trade.findMany({
      where: {
        ownerId: user.id,
      },
      include: tradeInclude,
      orderBy: { createdAt: 'desc' },
    });

    const trades = tradesQuery.map((trade) =>
      formatTradeResponse(trade as TradeWithRelations, { currentUserId: user.id })
    );

    return NextResponse.json(
      { trades },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching user trades:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

