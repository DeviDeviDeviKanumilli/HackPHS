import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Plant from '@/models/Plant';
import { requireAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await requireAuth();
    const resolvedParams = await Promise.resolve(params);
    const plantId = resolvedParams.id;

    await dbConnect();

    const plant = await Plant.findById(plantId);
    if (!plant) {
      return NextResponse.json(
        { error: 'Plant not found' },
        { status: 404 }
      );
    }

    const userId = user.id as string;
    const likedBy = plant.likedBy.map((id: any) => id.toString());

    if (likedBy.includes(userId)) {
      // Unlike
      plant.likedBy = plant.likedBy.filter(
        (id: any) => id.toString() !== userId
      );
    } else {
      // Like
      plant.likedBy.push(userId);
    }

    await plant.save();

    return NextResponse.json(
      { liked: !likedBy.includes(userId), likes: plant.likedBy.length },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

