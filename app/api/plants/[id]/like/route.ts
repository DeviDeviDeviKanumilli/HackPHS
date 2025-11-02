import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await requireAuth();
    const resolvedParams = await Promise.resolve(params);
    const plantId = resolvedParams.id;

    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
      include: { likedBy: true },
    });

    if (!plant) {
      return NextResponse.json(
        { error: 'Plant not found' },
        { status: 404 }
      );
    }

    const userId = user.id;
    const isLiked = plant.likedBy.some((u) => u.id === userId);

    if (isLiked) {
      // Unlike - disconnect relation
      await prisma.plant.update({
        where: { id: plantId },
        data: {
          likedBy: {
            disconnect: { id: userId },
          },
        },
      });
    } else {
      // Like - connect relation
      await prisma.plant.update({
        where: { id: plantId },
        data: {
          likedBy: {
            connect: { id: userId },
          },
        },
      });
    }

    // Get updated likes count
    const updatedPlant = await prisma.plant.findUnique({
      where: { id: plantId },
      include: { likedBy: true },
    });

    return NextResponse.json(
      { liked: !isLiked, likes: updatedPlant?.likedBy.length || 0 },
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

