// Generated: 2026-01-28 16:00:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuerySingle, executeUpdate } from '@/lib/db-direct';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string; attachmentId: string };
}

export async function DELETE(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const userId = user.id;
    const userRole = user.role;

    const noticeId = parseInt(params.id, 10);
    const attachmentId = parseInt(params.attachmentId, 10);

    if (isNaN(noticeId) || isNaN(attachmentId)) {
      return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
    }

    // Check notice exists and get author
    const notice = await executeQuerySingle<any>(
      `SELECT ID, AUTHOR_ID FROM NOTICE WHERE ID = :noticeId AND "deleted_at" IS NULL`,
      { noticeId }
    );

    if (!notice) {
      return NextResponse.json({ message: '게시물을 찾을 수 없습니다' }, { status: 404 });
    }

    // Permission check: notice author or ADMIN
    if (notice.AUTHOR_ID !== userId && userRole !== 'ADMIN') {
      return NextResponse.json({ message: '삭제 권한이 없습니다' }, { status: 403 });
    }

    // Check attachment exists
    const attachment = await executeQuerySingle<any>(
      `SELECT ID FROM NOTICE_ATTACHMENT
       WHERE ID = :attachmentId AND NOTICE_ID = :noticeId AND "deleted_at" IS NULL`,
      { attachmentId, noticeId }
    );

    if (!attachment) {
      return NextResponse.json({ message: '첨부파일을 찾을 수 없습니다' }, { status: 404 });
    }

    // Soft delete attachment (physical file retained for audit)
    await executeUpdate(
      `UPDATE NOTICE_ATTACHMENT SET "deleted_at" = SYSTIMESTAMP WHERE ID = :attachmentId`,
      { attachmentId }
    );

    return NextResponse.json({ message: '첨부파일이 삭제되었습니다' });
  } catch (error: any) {
    console.error('DELETE /api/notices/[id]/attachments/[attachmentId] error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
