import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ForumPost from '@/models/ForumPost';
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

    await dbConnect();

    const post = await ForumPost.findById(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    post.replies.push({
      userId: user.id,
      content,
      timestamp: new Date(),
    });

    await post.save();

    const populatedPost = await ForumPost.findById(post._id)
      .populate('authorId', 'username')
      .populate('replies.userId', 'username');

    return NextResponse.json({ post: populatedPost }, { status: 200 });
  } catch (error) {
    console.error('Error adding reply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

