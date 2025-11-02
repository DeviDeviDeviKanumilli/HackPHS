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
import { moderateText } from '@/lib/contentModeration';
import { apiCache, getCacheTTL, generateKey } from '@/lib/apiCache';
import { emitMessage } from '@/lib/socketServer';
import { sendMessageNotificationEmail } from '@/lib/email';

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
    const cached = await apiCache.get(cacheKey);
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
    await apiCache.set(cacheKey, response, ttl);

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

    // Check for inappropriate content (basic check)
    if (containsInappropriateContent(content)) {
      return NextResponse.json(
        { error: 'Message contains inappropriate content' },
        { status: 400 }
      );
    }

    // Advanced content moderation (optional)
    try {
      const moderationResult = await moderateText(content, {
        checkToxicity: true,
        checkSpam: true,
      });
      if (!moderationResult.approved) {
        return NextResponse.json(
          { error: `Message rejected: ${moderationResult.reasons.join(', ')}` },
          { status: 400 }
        );
      }
    } catch (error) {
      // Don't fail if moderation service is unavailable
      console.error('Content moderation error:', error);
    }

    // Rate limiting: max 10 messages per minute
    if (!(await checkRateLimit(user.id, 10, 60000))) {
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

    // Emit real-time message via Socket.IO
    try {
      emitMessage(user.id, receiverId, populatedMessage);
    } catch (error) {
      console.error('Failed to emit Socket.IO message:', error);
      // Don't fail the request if Socket.IO fails
    }

    // Send email notification if user has notifications enabled
    try {
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        select: { email: true, emailNotifications: true },
      });

      if (receiver?.emailNotifications && receiver.email) {
        const conversationUrl = `${process.env.NEXTAUTH_URL}/messages/${user.id}`;
        await sendMessageNotificationEmail(
          receiver.email,
          message.sender.username,
          sanitizedContent.substring(0, 100),
          conversationUrl
        );
      }
    } catch (error) {
      console.error('Failed to send email notification:', error);
      // Don't fail the request if email fails
    }

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

