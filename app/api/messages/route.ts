import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import {
  sanitizeMessage,
  validateMessage,
  containsInappropriateContent,
  checkRateLimit,
  isValidObjectId,
} from '@/lib/messageSecurity';
import { apiCache, getCacheTTL, generateKey } from '@/lib/apiCache';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const otherUserId = searchParams.get('userId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Cap at 100
    const skip = parseInt(searchParams.get('skip') || '0');

    // If no otherUserId, return empty - conversations should use /api/messages/conversations
    if (!otherUserId) {
      return NextResponse.json(
        { messages: [], error: 'Use /api/messages/conversations for conversations list' },
        { status: 400 }
      );
    }

    // Cache key for specific conversation
    const cacheKey = generateKey(url.pathname, Object.fromEntries(searchParams.entries()));
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        status: 200,
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'private, max-age=5, stale-while-revalidate=10',
        },
      });
    }

    const where: any = {
      deleted: false,
    };
    
    if (otherUserId) {
      // Get messages between current user and other user - optimized query
      where.OR = [
        { senderId: user.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: user.id },
      ];
    } else {
      // This shouldn't happen now, but keep as fallback
      where.OR = [
        { senderId: user.id },
        { receiverId: user.id },
      ];
    }

    // Optimize: Fetch messages in ascending order for conversation view
    // This uses index more efficiently and avoids reverse()
    const messages = await prisma.message.findMany({
      where,
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        content: true,
        read: true,
        deleted: true,
        timestamp: true,
        createdAt: true,
        sender: {
          select: { id: true, username: true },
        },
        receiver: {
          select: { id: true, username: true },
        },
      },
      orderBy: { timestamp: 'asc' }, // Ascending for chronological order in conversation
      take: limit,
      skip,
    });

    const formattedMessages = messages.map(({ sender, receiver, ...message }) => ({
      ...message,
      senderId: {
        _id: sender.id,
        username: sender.username,
      },
      receiverId: {
        _id: receiver.id,
        username: receiver.username,
      },
    }));

    const response = { messages: formattedMessages };

    // Cache for 5 seconds (messages update frequently)
    const ttl = 5000;
    apiCache.set(cacheKey, response, ttl);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'private, max-age=5, stale-while-revalidate=10',
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { receiverId, content } = await request.json();

    // Validate required fields
    if (!receiverId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate receiverId format
    if (!isValidObjectId(receiverId)) {
      return NextResponse.json(
        { error: 'Invalid receiver ID format' },
        { status: 400 }
      );
    }

    // Prevent messaging yourself
    if (receiverId === user.id) {
      return NextResponse.json(
        { error: 'Cannot send message to yourself' },
        { status: 400 }
      );
    }

    // Validate and sanitize message content
    const validation = validateMessage(content);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Check for inappropriate content
    if (containsInappropriateContent(content)) {
      return NextResponse.json(
        { error: 'Message contains inappropriate content' },
        { status: 400 }
      );
    }

    // Rate limiting: max 10 messages per minute
    if (!checkRateLimit(user.id, 10, 60000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before sending more messages.' },
        { status: 429 }
      );
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    });
    if (!receiver) {
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      );
    }

    // Sanitize content before storing
    const sanitizedContent = sanitizeMessage(content);

    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId,
        content: sanitizedContent,
        read: false,
      },
      include: {
        sender: {
          select: { id: true, username: true },
        },
        receiver: {
          select: { id: true, username: true },
        },
      },
    });

    const populatedMessage = {
      ...message,
      senderId: {
        _id: message.sender.id,
        username: message.sender.username,
      },
      receiverId: {
        _id: message.receiver.id,
        username: message.receiver.username,
      },
    };

    return NextResponse.json({ message: populatedMessage }, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

