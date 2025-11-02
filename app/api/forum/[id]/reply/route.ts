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

    // Get populated post
    const populatedPost = await prisma.forumPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: { id: true, username: true },
        },
        replies: true,
      },
    });

    const formattedPost = populatedPost ? {
      ...populatedPost,
      authorId: {
        _id: populatedPost.author.id,
        username: populatedPost.author.username,
      },
    } : null;

    return NextResponse.json({ post: formattedPost }, { status: 200 });
  } catch (error) {
    console.error('Error adding reply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

