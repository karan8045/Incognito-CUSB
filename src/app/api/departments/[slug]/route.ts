import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const user = await getCurrentUser();

    const department = await prisma.department.findUnique({
      where: { slug },
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

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      department: {
        id: department.id,
        name: department.name,
        slug: department.slug,
        description: department.description,
        postsCount: department._count.posts,
        subscribersCount: department._count.subscriptions,
        isSubscribed: user ? department.subscriptions.length > 0 : false,
      },
    });
  } catch (error) {
    console.error('[GET_DEPARTMENT_SLUG_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch department.' },
      { status: 500 }
    );
  }
}
