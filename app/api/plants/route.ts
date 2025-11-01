import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Plant from '@/models/Plant';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const ownerId = searchParams.get('ownerId');

    let query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { scientificName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (ownerId) {
      query.ownerId = ownerId;
    }

    const plants = await Plant.find(query)
      .populate('ownerId', 'username')
      .sort({ createdAt: -1 });

    return NextResponse.json({ plants }, { status: 200 });
  } catch (error) {
    console.error('Error fetching plants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const plantData = await request.json();

    if (!plantData.name || !plantData.description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await dbConnect();

    const plant = await Plant.create({
      ...plantData,
      ownerId: user.id,
    });

    // Add plant to user's plants array
    await User.findByIdAndUpdate(user.id, {
      $push: { plants: plant._id }
    });

    const populatedPlant = await Plant.findById(plant._id)
      .populate('ownerId', 'username');

    return NextResponse.json({ plant: populatedPlant }, { status: 201 });
  } catch (error) {
    console.error('Error creating plant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

