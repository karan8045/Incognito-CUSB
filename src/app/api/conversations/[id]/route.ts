import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isBlockActive } from '@/lib/blocks';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
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
                bio: true,
                isDeleted: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100,
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                isDeleted: true,
              },
            },
            replyTo: {
              select: {
                id: true,
                content: true,
                sender: {
                  select: {
                    username: true,
                    displayName: true,
                  },
                },
              },
            },
            reactions: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
    }

    // Verify participant
    const isParticipant = conversation.participants.some((p) => p.userId === user.id);
    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    const otherParticipant = conversation.participants.find((p) => p.userId !== user.id)?.user;
    if (!otherParticipant) {
      return NextResponse.json({ error: 'Conversation participant not found.' }, { status: 404 });
    }

    // Block verification
    const blocked = await isBlockActive(user.id, otherParticipant.id);
    if (blocked) {
      return NextResponse.json(
        { error: 'Cannot access this conversation due to blocking.' },
        { status: 403 }
      );
    }

    const isOtherDeleted = otherParticipant.isDeleted;

    const formattedMessages = conversation.messages.map((m) => ({
      id: m.id,
      content: m.content,
      messageType: m.messageType,
      mediaUrl: m.mediaUrl,
      fileName: m.fileName,
      fileSize: m.fileSize,
      senderId: m.senderId,
      isRead: m.isRead,
      createdAt: m.createdAt,
      isMine: m.senderId === user.id,
      sender: {
        id: m.sender.id,
        username: m.sender.isDeleted ? 'deleted_user' : m.sender.username,
        displayName: m.sender.isDeleted ? 'Deleted User' : m.sender.displayName,
        avatar: m.sender.isDeleted ? '/avatar-deleted.svg' : m.sender.avatar,
      },
      replyTo: m.replyTo
        ? {
            id: m.replyTo.id,
            content: m.replyTo.content,
            authorName: m.replyTo.sender.displayName,
          }
        : null,
      reactions: m.reactions.map((r) => ({
        id: r.id,
        emoji: r.emoji,
        userId: r.userId,
        username: r.user.username,
      })),
    }));

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        otherUser: {
          id: otherParticipant.id,
          username: isOtherDeleted ? 'deleted_user' : otherParticipant.username,
          displayName: isOtherDeleted ? 'Deleted User' : otherParticipant.displayName,
          avatar: isOtherDeleted ? '/avatar-deleted.svg' : otherParticipant.avatar,
          semester: isOtherDeleted ? null : otherParticipant.semester,
          bio: isOtherDeleted ? null : otherParticipant.bio,
          isDeleted: isOtherDeleted,
        },
        messages: formattedMessages,
      },
    });
  } catch (error) {
    console.error('[GET_CONVERSATION_DETAIL_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch conversation.' }, { status: 500 });
  }
}
