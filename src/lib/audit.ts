import { NextRequest } from 'next/server';
import prisma from './prisma';

export interface RequestMetadata {
  ipAddress: string;
  userAgent: string;
  browser: string;
  os: string;
  deviceType: string;
}

/**
 * Extracts available, standard HTTP request metadata safely from incoming NextRequest headers.
 * Does NOT attempt misleading or impossible hardware extractions (such as MAC addresses).
 */
export function extractRequestMetadata(req: NextRequest | Request): RequestMetadata {
  let ip = 'unknown';
  let ua = '';

  if ('headers' in req) {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
      ip = forwarded.split(',')[0].trim();
    } else {
      ip = req.headers.get('x-real-ip') || '127.0.0.1';
    }
    ua = req.headers.get('user-agent') || 'Unknown';
  }

  // Parse basic browser and OS information safely
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let deviceType = 'Desktop';

  const uaLower = ua.toLowerCase();

  // OS detection
  if (uaLower.includes('windows')) os = 'Windows';
  else if (uaLower.includes('macintosh') || uaLower.includes('mac os')) os = 'macOS';
  else if (uaLower.includes('android')) os = 'Android';
  else if (uaLower.includes('iphone') || uaLower.includes('ipad') || uaLower.includes('ios')) os = 'iOS';
  else if (uaLower.includes('linux')) os = 'Linux';

  // Device detection
  if (uaLower.includes('mobile') || uaLower.includes('iphone') || uaLower.includes('android')) {
    deviceType = 'Mobile';
  } else if (uaLower.includes('tablet') || uaLower.includes('ipad')) {
    deviceType = 'Tablet';
  }

  // Browser detection
  if (uaLower.includes('edg/')) browser = 'Edge';
  else if (uaLower.includes('chrome/') && !uaLower.includes('edg/')) browser = 'Chrome';
  else if (uaLower.includes('safari/') && !uaLower.includes('chrome/')) browser = 'Safari';
  else if (uaLower.includes('firefox/')) browser = 'Firefox';
  else if (uaLower.includes('opr/') || uaLower.includes('opera')) browser = 'Opera';

  return {
    ipAddress: ip,
    userAgent: ua.slice(0, 500),
    browser,
    os,
    deviceType,
  };
}

export async function logAuditEvent(
  eventType: string,
  userId?: string | null,
  req?: NextRequest | Request,
  metadata?: Record<string, unknown>
) {
  try {
    const meta = req
      ? extractRequestMetadata(req)
      : {
          ipAddress: 'internal',
          userAgent: 'internal',
          browser: 'server',
          os: 'server',
          deviceType: 'server',
        };

    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        eventType,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        browser: meta.browser,
        os: meta.os,
        deviceType: meta.deviceType,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    // Fail-safe: Audit logging should not crash user-facing actions, but must record to console
    console.error('[AUDIT_LOG_ERROR]', error);
  }
}
