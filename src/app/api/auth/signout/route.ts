import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie, getCurrentUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (user) {
      await logAuditEvent('LOGOUT', user.id, req);
    }
    await clearAuthCookie();
    return NextResponse.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    console.error('[SIGNOUT_ERROR]', error);
    return NextResponse.json({ success: true });
  }
}
