import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';
import {
  sanitizeMessage,
  validateMessage,
  containsInappropriateContent,
  checkRateLimit,
  isValidObjectId,
} from '@/lib/messageSecurity';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get('userId');

    // Validate otherUserId if provided
    if (otherUserId && !isValidObjectId(otherUserId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    let query: any;
    
    if (otherUserId) {
      // Get messages between current user and other user
      // Security: Only show messages where current user is sender or receiver
      query = {
        $or: [
          { senderId: user.id, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: user.id },
        ],
      };
    } else {
      // Get all conversations for current user
      query = {
        $or: [{ senderId: user.id }, { receiverId: user.id }],
      };
    }

    const messages = await Message.find({
      ...query,
      deleted: { $ne: true }, // Don't show deleted messages
    })
      .populate('senderId', 'username')
      .populate('receiverId', 'username')
      .sort({ timestamp: 1 })
      .limit(100); // Limit to prevent abuse

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error('Error fetching messages:', error);
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

    await dbConnect();

    // Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      );
    }

    // Sanitize content before storing
    const sanitizedContent = sanitizeMessage(content);

    const message = await Message.create({
      senderId: user.id,
      receiverId,
      content: sanitizedContent,
      read: false,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'username')
      .populate('receiverId', 'username');

    return NextResponse.json({ message: populatedMessage }, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

