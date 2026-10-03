import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, clearAuthCookie, verifyPassword } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json();
    const { password, confirmation } = body;

    if (confirmation !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { error: 'Please enter "DELETE MY ACCOUNT" to confirm permanent deletion.' },
        { status: 400 }
      );
    }

    // Verify current user's password for safety
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const isMatch = await verifyPassword(password, dbUser.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    // Anonymize user profile permanently into "Deleted User"
    const anonymizedUsername = `deleted_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const anonymizedAvatar = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23475569"/><circle cx="50" cy="40" r="18" fill="%2394a3b8"/><path d="M25 85 C25 65 75 65 75 85 Z" fill="%2394a3b8"/></svg>';

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isDeleted: true,
        username: anonymizedUsername,
        displayName: 'Deleted User',
        passwordHash: '$2a$12$DELETED_ACCOUNT_HASH_INVALID_NOW',
        bio: null,
        semester: null,
        avatar: anonymizedAvatar,
      },
    });

    // Invalidate all active sessions for this user
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    // Clear notifications and subscriptions
    await prisma.notification.deleteMany({
      where: { userId: user.id },
    });
    await prisma.departmentSubscription.deleteMany({
      where: { userId: user.id },
    });

    // Log the deletion audit event
    await logAuditEvent('ACCOUNT_DELETE', user.id, req, {
      previousUsername: user.username,
      timestamp: new Date().toISOString(),
    });

    // Clear session cookie
    await clearAuthCookie();

    return NextResponse.json({
      success: true,
      message: 'Your account has been permanently deleted and all your identifying information anonymized.',
    });
  } catch (error) {
    console.error('[DELETE_ACCOUNT_ERROR]', error);
    return NextResponse.json(
      { error: 'An error occurred while deleting your account.' },
      { status: 500 }
    );
  }
}
