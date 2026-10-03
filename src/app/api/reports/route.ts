import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { extractRequestMetadata, logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required to report content.' }, { status: 401 });
    }

    const body = await req.json();
    const { postId, reason, description } = body;

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required.' }, { status: 400 });
    }
    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'A reason for reporting is required.' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    const meta = extractRequestMetadata(req);

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        reportedPostId: postId,
        reason: reason.trim(),
        description: description?.trim() || null,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        status: 'PENDING',
      },
    });

    // Check if post received multiple reports, flag it for administrator review
    const totalReports = await prisma.report.count({
      where: { reportedPostId: postId },
    });

    if (totalReports >= 3) {
      await prisma.post.update({
        where: { id: postId },
        data: { isReported: true },
      });
    }

    await logAuditEvent('REPORT_POST', user.id, req, {
      reportId: report.id,
      postId,
      reason,
    });

    return NextResponse.json({
      success: true,
      message: 'Report submitted. The platform administrator will review this report.',
    });
  } catch (error) {
    console.error('[REPORT_POST_ERROR]', error);
    return NextResponse.json({ error: 'Failed to submit report.' }, { status: 500 });
  }
}
