import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isBlockActive } from '@/lib/blocks';
import { broadcastToUser } from '@/lib/realtime';
import { sendNotification } from '@/lib/notifications';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id: conversationId } = params;
    const body = await req.json();
    const {
      content,
      messageType = 'TEXT',
      mediaUrl,
      fileName,
      fileSize,
      replyToId,
    } = body;

    if (!content && !mediaUrl) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
    }

    const isParticipant = conversation.participants.some((p) => p.userId === user.id);
    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const partner = conversation.participants.find((p) => p.userId !== user.id);
    if (!partner) {
      return NextResponse.json({ error: 'Partner not found.' }, { status: 404 });
    }

    // Check block
    const blocked = await isBlockActive(user.id, partner.userId);
    if (blocked) {
      return NextResponse.json(
        { error: 'Cannot send message because of privacy/block settings.' },
        { status: 403 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        content: content?.trim() || '',
        messageType,
        mediaUrl: mediaUrl || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
        replyToId: replyToId || null,
      },
      include: {
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
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    const formattedMessage = {
      id: message.id,
      conversationId: message.conversationId,
      content: message.content,
      messageType: message.messageType,
      mediaUrl: message.mediaUrl,
      fileName: message.fileName,
      fileSize: message.fileSize,
      senderId: message.senderId,
      isRead: false,
      createdAt: message.createdAt,
      isMine: false, // For recipient
      sender: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
      },
      replyTo: message.replyTo
        ? {
            id: message.replyTo.id,
            content: message.replyTo.content,
            authorName: message.replyTo.sender.displayName,
          }
        : null,
      reactions: [],
    };

    // 1. Broadcast real-time message via SSE to partner
    broadcastToUser(partner.userId, {
      type: 'message',
      data: {
        conversationId,
        message: formattedMessage,
      },
    });

    // 2. Send notification to partner
    const preview = message.content
      ? message.content.slice(0, 40)
      : `Sent an attachment (${message.messageType.toLowerCase()})`;

    await sendNotification({
      userId: partner.userId,
      actorId: user.id,
      type: 'NEW_MESSAGE',
      title: `Message from @${user.username}`,
      message: preview,
      link: `/messages?cid=${conversationId}`,
    });

    return NextResponse.json({
      message: {
        ...formattedMessage,
        isMine: true,
      },
    });
  } catch (error) {
    console.error('[SEND_MESSAGE_ERROR]', error);
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 });
  }
}
