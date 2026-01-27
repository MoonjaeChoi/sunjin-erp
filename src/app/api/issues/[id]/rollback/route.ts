// Generated: 2026-01-27 23:50:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { executeQuery, executeUpdate, executeQuerySingle } from '@/lib/db-direct';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PUT(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    // 1. Session and ADMIN validation
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Only ADMIN can rollback status' },
        { status: 403 }
      );
    }

    const userId = (session.user as any).id;
    const issueId = parseInt(params.id);

    if (isNaN(issueId)) {
      return NextResponse.json(
        { message: 'Invalid issue ID' },
        { status: 400 }
      );
    }

    // 2. Fetch issue (soft-delete filtered)
    const issueSql = `
      SELECT id, status, completed_at, updated_at
      FROM ISSUE
      WHERE id = :issueId AND deleted_at IS NULL
    `;
    const issue = await executeQuerySingle(issueSql, { issueId });

    if (!issue) {
      return NextResponse.json(
        { message: 'Issue not found' },
        { status: 404 }
      );
    }

    // 3. Status validation (only COMPLETED can be rolled back)
    if (issue.STATUS !== 'COMPLETED') {
      return NextResponse.json(
        {
          message: `Only COMPLETED issues can be rolled back. Current status: ${issue.STATUS}`,
        },
        { status: 400 }
      );
    }

    // 4. Update status
    const now = new Date();
    const updateSql = `
      UPDATE ISSUE
      SET status = :status, completed_at = :completedAt, updated_at = :updatedAt
      WHERE id = :issueId
    `;
    await executeUpdate(updateSql, {
      status: 'IN_PROGRESS',
      completedAt: null,
      updatedAt: now,
      issueId,
    });

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
        changeType: 'STATUS_ROLLBACK',
        oldValue: 'COMPLETED',
        newValue: 'IN_PROGRESS',
        changedById: userId,
        changedAt: now,
        remark: `Rolled back by ADMIN at ${now.toISOString()}`,
      });
    }

    // 6. Response
    return NextResponse.json({
      message: 'Issue status rolled back successfully',
      data: {
        id: issueId,
        status: 'IN_PROGRESS',
        completed_at: null,
      },
    });
  } catch (error) {
    console.error('PUT /api/issues/[id]/rollback error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
