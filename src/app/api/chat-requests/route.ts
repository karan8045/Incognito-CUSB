import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isBlockActive } from '@/lib/blocks';
import { sendNotification } from '@/lib/notifications';
import { broadcastToUser } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'received'; // 'received' | 'sent'

    if (type === 'sent') {
      const sentRequests = await prisma.chatRequest.findMany({
        where: { senderId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          receiver: {
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

      return NextResponse.json({
        requests: sentRequests.map((r) => ({
          id: r.id,
          initialMessage: r.initialMessage,
          status: r.status,
          createdAt: r.createdAt,
          user: {
            id: r.receiver.id,
            username: r.receiver.isDeleted ? 'deleted_user' : r.receiver.username,
            displayName: r.receiver.isDeleted ? 'Deleted User' : r.receiver.displayName,
            avatar: r.receiver.isDeleted ? '/avatar-deleted.svg' : r.receiver.avatar,
          },
        })),
      });
    }

    // Default: Received pending requests
    const receivedRequests = await prisma.chatRequest.findMany({
      where: {
        receiverId: user.id,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
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
    });

    return NextResponse.json({
      requests: receivedRequests.map((r) => ({
        id: r.id,
        initialMessage: r.initialMessage,
        status: r.status,
        createdAt: r.createdAt,
        sender: {
          id: r.sender.id,
          username: r.sender.isDeleted ? 'deleted_user' : r.sender.username,
          displayName: r.sender.isDeleted ? 'Deleted User' : r.sender.displayName,
          avatar: r.sender.isDeleted ? '/avatar-deleted.svg' : r.sender.avatar,
          semester: r.sender.semester,
        },
      })),
    });
  } catch (error) {
    console.error('[GET_CHAT_REQUESTS_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch chat requests.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json();
    const { targetUserId, initialMessage } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID is required.' }, { status: 400 });
    }
    if (!initialMessage || !initialMessage.trim()) {
      return NextResponse.json(
        { error: 'An initial message is required to send a chat request.' },
        { status: 400 }
      );
    }
    if (user.id === targetUserId) {
      return NextResponse.json({ error: 'You cannot message yourself.' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, username: true, isDeleted: true },
    });

    if (!targetUser || targetUser.isDeleted) {
      return NextResponse.json({ error: 'User does not exist or has deleted their account.' }, { status: 404 });
    }

    // Backend Block enforcement
    const blocked = await isBlockActive(user.id, targetUser.id);
    if (blocked) {
      return NextResponse.json(
        { error: 'You cannot send chat requests to this user.' },
        { status: 403 }
      );
    }

    // Check if active conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: user.id } } },
          { participants: { some: { userId: targetUser.id } } },
        ],
      },
    });

    if (existingConversation) {
      return NextResponse.json({
        conversationId: existingConversation.id,
        alreadyActive: true,
      });
    }

    // Check existing chat request
    const existingReq = await prisma.chatRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: user.id,
          receiverId: targetUser.id,
        },
      },
    });

    if (existingReq) {
      if (existingReq.status === 'PENDING') {
        // Enforce rule: User A can send exactly ONE message before acceptance!
        return NextResponse.json(
          {
            error:
              'A chat request is already pending with this student. You can only send one message before they accept.',
          },
          { status: 400 }
        );
      }
      if (existingReq.status === 'BLOCKED') {
        return NextResponse.json({ error: 'Unable to send chat request.' }, { status: 403 });
      }
    }

    // Check if target user has sent a request to current user
    const reverseReq = await prisma.chatRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: targetUser.id,
          receiverId: user.id,
        },
      },
    });

    if (reverseReq && reverseReq.status === 'PENDING') {
      // Auto-accept into active conversation
      const conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: [{ userId: user.id }, { userId: targetUser.id }],
          },
        },
      });

      // Create reverse initial message and current message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: targetUser.id,
          content: reverseReq.initialMessage,
        },
      });
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: user.id,
          content: initialMessage.trim(),
        },
      });

      await prisma.chatRequest.update({
        where: { id: reverseReq.id },
        data: { status: 'ACCEPTED' },
      });

      return NextResponse.json({
        conversationId: conversation.id,
        accepted: true,
      });
    }

    // Create the Chat Request (User A's single initial message)
    const chatRequest = await prisma.chatRequest.create({
      data: {
        senderId: user.id,
        receiverId: targetUser.id,
        initialMessage: initialMessage.trim(),
        status: 'PENDING',
      },
    });

    // Notify recipient
    await sendNotification({
      userId: targetUser.id,
      actorId: user.id,
      type: 'CHAT_REQUEST',
      title: 'New Chat Request',
      message: `@${user.username} wants to start a conversation with you.`,
      link: '/messages?tab=requests',
    });

    broadcastToUser(targetUser.id, {
      type: 'chat_request',
      data: {
        id: chatRequest.id,
        senderUsername: user.username,
        initialMessage: chatRequest.initialMessage,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Chat request sent. You can message freely once accepted.',
        chatRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[SEND_CHAT_REQUEST_ERROR]', error);
    return NextResponse.json({ error: 'Failed to send chat request.' }, { status: 500 });
  }
}
