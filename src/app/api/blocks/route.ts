import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const blocks = await prisma.block.findMany({
      where: { blockerId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      blockedUsers: blocks.map((b) => ({
        id: b.blocked.id,
        username: b.blocked.username,
        displayName: b.blocked.displayName,
        avatar: b.blocked.avatar,
        blockedAt: b.createdAt,
      })),
    });
  } catch (error) {
    console.error('[GET_BLOCKS_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch blocked users.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json();
    const { targetUserId, action = 'BLOCK' } = body; // action: 'BLOCK' | 'UNBLOCK'

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID is required.' }, { status: 400 });
    }

    if (targetUserId === user.id) {
      return NextResponse.json({ error: 'You cannot block yourself.' }, { status: 400 });
    }

    if (action === 'UNBLOCK') {
      await prisma.block.deleteMany({
        where: {
          blockerId: user.id,
          blockedId: targetUserId,
        },
      });

      await logAuditEvent('UNBLOCK_USER', user.id, req, { targetUserId });

      return NextResponse.json({ success: true, message: 'User unblocked successfully.' });
    }

    // Default: BLOCK
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { username: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    await prisma.block.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: user.id,
          blockedId: targetUserId,
        },
      },
      create: {
        blockerId: user.id,
        blockedId: targetUserId,
      },
      update: {},
    });

    // Also update any pending chat requests between them to BLOCKED
    await prisma.chatRequest.updateMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: user.id },
        ],
      },
      data: { status: 'BLOCKED' },
    });

    await logAuditEvent('BLOCK_USER', user.id, req, { targetUserId });

    return NextResponse.json({
      success: true,
      message: `@${targetUser.username} has been blocked.`,
    });
  } catch (error) {
    console.error('[BLOCK_USER_ERROR]', error);
    return NextResponse.json({ error: 'Failed to process block action.' }, { status: 500 });
  }
}
