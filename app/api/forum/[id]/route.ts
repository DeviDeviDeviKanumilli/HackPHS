import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiCache } from '@/lib/apiCache';

async function invalidateForumCache() {
  await apiCache.invalidate('/api/forum');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const postId = resolvedParams.id;

    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: { id: true, username: true },
        },
        replies: {
          include: {
            post: false, // Don't include post to avoid circular reference
          },
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Fetch user info for each reply
    const formattedReplies = await Promise.all(
      post.replies.map(async (reply) => {
        const user = await prisma.user.findUnique({
          where: { id: reply.userId },
          select: { id: true, username: true },
        });
        return {
          id: reply.id,
          _id: reply.id,
          userId: {
            _id: reply.userId,
            username: user?.username || 'Unknown',
          },
          content: reply.content,
          timestamp: reply.timestamp.toISOString(),
        };
      })
    );

    const formattedPost = {
      ...post,
      _id: post.id,
      id: post.id,
      timestamp: post.timestamp.toISOString(),
      authorId: {
        _id: post.author.id,
        username: post.author.username,
      },
      replies: formattedReplies,
    };

    return NextResponse.json({ post: formattedPost }, { status: 200 });
  } catch (error) {
    console.error('Error fetching forum post:', error);
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
    const postId = resolvedParams.id;

    // Find the post and verify ownership
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Only the author can delete their post
    if (post.authorId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only delete your own posts' },
        { status: 403 }
      );
    }

    // Delete the post (replies will be deleted via cascade)
    await prisma.forumPost.delete({
      where: { id: postId },
    });

    // Invalidate cache
    await invalidateForumCache();

    return NextResponse.json(
      { message: 'Post deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting forum post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
