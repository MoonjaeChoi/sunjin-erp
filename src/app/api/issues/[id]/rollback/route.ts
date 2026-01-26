// Generated: 2026-01-25 18:55:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getDataSource } from '@/lib/db';
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

    // 2. Get datasource and repositories
    const { Issue } = await import('../../../../../entities/Issue');
    const { IssueHistory } = await import('../../../../../entities/IssueHistory');
    const dataSource = await getDataSource();
    const issueRepo = dataSource.getRepository(Issue);
    const historyRepo = dataSource.getRepository(IssueHistory);

    // 3. Fetch issue (soft-delete filtered)
    const issue = await issueRepo.findOne({
      where: {
        id: issueId,
        deleted_at: null as any,
      },
    });

    if (!issue) {
      return NextResponse.json(
        { message: 'Issue not found' },
        { status: 404 }
      );
    }

    // 4. Status validation (only COMPLETED can be rolled back)
    if (issue.status !== 'COMPLETED') {
      return NextResponse.json(
        {
          message: `Only COMPLETED issues can be rolled back. Current status: ${issue.status}`,
        },
        { status: 400 }
      );
    }

    // 5. Update status
    issue.status = 'IN_PROGRESS';
    issue.completed_at = null;
    await issueRepo.save(issue);

    // 6. Create history record
    const history = new IssueHistory();
    history.issue_id = issueId;
    history.change_type = 'STATUS_ROLLBACK';
    history.old_value = 'COMPLETED';
    history.new_value = 'IN_PROGRESS';
    history.changed_by_id = userId;
    history.remark = `Rolled back by ADMIN at ${new Date().toISOString()}`;

    await historyRepo.save(history);

    // 7. Response
    return NextResponse.json({
      message: 'Issue status rolled back successfully',
      data: {
        id: issue.id,
        status: issue.status,
        completed_at: issue.completed_at,
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
