import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getMutualBlockedUserIds } from '@/lib/blocks';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') || '').trim();

    if (!query) {
      return NextResponse.json({ users: [], posts: [], departments: [] });
    }

    const cleanQuery = query.replace(/^@/, '').toLowerCase();
    const currentUser = await getCurrentUser();
    const blockedIds = currentUser ? await getMutualBlockedUserIds(currentUser.id) : [];

    // 1. Search Users (exact or partial username or displayName)
    const users = await prisma.user.findMany({
      where: {
        isDeleted: false,
        id: { notIn: blockedIds },
        OR: [
          { username: { contains: cleanQuery } },
          { displayName: { contains: query } },
        ],
      },
      take: 10,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        semester: true,
        bio: true,
      },
      orderBy: {
        username: 'asc',
      },
    });

    // 2. Search Posts (title or content)
    const posts = await prisma.post.findMany({
      where: {
        isReported: false,
        authorId: { notIn: blockedIds },
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
        ],
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            username: true,
            displayName: true,
            avatar: true,
            isDeleted: true,
          },
        },
        department: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    // 3. Search Departments (name or description)
    const departments = await prisma.department.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { slug: { contains: cleanQuery } },
          { description: { contains: query } },
        ],
      },
      take: 10,
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    const formattedPosts = posts.map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content.slice(0, 160),
      score: p.score,
      commentsCount: p.commentsCount,
      createdAt: p.createdAt,
      department: p.department,
      author: {
        username: p.author.isDeleted ? 'deleted_user' : p.author.username,
        displayName: p.author.isDeleted ? 'Deleted User' : p.author.displayName,
        avatar: p.author.isDeleted ? '/avatar-deleted.svg' : p.author.avatar,
      },
    }));

    return NextResponse.json({
      users,
      posts: formattedPosts,
      departments: departments.map((d) => ({
        id: d.id,
        name: d.name,
        slug: d.slug,
        description: d.description,
        postsCount: d._count.posts,
      })),
    });
  } catch (error) {
    console.error('[GLOBAL_SEARCH_ERROR]', error);
    return NextResponse.json({ error: 'Search failed.' }, { status: 500 });
  }
}
