import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiCache } from '@/lib/apiCache';
import { tradeInclude } from '@/lib/tradeIncludes';
import { formatTradeResponse, TradeWithRelations } from '@/lib/tradeFormatter';

// Create a trade request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await requireAuth();
    const resolvedParams = await Promise.resolve(params);
    const tradeId = resolvedParams.id;
    const { message } = await request.json();

    // Get the trade
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: tradeInclude,
    });

    if (!trade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    // Check if user is the owner
    if (trade.ownerId === user.id) {
      return NextResponse.json(
        { error: 'You cannot request your own trade' },
        { status: 400 }
      );
    }

    // Check if trade is active
    if (trade.status !== 'active') {
      return NextResponse.json(
        { error: 'This trade is no longer available' },
        { status: 400 }
      );
    }

    // Check if user already has a pending request
    const existingRequest = await prisma.tradeRequest.findUnique({
      where: {
        tradeId_requesterId: {
          tradeId,
          requesterId: user.id,
        },
      },
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return NextResponse.json(
          { error: 'You already have a pending request for this trade' },
          { status: 400 }
        );
      }
      if (existingRequest.status === 'accepted') {
        return NextResponse.json(
          { error: 'Your request has already been accepted' },
          { status: 400 }
        );
      }
    }

    // Create or update the request
    const tradeRequest = await prisma.tradeRequest.upsert({
      where: {
        tradeId_requesterId: {
          tradeId,
          requesterId: user.id,
        },
      },
      update: {
        status: 'pending',
        message: message || null,
        updatedAt: new Date(),
      },
      create: {
        tradeId,
        requesterId: user.id,
        status: 'pending',
        message: message || null,
      },
    });

    // Refresh trade with updated requests
    const updatedTrade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: tradeInclude,
    });

    // Invalidate cache
    await apiCache.invalidate(`/api/trades/${tradeId}`);
    await apiCache.invalidate('/api/trades');

    return NextResponse.json({
      request: tradeRequest,
      trade: formatTradeResponse(updatedTrade as TradeWithRelations, {
        currentUserId: user.id,
      }),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating trade request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

