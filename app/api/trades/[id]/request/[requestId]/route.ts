import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiCache } from '@/lib/apiCache';
import { tradeInclude } from '@/lib/tradeIncludes';
import { formatTradeResponse, TradeWithRelations } from '@/lib/tradeFormatter';

// Accept or decline a trade request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> | { id: string; requestId: string } }
) {
  try {
    const user = await requireAuth();
    const resolvedParams = await Promise.resolve(params);
    const tradeId = resolvedParams.id;
    const requestId = resolvedParams.requestId;
    const { action } = await request.json(); // 'accept' or 'decline'

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "accept" or "decline"' },
        { status: 400 }
      );
    }

    // Get the trade request
    const tradeRequest = await prisma.tradeRequest.findUnique({
      where: { id: requestId },
      include: {
        trade: {
          include: tradeInclude,
        },
      },
    });

    if (!tradeRequest) {
      return NextResponse.json(
        { error: 'Trade request not found' },
        { status: 404 }
      );
    }

    // Verify the trade belongs to the user
    if (tradeRequest.trade.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only accept/decline requests for your own trades' },
        { status: 403 }
      );
    }

    // Verify request is pending
    if (tradeRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `This request has already been ${tradeRequest.status}` },
        { status: 400 }
      );
    }

    // Verify trade is still active
    if (tradeRequest.trade.status !== 'active') {
      return NextResponse.json(
        { error: 'This trade is no longer available' },
        { status: 400 }
      );
    }

    if (action === 'accept') {
      // Check if trade already has a counterparty
      if (tradeRequest.trade.counterpartyId) {
        return NextResponse.json(
          { error: 'This trade already has an accepted request' },
          { status: 400 }
        );
      }

      // Accept the request: set counterparty and change trade status to pending
      await prisma.$transaction([
        prisma.tradeRequest.update({
          where: { id: requestId },
          data: { status: 'pending' }, // Keep as pending in request table
        }),
        prisma.trade.update({
          where: { id: tradeId },
          data: {
            status: 'pending', // Trade goes to pending when request is accepted
            counterpartyId: tradeRequest.requesterId,
          },
        }),
        // Cancel all other pending requests for this trade
        prisma.tradeRequest.updateMany({
          where: {
            tradeId,
            status: 'pending',
            id: { not: requestId },
          },
          data: { status: 'cancelled' },
        }),
      ]);
    } else {
      // Decline the request - just cancel it
      await prisma.tradeRequest.update({
        where: { id: requestId },
        data: { status: 'cancelled' },
      });
    }

    // Refresh trade with updated data
    const updatedTrade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: tradeInclude,
    });

    // Invalidate cache
    await apiCache.invalidate(`/api/trades/${tradeId}`);
    await apiCache.invalidate('/api/trades');

    return NextResponse.json({
      message: `Trade request ${action}ed successfully`,
      trade: formatTradeResponse(updatedTrade as TradeWithRelations, {
        currentUserId: user.id,
      }),
    });
  } catch (error) {
    console.error('Error updating trade request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

