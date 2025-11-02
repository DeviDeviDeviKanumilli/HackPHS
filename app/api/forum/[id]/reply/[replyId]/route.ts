import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiCache } from '@/lib/apiCache';

async function invalidateForumCache() {
  await apiCache.invalidate('/api/forum');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; replyId: string }> | { id: string; replyId: string } }
) {
  try {
    const user = await requireAuth();
    const resolvedParams = await Promise.resolve(params);
    const replyId = resolvedParams.replyId;

    // Find the reply and verify ownership
    const reply = await prisma.forumReply.findUnique({
      where: { id: replyId },
    });

    if (!reply) {
      return NextResponse.json(
        { error: 'Reply not found' },
        { status: 404 }
      );
    }

    // Only the author can delete their reply
    if (reply.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only delete your own replies' },
        { status: 403 }
      );
    }

    // Delete the reply
    await prisma.forumReply.delete({
      where: { id: replyId },
    });

    // Invalidate cache
    await invalidateForumCache();

    return NextResponse.json(
      { message: 'Reply deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting forum reply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

