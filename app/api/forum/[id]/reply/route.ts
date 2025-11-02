import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await requireAuth();
    const { content } = await request.json();
    const resolvedParams = await Promise.resolve(params);
    const postId = resolvedParams.id;

    if (!content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify post exists
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Create reply
    const reply = await prisma.forumReply.create({
      data: {
        postId,
        userId: user.id,
        content,
      },
    });

    // Get populated post with formatted replies
    const populatedPost = await prisma.forumPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: { id: true, username: true },
        },
        replies: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!populatedPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Format replies with user info and IDs
    const formattedReplies = await Promise.all(
      populatedPost.replies.map(async (reply) => {
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
      ...populatedPost,
      _id: populatedPost.id,
      authorId: {
        _id: populatedPost.author.id,
        username: populatedPost.author.username,
      },
      replies: formattedReplies,
      timestamp: populatedPost.timestamp.toISOString(),
    };

    return NextResponse.json({ post: formattedPost }, { status: 200 });
  } catch (error) {
    console.error('Error adding reply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

