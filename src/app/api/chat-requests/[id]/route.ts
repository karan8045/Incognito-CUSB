import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';
import { broadcastToUser } from '@/lib/realtime';
import { logAuditEvent } from '@/lib/audit';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { action } = body; // 'ACCEPT' | 'REJECT' | 'BLOCK'

    const chatRequest = await prisma.chatRequest.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    if (!chatRequest) {
      return NextResponse.json({ error: 'Chat request not found.' }, { status: 404 });
    }

    if (chatRequest.receiverId !== user.id) {
      return NextResponse.json({ error: 'You are not authorized to respond to this request.' }, { status: 403 });
    }

    if (action === 'ACCEPT') {
      // 1. Create active conversation
      const conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: [
              { userId: chatRequest.senderId },
              { userId: user.id },
            ],
          },
        },
      });

      // 2. Insert the sender's initial message into the conversation
      const initialMsg = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: chatRequest.senderId,
          content: chatRequest.initialMessage,
          messageType: 'TEXT',
        },
      });

      // 3. Mark request as ACCEPTED
      await prisma.chatRequest.update({
        where: { id },
        data: { status: 'ACCEPTED' },
      });

      // 4. Notify sender
      await sendNotification({
        userId: chatRequest.senderId,
        actorId: user.id,
        type: 'CHAT_ACCEPTED',
        title: 'Chat Request Accepted',
        message: `@${user.username} accepted your chat request. You can now chat in real time!`,
        link: `/messages?cid=${conversation.id}`,
      });

      // 5. Broadcast to sender and recipient
      broadcastToUser(chatRequest.senderId, {
        type: 'message',
        data: {
          conversationId: conversation.id,
          message: initialMsg,
        },
      });

      return NextResponse.json({
        success: true,
        conversationId: conversation.id,
        message: 'Chat request accepted.',
      });
    }

    if (action === 'REJECT') {
      await prisma.chatRequest.update({
        where: { id },
        data: { status: 'REJECTED' },
      });

      return NextResponse.json({
        success: true,
        message: 'Chat request rejected.',
      });
    }

    if (action === 'BLOCK') {
      // Create block record
      await prisma.block.upsert({
        where: {
          blockerId_blockedId: {
            blockerId: user.id,
            blockedId: chatRequest.senderId,
          },
        },
        create: {
          blockerId: user.id,
          blockedId: chatRequest.senderId,
        },
        update: {},
      });

      await prisma.chatRequest.update({
        where: { id },
        data: { status: 'BLOCKED' },
      });

      await logAuditEvent('BLOCK_USER', user.id, req, {
        blockedId: chatRequest.senderId,
        fromChatRequest: id,
      });

      return NextResponse.json({
        success: true,
        message: `@${chatRequest.sender.username} has been blocked.`,
      });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    console.error('[CHAT_REQUEST_ACTION_ERROR]', error);
    return NextResponse.json({ error: 'Failed to process chat request.' }, { status: 500 });
  }
}
