import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiCache, getCacheTTL, generateKey } from '@/lib/apiCache';

// Invalidate cache when user is updated
function invalidateUserCache(userId: string) {
  apiCache.invalidate(`/api/users/${userId}`);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams.id;

    // Check cache for user profiles (cache for longer as they change rarely)
    const cacheKey = generateKey(`/api/users/${userId}`);
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        status: 200,
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
        },
      });
    }

    // Optimize: Use _count for followers/following instead of fetching all records
    const [user, plants, followerCount, followingCount, followers, following] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          bio: true,
          locationZip: true,
          joinDate: true,
          tradesCompleted: true,
          emailNotifications: true,
          tradeNotifications: true,
          messageNotifications: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.plant.findMany({
        where: { ownerId: userId },
        select: {
          id: true,
          name: true,
          scientificName: true,
          description: true,
          imageURL: true,
          type: true,
          maintenanceLevel: true,
          tradeStatus: true,
          nativeRegion: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      // Only get counts for quick display
      prisma.userFollow.count({
        where: { followingId: userId },
      }),
      prisma.userFollow.count({
        where: { followerId: userId },
      }),
      // Only fetch limited followers/following for display (first 10)
      prisma.userFollow.findMany({
        where: { followingId: userId },
        select: {
          follower: {
            select: { id: true, username: true },
          },
        },
        take: 10,
      }),
      prisma.userFollow.findMany({
        where: { followerId: userId },
        select: {
          following: {
            select: { id: true, username: true },
          },
        },
        take: 10,
      }),
    ]);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const response = {
      user: {
        ...user,
        plants,
        followerCount,
        followingCount,
        followers: followers.map((f) => f.follower),
        following: following.map((f) => f.following),
      },
    };

    // Cache user profiles for 60 seconds
    const ttl = getCacheTTL('/api/users');
    apiCache.set(cacheKey, response, ttl);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const currentUser = await requireAuth();
    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams.id;

    // Only allow users to update their own profile
    if (currentUser.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only update your own profile' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { bio, locationZip } = body;

    // Validate bio length
    if (bio !== undefined && bio.length > 500) {
      return NextResponse.json(
        { error: 'Bio must be 500 characters or less' },
        { status: 400 }
      );
    }

    // Validate zip code format if provided
    if (locationZip !== undefined && locationZip !== '' && !/^\d{5}$/.test(locationZip)) {
      return NextResponse.json(
        { error: 'Zip code must be exactly 5 digits' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (bio !== undefined) updateData.bio = bio;
    if (locationZip !== undefined) updateData.locationZip = locationZip;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        locationZip: true,
        joinDate: true,
        tradesCompleted: true,
        emailNotifications: true,
        tradeNotifications: true,
        messageNotifications: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Invalidate cache after updating user
    invalidateUserCache(userId);

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating user:', error);
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

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
    const currentUser = await requireAuth();
    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams.id;

    // Only allow users to delete their own account
    if (currentUser.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only delete your own account' },
        { status: 403 }
      );
    }

    // Delete all related data in transaction
    await prisma.$transaction([
      prisma.plant.deleteMany({ where: { ownerId: userId } }),
      prisma.trade.deleteMany({ where: { ownerId: userId } }),
      prisma.message.deleteMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
      }),
      prisma.forumPost.deleteMany({ where: { authorId: userId } }),
      prisma.userFollow.deleteMany({
        where: {
          OR: [{ followerId: userId }, { followingId: userId }],
        },
      }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return NextResponse.json(
      { message: 'Account deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
