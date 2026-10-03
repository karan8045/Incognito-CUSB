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

    const { id: messageId } = params;
    const body = await req.json();
    const { emoji } = body;

    if (!emoji || typeof emoji !== 'string') {
      return NextResponse.json({ error: 'Emoji is required.' }, { status: 400 });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: { participants: true },
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
    }

    const isParticipant = message.conversation.participants.some((p) => p.userId === user.id);
    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    // Toggle reaction: if already exists, remove it; otherwise create it
    const existing = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: user.id,
          emoji,
        },
      },
    });

    let action: 'added' | 'removed' = 'added';
    if (existing) {
      await prisma.messageReaction.delete({
        where: { id: existing.id },
      });
      action = 'removed';
    } else {
      await prisma.messageReaction.create({
        data: {
          messageId,
          userId: user.id,
          emoji,
        },
      });
      action = 'added';
    }

    // Fetch updated reactions
    const reactions = await prisma.messageReaction.findMany({
      where: { messageId },
      include: {
        user: { select: { id: true, username: true } },
      },
    });

    const partner = message.conversation.participants.find((p) => p.userId !== user.id);
    if (partner) {
      broadcastToUser(partner.userId, {
        type: 'reaction',
        data: {
          messageId,
          conversationId: message.conversationId,
          reactions: reactions.map((r) => ({
            id: r.id,
            emoji: r.emoji,
            userId: r.userId,
            username: r.user.username,
          })),
        },
      });
    }

    return NextResponse.json({
      action,
      reactions: reactions.map((r) => ({
        id: r.id,
        emoji: r.emoji,
        userId: r.userId,
        username: r.user.username,
      })),
    });
  } catch (error) {
    console.error('[MESSAGE_REACT_ERROR]', error);
    return NextResponse.json({ error: 'Failed to react.' }, { status: 500 });
  }
}
