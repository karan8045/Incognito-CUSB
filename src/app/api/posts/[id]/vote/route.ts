import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isBlockActive } from '@/lib/blocks';
import { sendNotification } from '@/lib/notifications';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required to vote.' }, { status: 401 });
    }

    const { id: postId } = params;
    const body = await req.json();
    const { value } = body; // 1 (upvote), -1 (downvote), or 0 (cancel vote)

    if (value !== 1 && value !== -1 && value !== 0) {
      return NextResponse.json({ error: 'Invalid vote value. Must be 1, -1, or 0.' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        title: true,
        upvotesCount: true,
        downvotesCount: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    // Backend Block enforcement
    const blocked = await isBlockActive(user.id, post.authorId);
    if (blocked) {
      return NextResponse.json(
        { error: 'You cannot interact with this post.' },
        { status: 403 }
      );
    }

    const existingVote = await prisma.postVote.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId,
        },
      },
    });

    let newVoteValue = value;

    if (existingVote) {
      if (value === 0 || existingVote.value === value) {
        // Cancel vote
        await prisma.postVote.delete({
          where: { id: existingVote.id },
        });
        newVoteValue = 0;
      } else {
        // Change vote (e.g. +1 to -1 or -1 to +1)
        await prisma.postVote.update({
          where: { id: existingVote.id },
          data: { value },
        });
      }
    } else if (value !== 0) {
      // New vote
      await prisma.postVote.create({
        data: {
          userId: user.id,
          postId,
          value,
        },
      });

      // Send notification if it was an upvote
      if (value === 1 && post.authorId !== user.id) {
        await sendNotification({
          userId: post.authorId,
          actorId: user.id,
          type: 'UPVOTE',
          title: 'Post Upvoted',
          message: `@${user.username} upvoted your post "${post.title.slice(0, 40)}"`,
          link: `/post/${post.id}`,
        });
      }
    }

    // Recalculate upvotes and downvotes accurately
    const [upCount, downCount] = await Promise.all([
      prisma.postVote.count({ where: { postId, value: 1 } }),
      prisma.postVote.count({ where: { postId, value: -1 } }),
    ]);

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        upvotesCount: upCount,
        downvotesCount: downCount,
        score: upCount - downCount,
      },
      select: {
        upvotesCount: true,
        downvotesCount: true,
        score: true,
      },
    });

    return NextResponse.json({
      userVote: newVoteValue,
      upvotesCount: updatedPost.upvotesCount,
      downvotesCount: updatedPost.downvotesCount,
      score: updatedPost.score,
    });
  } catch (error) {
    console.error('[POST_VOTE_ERROR]', error);
    return NextResponse.json({ error: 'Failed to record vote.' }, { status: 500 });
  }
}
