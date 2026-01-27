// Generated: 2026-01-28 16:00:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuerySingle } from '@/lib/db-direct';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string; attachmentId: string };
}

export async function GET(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const noticeId = parseInt(params.id, 10);
    const attachmentId = parseInt(params.attachmentId, 10);

    if (isNaN(noticeId) || isNaN(attachmentId)) {
      return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
    }

    // Check notice exists
    const notice = await executeQuerySingle<any>(
      `SELECT ID FROM NOTICE WHERE ID = :noticeId AND "deleted_at" IS NULL`,
      { noticeId }
    );

    if (!notice) {
      return NextResponse.json({ message: '게시물을 찾을 수 없습니다' }, { status: 404 });
    }

    // Get attachment info
    const attachment = await executeQuerySingle<any>(
      `SELECT ID, NOTICE_ID, FILENAME, FILE_PATH, FILE_SIZE, MIME_TYPE
       FROM NOTICE_ATTACHMENT
       WHERE ID = :attachmentId AND NOTICE_ID = :noticeId AND "deleted_at" IS NULL`,
      { attachmentId, noticeId }
    );

    if (!attachment) {
      return NextResponse.json({ message: '첨부파일을 찾을 수 없습니다' }, { status: 404 });
    }

    // Read file
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, attachment.FILE_PATH);

    if (!existsSync(filePath)) {
      return NextResponse.json({ message: '파일이 존재하지 않습니다' }, { status: 404 });
    }

    const fileBuffer = await readFile(filePath);

    // Return file with proper headers
    const headers = new Headers();
    headers.set('Content-Type', attachment.MIME_TYPE);
    headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(attachment.FILENAME)}`);
    headers.set('Content-Length', String(attachment.FILE_SIZE));

    return new NextResponse(fileBuffer, { headers });
  } catch (error: any) {
    console.error('GET /api/notices/[id]/attachments/[attachmentId]/download error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
