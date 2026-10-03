import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();

    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            posts: true,
            subscriptions: true,
          },
        },
        subscriptions: user
          ? {
              where: { userId: user.id },
              select: { id: true },
            }
          : false,
      },
    });

    const formatted = departments.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      description: d.description,
      postsCount: d._count.posts,
      subscribersCount: d._count.subscriptions,
      isSubscribed: user ? d.subscriptions.length > 0 : false,
    }));

    return NextResponse.json({ departments: formatted });
  } catch (error) {
    console.error('[GET_DEPARTMENTS_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments.' },
      { status: 500 }
    );
  }
}
