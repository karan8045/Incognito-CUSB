import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isBlockActive } from '@/lib/blocks';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const user = await getCurrentUser();

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            semester: true,
            bio: true,
            isDeleted: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        votes: user
          ? {
              where: { userId: user.id },
              select: { value: true },
            }
          : false,
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                semester: true,
                isDeleted: true,
              },
            },
            votes: user
              ? {
                  where: { userId: user.id },
                  select: { value: true },
                }
              : false,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    // Check mutual block with post author
    if (user && (await isBlockActive(user.id, post.author.id))) {
      return NextResponse.json(
        { error: 'You cannot view this post due to privacy settings.' },
        { status: 403 }
      );
    }

    const isDeletedAuthor = post.author.isDeleted;
    const userVote = user && post.votes && post.votes.length > 0 ? post.votes[0].value : 0;

    // Format comments and build tree
    const formattedComments = post.comments.map((c) => {
      const isDeletedCommentAuthor = c.author.isDeleted;
      const cVote = user && c.votes && c.votes.length > 0 ? c.votes[0].value : 0;

      return {
        id: c.id,
        content: c.content,
        parentId: c.parentId,
        upvotesCount: c.upvotesCount,
        createdAt: c.createdAt,
        userVote: cVote,
        author: {
          id: c.author.id,
          username: isDeletedCommentAuthor ? 'deleted_user' : c.author.username,
          displayName: isDeletedCommentAuthor ? 'Deleted User' : c.author.displayName,
          avatar: isDeletedCommentAuthor ? '/avatar-deleted.svg' : c.author.avatar,
          semester: isDeletedCommentAuthor ? null : c.author.semester,
          isDeleted: isDeletedCommentAuthor,
        },
      };
    });

    return NextResponse.json({
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        postType: post.postType,
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        fileName: post.fileName,
        fileSize: post.fileSize,
        linkUrl: post.linkUrl,
        upvotesCount: post.upvotesCount,
        downvotesCount: post.downvotesCount,
        score: post.score,
        commentsCount: post.commentsCount,
        createdAt: post.createdAt,
        department: post.department,
        author: {
          id: post.author.id,
          username: isDeletedAuthor ? 'deleted_user' : post.author.username,
          displayName: isDeletedAuthor ? 'Deleted User' : post.author.displayName,
          avatar: isDeletedAuthor ? '/avatar-deleted.svg' : post.author.avatar,
          semester: isDeletedAuthor ? null : post.author.semester,
          bio: isDeletedAuthor ? null : post.author.bio,
          isDeleted: isDeletedAuthor,
        },
        userVote,
        comments: formattedComments,
      },
    });
  } catch (error) {
    console.error('[GET_POST_DETAIL_ERROR]', error);
    return NextResponse.json({ error: 'Failed to retrieve post.' }, { status: 500 });
  }
}

// Requirement 12: Posts cannot be edited or deleted by users
export async function PATCH() {
  return NextResponse.json(
    { error: 'Published posts cannot be edited on Incognito CUSB.' },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Published posts cannot be deleted. If content violates platform rules, please submit a report.' },
    { status: 403 }
  );
}
