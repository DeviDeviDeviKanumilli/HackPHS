import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Plant from '@/models/Plant';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await dbConnect();
    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams.id;

    const user = await User.findById(userId)
      .select('-passwordHash')
      .populate('followers', 'username')
      .populate('following', 'username');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const plants = await Plant.find({ ownerId: userId }).sort({ createdAt: -1 });

    return NextResponse.json(
      {
        user: {
          ...user.toObject(),
          plants,
        },
      },
      { status: 200 }
    );
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

    await dbConnect();

    const updateData: any = {};
    if (bio !== undefined) updateData.bio = bio;
    if (locationZip !== undefined) updateData.locationZip = locationZip;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

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

