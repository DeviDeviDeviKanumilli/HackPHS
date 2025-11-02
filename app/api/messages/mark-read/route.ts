import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isValidObjectId } from '@/lib/messageSecurity';

/**
 * Batch mark multiple messages as read
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { messageIds } = await request.json();

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { error: 'Message IDs array is required' },
        { status: 400 }
      );
    }

    // Validate all IDs
    const validIds = messageIds.filter((id: string) => isValidObjectId(id));
    if (validIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid message IDs provided' },
        { status: 400 }
      );
    }

    // Only mark messages where user is the receiver
    const result = await prisma.message.updateMany({
      where: {
        id: { in: validIds },
        receiverId: user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json(
      {
        message: `${result.count} messages marked as read`,
        count: result.count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

