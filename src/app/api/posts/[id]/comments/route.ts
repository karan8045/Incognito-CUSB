import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isBlockActive } from '@/lib/blocks';
import { processMentions, sendNotification } from '@/lib/notifications';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required to comment.' }, { status: 401 });
    }

    const { id: postId } = params;
    const body = await req.json();
    const { content, parentId } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content cannot be empty.' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        title: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    // Mutual block check with post author
    const blockedWithPostAuthor = await isBlockActive(user.id, post.authorId);
    if (blockedWithPostAuthor) {
      return NextResponse.json(
        { error: 'You cannot comment on this post.' },
        { status: 403 }
      );
    }

    // If this is a nested reply, check parent comment author block
    let parentComment: { id: string; authorId: string } | null = null;
    if (parentId) {
      parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, authorId: true },
      });
      if (parentComment) {
        const blockedWithParentAuthor = await isBlockActive(user.id, parentComment.authorId);
        if (blockedWithParentAuthor) {
          return NextResponse.json(
            { error: 'You cannot reply to this comment.' },
            { status: 403 }
          );
        }
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        postId,
        authorId: user.id,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            semester: true,
          },
        },
      },
    });

    // Update post comments count
    await prisma.post.update({
      where: { id: postId },
      data: {
        commentsCount: { increment: 1 },
      },
    });

    // Notifications:
    // 1. If replying to a parent comment -> notify parent comment author
    if (parentComment && parentComment.authorId !== user.id) {
      await sendNotification({
        userId: parentComment.authorId,
        actorId: user.id,
        type: 'COMMENT_REPLY',
        title: 'New Reply',
        message: `@${user.username} replied to your comment on "${post.title.slice(0, 30)}"`,
        link: `/post/${postId}`,
      });
    } else if (!parentComment && post.authorId !== user.id) {
      // 2. If top-level comment on post -> notify post author
      await sendNotification({
        userId: post.authorId,
        actorId: user.id,
        type: 'POST_REPLY',
        title: 'New Comment',
        message: `@${user.username} commented on your post "${post.title.slice(0, 30)}"`,
        link: `/post/${postId}`,
      });
    }

    // 3. Process @username mentions inside the comment
    await processMentions(
      content,
      user.id,
      user.username,
      postId,
      comment.id
    );

    return NextResponse.json(
      {
        comment: {
          id: comment.id,
          content: comment.content,
          parentId: comment.parentId,
          upvotesCount: 0,
          createdAt: comment.createdAt,
          userVote: 0,
          author: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar,
            semester: user.semester,
            isDeleted: false,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[CREATE_COMMENT_ERROR]', error);
    return NextResponse.json({ error: 'Failed to post comment.' }, { status: 500 });
  }
}
