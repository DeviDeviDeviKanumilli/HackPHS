import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import { apiCache, getCacheTTL, generateKey } from '@/lib/apiCache';
import { tradeInclude } from '@/lib/tradeIncludes';
import { formatTradeResponse, TradeWithRelations } from '@/lib/tradeFormatter';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    const currentUserId = currentUser?.id ?? null;
    const resolvedParams = await Promise.resolve(params);
    const tradeId = resolvedParams.id;

    // Check cache
    const cacheKey = generateKey(`/api/trades/${tradeId}`);
    const cached = await apiCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        status: 200,
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=15, stale-while-revalidate=30',
        },
      });
    }

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

    const response = {
      trade: formatTradeResponse(trade as TradeWithRelations, { currentUserId }),
    };

    // Cache for 15 seconds
    const ttl = getCacheTTL('/api/trades');
    await apiCache.set(cacheKey, response, ttl);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=15, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Error fetching trade:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await requireAuth();
    const resolvedParams = await Promise.resolve(params);
    const tradeId = resolvedParams.id;
    const body = await request.json();

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

    const newStatus = body.status as string;
    let updatedTrade: TradeWithRelations | null = null;

    const isOwner = trade.ownerId === user.id;
    const counterpartyId = trade.counterpartyId ?? null;
    const isCounterparty = counterpartyId === user.id;

    if (newStatus === 'completed') {
      if (!isOwner && !isCounterparty) {
        return NextResponse.json(
          { error: 'Only trade participants can complete a trade' },
          { status: 403 }
        );
      }

      // Can complete from pending status (after request accepted)
      if (trade.status !== 'pending') {
        return NextResponse.json(
          { error: 'Trade must be pending before completion' },
          { status: 400 }
        );
      }

      if (!counterpartyId) {
        return NextResponse.json(
          { error: 'No counterparty assigned to this trade' },
          { status: 400 }
        );
      }

      const updates: any[] = [
        prisma.trade.update({
          where: { id: tradeId },
          data: { status: 'completed' },
          include: tradeInclude,
        }),
        prisma.user.update({
          where: { id: trade.ownerId },
          data: { tradesCompleted: { increment: 1 } },
        }),
      ];

      if (counterpartyId) {
        updates.push(
          prisma.user.update({
            where: { id: counterpartyId },
            data: { tradesCompleted: { increment: 1 } },
          })
        );
      }

      const [tradeUpdate] = await prisma.$transaction(updates);

      updatedTrade = tradeUpdate as TradeWithRelations;
    } else if (newStatus === 'pending') {
      // Only owner can manually set to pending
      if (!isOwner) {
        return NextResponse.json(
          { error: 'Only the trade owner can set trade to pending' },
          { status: 403 }
        );
      }

      updatedTrade = (await prisma.trade.update({
        where: { id: tradeId },
        data: { status: 'pending' },
        include: tradeInclude,
      })) as TradeWithRelations;
    } else if (newStatus === 'active') {
      // Only owner can reactivate
      if (!isOwner) {
        return NextResponse.json(
          { error: 'Only the trade owner can reactivate the trade' },
          { status: 403 }
        );
      }

      updatedTrade = (await prisma.trade.update({
        where: { id: tradeId },
        data: {
          status: 'active',
          counterpartyId: null,
        },
        include: tradeInclude,
      })) as TradeWithRelations;
    } else {
      return NextResponse.json(
        { error: 'Unsupported status update. Allowed: active, pending, completed' },
        { status: 400 }
      );
    }

    // Invalidate cache
    await apiCache.invalidate(`/api/trades/${tradeId}`);
    await apiCache.invalidate('/api/trades');

    if (!updatedTrade) {
      return NextResponse.json(
        { error: 'Trade update failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      trade: formatTradeResponse(updatedTrade, { currentUserId: user.id }),
    });
  } catch (error) {
    console.error('Error updating trade:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await requireAuth();
    const resolvedParams = await Promise.resolve(params);
    const tradeId = resolvedParams.id;

    // Check if trade exists and belongs to user
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      select: { ownerId: true },
    });

    if (!trade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    if (trade.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete trade
    await prisma.trade.delete({
      where: { id: tradeId },
    });

    // Invalidate cache
    await apiCache.invalidate(`/api/trades/${tradeId}`);
    await apiCache.invalidate('/api/trades');

    return NextResponse.json({
      message: 'Trade deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting trade:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
