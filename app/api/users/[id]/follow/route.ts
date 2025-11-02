import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
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

    // Check if users exist
    const [currentUserDoc, targetUserDoc] = await Promise.all([
      prisma.user.findUnique({ where: { id: currentUser.id } }),
      prisma.user.findUnique({ where: { id: targetUserId } }),
    ]);

    if (!currentUserDoc || !targetUserDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already following
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.userFollow.delete({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: targetUserId,
          },
        },
      });
    } else {
      // Follow
      await prisma.userFollow.create({
        data: {
          followerId: currentUser.id,
          followingId: targetUserId,
        },
      });
    }

    // Get updated counts
    const [followersCount, followingCount] = await Promise.all([
      prisma.userFollow.count({ where: { followingId: targetUserId } }),
      prisma.userFollow.count({ where: { followerId: currentUser.id } }),
    ]);

    return NextResponse.json(
      {
        following: !existingFollow,
        followersCount,
        followingCount,
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

