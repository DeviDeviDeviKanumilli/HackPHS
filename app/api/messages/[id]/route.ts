import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import { requireAuth } from '@/lib/auth';
import { isValidObjectId } from '@/lib/messageSecurity';

/**
 * Mark message as read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await requireAuth();
    const resolvedParams = await Promise.resolve(params);
    const messageId = resolvedParams.id;

    if (!isValidObjectId(messageId)) {
      return NextResponse.json(
        { error: 'Invalid message ID format' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find message and verify user is the receiver
    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Security: Only the receiver can mark message as read
    if (message.receiverId.toString() !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: Only the receiver can mark message as read' },
        { status: 403 }
      );
    }

    message.read = true;
    await message.save();

    return NextResponse.json(
      { message: 'Message marked as read', read: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete a message (soft delete - only by sender)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await requireAuth();
    const resolvedParams = await Promise.resolve(params);
    const messageId = resolvedParams.id;

    if (!isValidObjectId(messageId)) {
      return NextResponse.json(
        { error: 'Invalid message ID format' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find message and verify user is the sender
    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Security: Only the sender can delete their message
    if (message.senderId.toString() !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: Only the sender can delete this message' },
        { status: 403 }
      );
    }

    // Soft delete the message (mark as deleted rather than removing)
    message.deleted = true;
    message.deletedAt = new Date();
    await message.save();

    return NextResponse.json(
      { message: 'Message deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

