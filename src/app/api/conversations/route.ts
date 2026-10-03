import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getMutualBlockedUserIds } from '@/lib/blocks';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const blockedIds = await getMutualBlockedUserIds(user.id);

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId: user.id },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                semester: true,
                isDeleted: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const formatted = conversations
      .filter((c) => {
        // Find other participant
        const other = c.participants.find((p) => p.userId !== user.id)?.user;
        if (!other) return false;
        // Filter out if blocked
        if (blockedIds.includes(other.id)) return false;
        return true;
      })
      .map((c) => {
        const myParticipant = c.participants.find((p) => p.userId === user.id);
        const otherUser = c.participants.find((p) => p.userId !== user.id)!.user;
        const lastMsg = c.messages[0] || null;

        const isDeleted = otherUser.isDeleted;

        return {
          id: c.id,
          lastMessageAt: c.lastMessageAt,
          otherUser: {
            id: otherUser.id,
            username: isDeleted ? 'deleted_user' : otherUser.username,
            displayName: isDeleted ? 'Deleted User' : otherUser.displayName,
            avatar: isDeleted ? '/avatar-deleted.svg' : otherUser.avatar,
            semester: isDeleted ? null : otherUser.semester,
            isDeleted,
          },
          lastMessage: lastMsg
            ? {
                id: lastMsg.id,
                content: lastMsg.content,
                messageType: lastMsg.messageType,
                mediaUrl: lastMsg.mediaUrl,
                createdAt: lastMsg.createdAt,
                senderId: lastMsg.senderId,
                isRead: lastMsg.isRead,
              }
            : null,
          unreadCount: 0, // Calculated dynamically or via lastReadAt
        };
      });

    return NextResponse.json({ conversations: formatted });
  } catch (error) {
    console.error('[GET_CONVERSATIONS_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch conversations.' }, { status: 500 });
  }
}
