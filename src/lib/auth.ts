import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'incognito_cusb_dev_jwt_secret');
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.warn('⚠️ WARNING: JWT_SECRET is not defined. Please set JWT_SECRET in your production environment variables.');
}
const COOKIE_NAME = 'cusb_session';
const SESSION_DURATION_DAYS = 30;

export const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'incognito',
  'incognitocusb',
  'cusb',
  'official',
  'system',
  'moderator',
  'mod',
  'root',
  'staff',
  'support',
  'help',
  'vicechancellor',
  'vc',
  'dean',
  'registrar',
  'proctor',
  'security',
  'bot',
  'deleted_user',
  'deleted',
  'anonymous',
  'guest',
  'superuser',
]);

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  semester?: string | null;
  bio?: string | null;
  avatar: string;
  role: string;
  isDeleted: boolean;
  createdAt: Date;
}

export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username) return { valid: false, error: 'Username is required' };
  const clean = username.trim().toLowerCase();

  if (clean.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long' };
  }
  if (clean.length > 25) {
    return { valid: false, error: 'Username cannot exceed 25 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  if (RESERVED_USERNAMES.has(clean)) {
    return { valid: false, error: 'This username is reserved and cannot be registered' };
  }

  return { valid: true };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, ipAddress?: string, userAgent?: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  const token = jwt.sign(
    {
      userId,
      exp: Math.floor(expiresAt.getTime() / 1000),
    },
    JWT_SECRET
  );

  const session = await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });

  return { session, token, expiresAt };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch {
      return null;
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: true,
      },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      }
      return null;
    }

    if (session.user.isDeleted) {
      return null;
    }

    const { passwordHash: _, ...safeUser } = session.user;
    return safeUser as AuthUser;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string, expiresAt: Date) {
  const cookieStore = cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
}

export async function clearAuthCookie() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    try {
      await prisma.session.delete({ where: { token } }).catch(() => {});
    } catch {}
  }
  cookieStore.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  });
}
