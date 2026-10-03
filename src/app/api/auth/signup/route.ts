import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  validateUsername,
  hashPassword,
  createSession,
  setAuthCookie,
} from '@/lib/auth';
import { getDefaultAvatar } from '@/lib/avatar';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, displayName, semester, bio, agreeTerms, agreePrivacy } = body;

    // 1. Legal Consent Validation
    if (!agreeTerms || !agreePrivacy) {
      return NextResponse.json(
        { error: 'You must agree to the Terms of Service and read the Privacy Policy to create an account.' },
        { status: 400 }
      );
    }

    // 2. Required fields
    if (!displayName || !displayName.trim()) {
      return NextResponse.json({ error: 'Display Name is required.' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // 3. Username Validation
    const cleanUsername = (username || '').trim().toLowerCase();
    const validation = validateUsername(cleanUsername);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 4. Duplicate Check
    const existing = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'This username is already taken. Please choose another.' },
        { status: 409 }
      );
    }

    // 5. Hash Password & Create User
    const passwordHash = await hashPassword(password);
    const avatar = getDefaultAvatar(cleanUsername, displayName.trim());

    const termsVersion = '1.0';
    const privacyVersion = '1.0';
    const now = new Date();

    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        displayName: displayName.trim(),
        passwordHash,
        semester: semester?.trim() || null,
        bio: bio?.trim() || null,
        avatar,
        role: 'STUDENT',
        termsVersionAccepted: termsVersion,
        privacyVersionAccepted: privacyVersion,
        consentTimestamp: now,
      },
    });

    // 6. Record Legal Consent
    await prisma.legalConsent.create({
      data: {
        userId: user.id,
        termsVersion,
        privacyVersion,
        acceptedAt: now,
      },
    });

    // 7. Create Session & Set Cookie
    const { token, expiresAt } = await createSession(user.id);
    await setAuthCookie(token, expiresAt);

    // 8. Log Audit Event
    await logAuditEvent('SIGNUP', user.id, req, { username: cleanUsername });

    // Safe user response (no passwordHash)
    const { passwordHash: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (error) {
    console.error('[SIGNUP_ERROR]', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}
