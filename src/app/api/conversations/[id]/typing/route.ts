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
    const body = await req.json();
    const { isTyping } = body;

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

    // Broadcast typing indicator to partner
    broadcastToUser(partner.userId, {
      type: 'typing',
      data: {
        conversationId,
        userId: user.id,
        username: user.username,
        isTyping: !!isTyping,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CONVERSATION_TYPING_ERROR]', error);
    return NextResponse.json({ error: 'Failed to broadcast typing.' }, { status: 500 });
  }
}
