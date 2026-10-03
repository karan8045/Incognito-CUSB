import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isDeleted: true,
          },
        },
      },
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    const formatted = notifications.map((n) => {
      const isActorDeleted = n.actor?.isDeleted;
      return {
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        isRead: n.isRead,
        createdAt: n.createdAt,
        actor: n.actor
          ? {
              id: n.actor.id,
              username: isActorDeleted ? 'deleted_user' : n.actor.username,
              displayName: isActorDeleted ? 'Deleted User' : n.actor.displayName,
              avatar: isActorDeleted ? '/avatar-deleted.svg' : n.actor.avatar,
            }
          : null,
      };
    });

    return NextResponse.json({
      notifications: formatted,
      unreadCount,
    });
  } catch (error) {
    console.error('[GET_NOTIFICATIONS_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch notifications.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId, markAll = false } = body;

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'All marked as read.' });
    }

    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId, userId: user.id },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  } catch (error) {
    console.error('[UPDATE_NOTIFICATIONS_ERROR]', error);
    return NextResponse.json({ error: 'Failed to update notifications.' }, { status: 500 });
  }
}
