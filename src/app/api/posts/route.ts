import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getMutualBlockedUserIds } from '@/lib/blocks';
import { processMentions, sendNotification } from '@/lib/notifications';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentSlug = searchParams.get('department');
    const sort = searchParams.get('sort') || 'latest'; // 'latest' | 'popular'
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const skip = (page - 1) * limit;

    const user = await getCurrentUser();

    // Mutual blocking filter
    const blockedUserIds = user ? await getMutualBlockedUserIds(user.id) : [];

    // Filter by department if requested
    let departmentId: string | null | undefined = undefined;
    if (departmentSlug) {
      const dept = await prisma.department.findUnique({
        where: { slug: departmentSlug },
        select: { id: true },
      });
      if (dept) {
        departmentId = dept.id;
      } else {
        return NextResponse.json({ posts: [], hasMore: false });
      }
    } else if (searchParams.get('feed') === 'global') {
      // Global feed specifically shows posts where departmentId is null
      departmentId = null;
    }

    const whereClause: any = {
      isReported: false, // Standard public feed filter
    };

    if (departmentId !== undefined) {
      whereClause.departmentId = departmentId;
    }

    if (blockedUserIds.length > 0) {
      whereClause.authorId = { notIn: blockedUserIds };
    }

    // Sort order
    const orderBy: any =
      sort === 'popular'
        ? [{ score: 'desc' }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }];

    const posts = await prisma.post.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: limit + 1,
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
      },
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;

    const formatted = items.map((p) => {
      const isDeletedAuthor = p.author.isDeleted;
      const userVote = user && p.votes && p.votes.length > 0 ? p.votes[0].value : 0;

      return {
        id: p.id,
        title: p.title,
        content: p.content,
        postType: p.postType,
        mediaUrl: p.mediaUrl,
        mediaType: p.mediaType,
        fileName: p.fileName,
        fileSize: p.fileSize,
        linkUrl: p.linkUrl,
        upvotesCount: p.upvotesCount,
        downvotesCount: p.downvotesCount,
        score: p.score,
        commentsCount: p.commentsCount,
        createdAt: p.createdAt,
        department: p.department,
        author: {
          id: p.author.id,
          username: isDeletedAuthor ? 'deleted_user' : p.author.username,
          displayName: isDeletedAuthor ? 'Deleted User' : p.author.displayName,
          avatar: isDeletedAuthor ? '/avatar-deleted.svg' : p.author.avatar,
          semester: isDeletedAuthor ? null : p.author.semester,
          isDeleted: isDeletedAuthor,
        },
        userVote, // 1, -1, or 0
      };
    });

    return NextResponse.json({
      posts: formatted,
      hasMore,
      page,
    });
  } catch (error) {
    console.error('[GET_POSTS_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch posts.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required to post.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      content,
      postType = 'TEXT',
      mediaUrl,
      mediaType,
      fileName,
      fileSize,
      linkUrl,
      departmentId,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Post title is required.' }, { status: 400 });
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Post content cannot be empty.' }, { status: 400 });
    }

    // Verify department if specified
    let validatedDeptId: string | null = null;
    let departmentName = '';
    if (departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: departmentId },
      });
      if (dept) {
        validatedDeptId = dept.id;
        departmentName = dept.name;
      }
    }

    const post = await prisma.post.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        postType,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
        linkUrl: linkUrl?.trim() || null,
        authorId: user.id,
        departmentId: validatedDeptId,
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
        department: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // 1. Process @username mentions
    await processMentions(
      `${title} ${content}`,
      user.id,
      user.username,
      post.id
    );

    // 2. Department notifications if posted to a department
    if (validatedDeptId) {
      const subscribers = await prisma.departmentSubscription.findMany({
        where: {
          departmentId: validatedDeptId,
          userId: { not: user.id },
        },
        select: { userId: true },
      });

      for (const sub of subscribers) {
        await sendNotification({
          userId: sub.userId,
          actorId: user.id,
          type: 'DEPT_POST',
          title: `New in ${departmentName}`,
          message: `@${user.username} posted: "${post.title.slice(0, 60)}"`,
          link: `/post/${post.id}`,
        });
      }
    }

    // 3. Log audit event
    await logAuditEvent('POST_CREATE', user.id, req, {
      postId: post.id,
      departmentId: validatedDeptId,
    });

    return NextResponse.json(
      {
        post: {
          ...post,
          userVote: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[CREATE_POST_ERROR]', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while creating the post.' },
      { status: 500 }
    );
  }
}
