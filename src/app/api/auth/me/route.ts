import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null });
    }

    // Get unread notifications count
    const unreadNotificationsCount = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    // Get pending chat requests count
    const pendingChatRequestsCount = await prisma.chatRequest.count({
      where: {
        receiverId: user.id,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      user,
      counts: {
        unreadNotifications: unreadNotificationsCount,
        pendingChatRequests: pendingChatRequestsCount,
      },
    });
  } catch (error) {
    console.error('[AUTH_ME_ERROR]', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
