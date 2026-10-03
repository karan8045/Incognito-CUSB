import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, createSession, setAuthCookie } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (!user) {
      await logAuditEvent('LOGIN_FAIL', null, req, { reason: 'User not found', username: cleanUsername });
      return NextResponse.json(
        { error: 'Invalid credentials. Please verify your username and password.' },
        { status: 401 }
      );
    }

    if (user.isDeleted) {
      await logAuditEvent('LOGIN_FAIL', user.id, req, { reason: 'Account deleted' });
      return NextResponse.json(
        { error: 'This account has been deleted and cannot be accessed.' },
        { status: 403 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      await logAuditEvent('LOGIN_FAIL', user.id, req, { reason: 'Incorrect password' });
      return NextResponse.json(
        { error: 'Invalid credentials. Please verify your username and password.' },
        { status: 401 }
      );
    }

    // Create session & cookie
    const { token, expiresAt } = await createSession(user.id);
    await setAuthCookie(token, expiresAt);

    await logAuditEvent('LOGIN_SUCCESS', user.id, req);

    const { passwordHash: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error('[SIGNIN_ERROR]', error);
    return NextResponse.json(
      { error: 'An unexpected authentication error occurred.' },
      { status: 500 }
    );
  }
}
