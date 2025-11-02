import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const currentUser = await requireAuth();
    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams.id;

    // Only allow users to update their own settings
    if (currentUser.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only update your own settings' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { emailNotifications, tradeNotifications, messageNotifications } = body;

    const updateData: any = {};
    if (emailNotifications !== undefined) {
      updateData.emailNotifications = emailNotifications;
    }
    if (tradeNotifications !== undefined) {
      updateData.tradeNotifications = tradeNotifications;
    }
    if (messageNotifications !== undefined) {
      updateData.messageNotifications = messageNotifications;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        emailNotifications: true,
        tradeNotifications: true,
        messageNotifications: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Settings updated successfully',
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



