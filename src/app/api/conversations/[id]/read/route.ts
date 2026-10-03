import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { broadcastToUser } from '@/lib/realtime';

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

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
    }

    const partner = conversation.participants.find((p) => p.userId !== user.id);
    if (!partner) {
      return NextResponse.json({ success: true });
    }

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: partner.userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // Update participant lastReadAt
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.id,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    // Broadcast read receipt to partner
    broadcastToUser(partner.userId, {
      type: 'read',
      data: {
        conversationId,
        readByUserId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CONVERSATION_READ_ERROR]', error);
    return NextResponse.json({ error: 'Failed to mark read.' }, { status: 500 });
  }
}
