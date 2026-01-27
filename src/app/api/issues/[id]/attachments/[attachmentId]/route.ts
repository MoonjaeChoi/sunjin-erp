// Generated: 2026-01-27 23:54:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { executeQuery, executeUpdate, executeQuerySingle } from '@/lib/db-direct';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface AttachmentRouteParams {
  params: {
    id: string;
    attachmentId: string;
  };
}

export async function DELETE(
  req: NextRequest,
  { params }: AttachmentRouteParams
): Promise<NextResponse> {
  try {
    // 1. Session validation
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const issueId = parseInt(params.id);
    const attachmentId = parseInt(params.attachmentId);

    if (isNaN(issueId) || isNaN(attachmentId)) {
      return NextResponse.json(
        { message: 'Invalid IDs' },
        { status: 400 }
      );
    }

    // 2. Fetch attachment
    const attachmentSql = `
      SELECT id, issue_id, file_name, uploaded_by_id
      FROM ISSUE_ATTACHMENT
      WHERE id = :attachmentId AND issue_id = :issueId AND deleted_at IS NULL
    `;
    const attachment = await executeQuerySingle(attachmentSql, { attachmentId, issueId });

    if (!attachment) {
      return NextResponse.json(
        { message: 'Attachment not found' },
        { status: 404 }
      );
    }

    // 3. Permission check (ADMIN or uploader)
    if (userRole !== 'ADMIN' && attachment.UPLOADED_BY_ID !== userId) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    // 4. Soft delete attachment
    const now = new Date();
    const deleteSql = `
      UPDATE ISSUE_ATTACHMENT
      SET deleted_at = :deletedAt, updated_at = :updatedAt
      WHERE id = :attachmentId
    `;
    await executeUpdate(deleteSql, { deletedAt: now, updatedAt: now, attachmentId });

    // 5. Create history record
    const historySeqSql = `SELECT ISSUE_HISTORY_SEQ.NEXTVAL as ID FROM DUAL`;
    const historySeqResult = await executeQuerySingle(historySeqSql);
    const historyId = historySeqResult?.ID;

    if (historyId) {
      const historySql = `
        INSERT INTO ISSUE_HISTORY (
          id, issue_id, change_type, old_value, new_value, changed_by_id, changed_at, remark
        ) VALUES (
          :id, :issueId, :changeType, :oldValue, :newValue, :changedById, :changedAt, :remark
        )
      `;
      await executeUpdate(historySql, {
        id: historyId,
        issueId,
        changeType: 'ATTACHMENT_DELETED',
        oldValue: attachment.FILE_NAME,
        newValue: null,
        changedById: userId,
        changedAt: now,
        remark: null,
      });
    }

    // 6. Response (204 No Content per spec)
    return NextResponse.json(undefined, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/issues/[id]/attachments/[attachmentId] error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
