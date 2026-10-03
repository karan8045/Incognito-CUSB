import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Allowed MIME types
const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  // Videos
  'video/mp4',
  'video/webm',
  'video/quicktime',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
]);

// Blocked dangerous extensions
const DANGEROUS_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.bash',
  '.php',
  '.phtml',
  '.js',
  '.mjs',
  '.cjs',
  '.py',
  '.rb',
  '.pl',
  '.cgi',
  '.jar',
  '.vbs',
  '.scr',
]);

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File size exceeds 25 MB limit.' },
        { status: 400 }
      );
    }

    const originalName = file.name || 'unnamed_file';
    const extension = path.extname(originalName).toLowerCase();

    if (DANGEROUS_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        { error: 'Executable and script file types are blocked for campus safety.' },
        { status: 400 }
      );
    }

    const mimeType = file.type || 'application/octet-stream';
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: `File type "${mimeType}" is not allowed. Upload images, videos, documents, or archives.` },
        { status: 400 }
      );
    }

    // Generate safe unique filename
    const randomHash = crypto.randomBytes(16).toString('hex');
    const safeFileName = `${randomHash}${extension}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, safeFileName);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${safeFileName}`;

    let category: 'IMAGE' | 'VIDEO' | 'GIF' | 'DOCUMENT' = 'DOCUMENT';
    if (mimeType.startsWith('image/')) {
      category = mimeType === 'image/gif' ? 'GIF' : 'IMAGE';
    } else if (mimeType.startsWith('video/')) {
      category = 'VIDEO';
    }

    return NextResponse.json({
      url: publicUrl,
      fileName: originalName,
      fileSize: file.size,
      mimeType,
      category,
    });
  } catch (error) {
    console.error('[FILE_UPLOAD_ERROR]', error);
    return NextResponse.json({ error: 'File upload failed.' }, { status: 500 });
  }
}
