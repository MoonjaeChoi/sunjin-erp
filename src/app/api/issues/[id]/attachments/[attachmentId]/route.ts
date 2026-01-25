// Generated: 2026-01-25 18:55:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getDataSource } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { IssueAttachment } from '@/entities/IssueAttachment';
import { IssueHistory } from '@/entities/IssueHistory';

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
    const issueId = parseInt(params.id);
    const attachmentId = parseInt(params.attachmentId);

    if (isNaN(issueId) || isNaN(attachmentId)) {
      return NextResponse.json(
        { message: 'Invalid IDs' },
        { status: 400 }
      );
    }

    // 2. Get datasource and repositories
    const dataSource = await getDataSource();
    const attachmentRepo = dataSource.getRepository(IssueAttachment);
    const historyRepo = dataSource.getRepository(IssueHistory);

    // 3. Fetch attachment
    const attachment = await attachmentRepo.findOne({
      where: {
        id: attachmentId,
        issue_id: issueId,
        deleted_at: null as any,
      },
    });

    if (!attachment) {
      return NextResponse.json(
        { message: 'Attachment not found' },
        { status: 404 }
      );
    }

    // 4. Soft delete
    attachment.deleted_at = new Date();
    await attachmentRepo.save(attachment);

    // 5. Create history record
    const history = new IssueHistory();
    history.issue_id = issueId;
    history.change_type = 'ATTACHMENT_DELETED';
    history.old_value = attachment.file_name;
    history.new_value = null;
    history.changed_by_id = userId;

    await historyRepo.save(history);

    // 6. Response
    return NextResponse.json({
      message: 'Attachment deleted successfully',
      data: {
        id: attachment.id,
        deleted_at: attachment.deleted_at,
      },
    });
  } catch (error) {
    console.error('DELETE /api/issues/[id]/attachments/[attachmentId] error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
