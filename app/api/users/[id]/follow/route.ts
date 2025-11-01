import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const currentUser = await requireAuth();
    const resolvedParams = await Promise.resolve(params);
    const targetUserId = resolvedParams.id;

    if (currentUser.id === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    await dbConnect();

    const currentUserDoc = await User.findById(currentUser.id);
    const targetUserDoc = await User.findById(targetUserId);

    if (!currentUserDoc || !targetUserDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isFollowing = currentUserDoc.following.some(
      (id: any) => id.toString() === targetUserId
    );

    if (isFollowing) {
      // Unfollow
      currentUserDoc.following = currentUserDoc.following.filter(
        (id: any) => id.toString() !== targetUserId
      );
      targetUserDoc.followers = targetUserDoc.followers.filter(
        (id: any) => id.toString() !== currentUser.id
      );
    } else {
      // Follow
      currentUserDoc.following.push(targetUserId);
      targetUserDoc.followers.push(currentUser.id);
    }

    await currentUserDoc.save();
    await targetUserDoc.save();

    return NextResponse.json(
      {
        following: !isFollowing,
        followersCount: targetUserDoc.followers.length,
        followingCount: currentUserDoc.following.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error toggling follow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

