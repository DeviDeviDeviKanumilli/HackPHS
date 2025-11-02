import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiCache, getCacheTTL, generateKey } from '@/lib/apiCache';

/**
 * Optimized endpoint for fetching conversations list
 * Only fetches last message and unread count for each conversation
 * Much faster than loading all messages
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const url = new URL(request.url);
    
    // Check cache
    const cacheKey = generateKey('/api/messages/conversations', { userId: user.id });
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        status: 200,
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'private, max-age=10, stale-while-revalidate=20',
        },
      });
    }

    // Optimized approach: Get unique conversation partners efficiently
    // Fetch one message per conversation to identify partners (fastest way)
    const recentMessagesForPartners = await Promise.all([
      prisma.message.findMany({
        where: {
          senderId: user.id,
          deleted: false,
        },
        select: {
          receiverId: true,
        },
        distinct: ['receiverId'],
        take: 50, // Limit to 50 conversations
        orderBy: { timestamp: 'desc' },
      }),
      prisma.message.findMany({
        where: {
          receiverId: user.id,
          deleted: false,
        },
        select: {
          senderId: true,
        },
        distinct: ['senderId'],
        take: 50, // Limit to 50 conversations
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    // Get unique conversation partner IDs
    const conversationUserIds = new Set<string>();
    recentMessagesForPartners[0].forEach(m => conversationUserIds.add(m.receiverId));
    recentMessagesForPartners[1].forEach(m => conversationUserIds.add(m.senderId));

    // For each conversation, get last message and unread count in parallel
    const conversationPromises = Array.from(conversationUserIds).map(async (otherUserId) => {
      const [lastMessage, unreadCount] = await Promise.all([
        prisma.message.findFirst({
          where: {
            OR: [
              { senderId: user.id, receiverId: otherUserId, deleted: false },
              { senderId: otherUserId, receiverId: user.id, deleted: false },
            ],
          },
          select: {
            id: true,
            content: true,
            timestamp: true,
            senderId: true,
            receiverId: true,
            sender: {
              select: { id: true, username: true },
            },
            receiver: {
              select: { id: true, username: true },
            },
          },
          orderBy: { timestamp: 'desc' },
        }),
        prisma.message.count({
          where: {
            senderId: otherUserId,
            receiverId: user.id,
            read: false,
            deleted: false,
          },
        }),
      ]);

      if (!lastMessage) return null;

      const otherUser = lastMessage.senderId === user.id 
        ? lastMessage.receiver 
        : lastMessage.sender;

      return {
        otherUserId,
        otherUsername: otherUser.username,
        lastMessage: {
          _id: lastMessage.id,
          content: lastMessage.content,
          timestamp: lastMessage.timestamp,
          senderId: {
            _id: lastMessage.sender.id,
            username: lastMessage.sender.username,
          },
          receiverId: {
            _id: lastMessage.receiver.id,
            username: lastMessage.receiver.username,
          },
        },
        unreadCount,
      };
    });

    const conversationData = await Promise.all(conversationPromises);
    const conversations = conversationData
      .filter((conv): conv is NonNullable<typeof conv> => conv !== null)
      .sort((a, b) => {
        // Sort by last message timestamp (most recent first)
        const aTime = a.lastMessage.timestamp instanceof Date 
          ? a.lastMessage.timestamp.getTime()
          : new Date(a.lastMessage.timestamp).getTime();
        const bTime = b.lastMessage.timestamp instanceof Date
          ? b.lastMessage.timestamp.getTime()
          : new Date(b.lastMessage.timestamp).getTime();
        return bTime - aTime;
      });

    const response = {
      conversations,
    };

    // Cache for 10 seconds (messages update frequently)
    const ttl = 10000;
    apiCache.set(cacheKey, response, ttl);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=20',
      },
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

