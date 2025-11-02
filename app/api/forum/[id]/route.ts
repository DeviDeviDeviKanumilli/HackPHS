import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const postId = resolvedParams.id;

    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        title: true,
        content: true,
        category: true,
        timestamp: true,
        createdAt: true,
        author: {
          select: { id: true, username: true },
        },
        replies: {
          select: {
            id: true,
            postId: true,
            authorId: true,
            content: true,
            timestamp: true,
            createdAt: true,
            author: {
              select: { id: true, username: true },
            },
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

    const formattedPost = {
      ...post,
      authorId: {
        _id: post.author.id,
        username: post.author.username,
      },
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

