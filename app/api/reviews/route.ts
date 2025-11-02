// Trade reviews and ratings API
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/errorHandler';
import { z } from 'zod';

const createReviewSchema = z.object({
  tradeId: z.string(),
  revieweeId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    
    // Validate input
    const validated = createReviewSchema.parse(body);
    const { tradeId, revieweeId, rating, comment } = validated;

    // Verify trade exists and user is involved
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      select: {
        id: true,
        ownerId: true,
        status: true,
      },
    });

    if (!trade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    // User must be involved in the trade and can't review themselves
    if (trade.ownerId !== user.id && trade.ownerId !== revieweeId) {
      return NextResponse.json(
        { error: 'You can only review trades you were involved in' },
        { status: 403 }
      );
    }

    if (revieweeId === user.id) {
      return NextResponse.json(
        { error: 'Cannot review yourself' },
        { status: 400 }
      );
    }

    // Check if review already exists
    const existingReview = await prisma.tradeReview.findUnique({
      where: {
        tradeId_reviewerId: {
          tradeId,
          reviewerId: user.id,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this trade' },
        { status: 400 }
      );
    }

    // Create review
    const review = await prisma.tradeReview.create({
      data: {
        tradeId,
        reviewerId: user.id,
        revieweeId,
        rating,
        comment: comment || null,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return handleApiError(error, {
      endpoint: '/api/reviews',
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const userId = searchParams.get('userId');
    const tradeId = searchParams.get('tradeId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (userId) {
      where.revieweeId = userId;
    }
    if (tradeId) {
      where.tradeId = tradeId;
    }

    const [reviews, total] = await Promise.all([
      prisma.tradeReview.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      }),
      prisma.tradeReview.count({ where }),
    ]);

    // Calculate average rating if userId provided
    let averageRating = null;
    if (userId) {
      const ratingStats = await prisma.tradeReview.aggregate({
        where: { revieweeId: userId },
        _avg: { rating: true },
        _count: { rating: true },
      });
      averageRating = {
        average: ratingStats._avg.rating || 0,
        count: ratingStats._count.rating || 0,
      };
    }

    return NextResponse.json({
      reviews,
      total,
      averageRating,
      pagination: {
        page: Math.floor(offset / limit) + 1,
        pages: Math.ceil(total / limit),
        limit,
        offset,
      },
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/reviews',
    });
  }
}

