import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json();
    const { displayName, semester, bio } = body;

    if (!displayName || !displayName.trim()) {
      return NextResponse.json({ error: 'Display Name cannot be empty.' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: displayName.trim(),
        semester: semester?.trim() || null,
        bio: bio?.trim() || null,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        semester: true,
        bio: true,
        role: true,
        createdAt: true,
      },
    });

    await logAuditEvent('PROFILE_UPDATE', user.id, req);

    return NextResponse.json({ user: updated, message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('[PROFILE_UPDATE_ERROR]', error);
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}
