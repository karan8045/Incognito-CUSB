import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { slug } = params;
    const department = await prisma.department.findUnique({
      where: { slug },
    });

    if (!department) {
      return NextResponse.json({ error: 'Department not found.' }, { status: 404 });
    }

    const existing = await prisma.departmentSubscription.findUnique({
      where: {
        userId_departmentId: {
          userId: user.id,
          departmentId: department.id,
        },
      },
    });

    if (existing) {
      await prisma.departmentSubscription.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({
        subscribed: false,
        message: `Notifications turned off for ${department.name}`,
      });
    } else {
      await prisma.departmentSubscription.create({
        data: {
          userId: user.id,
          departmentId: department.id,
        },
      });
      return NextResponse.json({
        subscribed: true,
        message: `Notifications turned on for ${department.name}`,
      });
    }
  } catch (error) {
    console.error('[DEPT_SUBSCRIBE_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to update department subscription.' },
      { status: 500 }
    );
  }
}
