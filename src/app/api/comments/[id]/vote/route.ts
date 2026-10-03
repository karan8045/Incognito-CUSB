import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isBlockActive } from '@/lib/blocks';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required to vote.' }, { status: 401 });
    }

    const { id: commentId } = params;
    const body = await req.json();
    const { value } = body; // 1, -1, or 0

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true, upvotesCount: true },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });
    }

    const blocked = await isBlockActive(user.id, comment.authorId);
    if (blocked) {
      return NextResponse.json({ error: 'Interaction blocked.' }, { status: 403 });
    }

    const existingVote = await prisma.commentVote.findUnique({
      where: {
        userId_commentId: {
          userId: user.id,
          commentId,
        },
      },
    });

    let newVoteValue = value;

    if (existingVote) {
      if (value === 0 || existingVote.value === value) {
        await prisma.commentVote.delete({ where: { id: existingVote.id } });
        newVoteValue = 0;
      } else {
        await prisma.commentVote.update({
          where: { id: existingVote.id },
          data: { value },
        });
      }
    } else if (value !== 0) {
      await prisma.commentVote.create({
        data: {
          userId: user.id,
          commentId,
          value,
        },
      });
    }

    const [upCount, downCount] = await Promise.all([
      prisma.commentVote.count({ where: { commentId, value: 1 } }),
      prisma.commentVote.count({ where: { commentId, value: -1 } }),
    ]);

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        upvotesCount: upCount - downCount,
      },
      select: { upvotesCount: true },
    });

    return NextResponse.json({
      userVote: newVoteValue,
      upvotesCount: updated.upvotesCount,
    });
  } catch (error) {
    console.error('[COMMENT_VOTE_ERROR]', error);
    return NextResponse.json({ error: 'Failed to record comment vote.' }, { status: 500 });
  }
}
