// Generated: 2026-01-28 16:00:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeQuerySingle, executeUpdate, executeTransaction } from '@/lib/db-direct';
import type { NoticeDetail, NoticeAttachment, NoticeType } from '@/types/notice';

export const dynamic = 'force-dynamic';

const VALID_TYPES: NoticeType[] = ['공지', '공유', '지시', '건의', '자유'];

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const noticeId = parseInt(params.id, 10);
    if (isNaN(noticeId)) {
      return NextResponse.json({ message: 'Invalid notice ID' }, { status: 400 });
    }

    // Get notice with author info
    const noticeQuery = `
      SELECT
        n.ID,
        n.TITLE,
        n.CONTENT,
        n.TYPE,
        n.AUTHOR_ID,
        e_author.NAME AS AUTHOR_NAME,
        n.VIEW_COUNT,
        n.UPDATED_BY_ID,
        e_updated.NAME AS UPDATED_BY_NAME,
        n.DELETION_REASON,
        n."created_at",
        n."updated_at",
        n."deleted_at"
      FROM NOTICE n
      LEFT JOIN EMPLOYEE e_author ON e_author.ID = n.AUTHOR_ID AND e_author.DELETED_AT IS NULL
      LEFT JOIN EMPLOYEE e_updated ON e_updated.ID = n.UPDATED_BY_ID AND e_updated.DELETED_AT IS NULL
      WHERE n.ID = :noticeId AND n."deleted_at" IS NULL
    `;

    const notice = await executeQuerySingle<any>(noticeQuery, { noticeId });

    if (!notice) {
      return NextResponse.json({ message: '게시물을 찾을 수 없습니다' }, { status: 404 });
    }

    // Get attachments
    const attachmentsQuery = `
      SELECT ID, NOTICE_ID, FILENAME, FILE_PATH, FILE_SIZE, MIME_TYPE, UPLOADED_AT
      FROM NOTICE_ATTACHMENT
      WHERE NOTICE_ID = :noticeId AND "deleted_at" IS NULL
      ORDER BY UPLOADED_AT ASC
    `;
    const attachmentsResult = await executeQuery<any>(attachmentsQuery, { noticeId });

    // Get comment count
    const commentCountQuery = `
      SELECT COUNT(*) AS TOTAL
      FROM NOTICE_COMMENT
      WHERE NOTICE_ID = :noticeId AND "deleted_at" IS NULL
    `;
    const commentCountResult = await executeQuerySingle<any>(commentCountQuery, { noticeId });

    // Increment view count (session-based deduplication would require session storage)
    // For simplicity, always increment here. Full implementation would check session.
    await executeUpdate(
      `UPDATE NOTICE SET VIEW_COUNT = VIEW_COUNT + 1, "updated_at" = "updated_at" WHERE ID = :noticeId`,
      { noticeId }
    );

    const attachments: NoticeAttachment[] = attachmentsResult.rows.map((row: any) => ({
      id: row.ID,
      noticeId: row.NOTICE_ID,
      filename: row.FILENAME,
      filePath: row.FILE_PATH,
      fileSize: row.FILE_SIZE,
      mimeType: row.MIME_TYPE,
      uploadedAt: row.UPLOADED_AT?.toISOString?.() || row.UPLOADED_AT,
    }));

    const data: NoticeDetail = {
      id: notice.ID,
      title: notice.TITLE,
      content: notice.CONTENT,
      type: notice.TYPE as NoticeType,
      authorId: notice.AUTHOR_ID,
      authorName: notice.AUTHOR_NAME || '',
      viewCount: (notice.VIEW_COUNT || 0) + 1,
      updatedById: notice.UPDATED_BY_ID,
      updatedByName: notice.UPDATED_BY_NAME,
      deletionReason: notice.DELETION_REASON,
      createdAt: notice['created_at']?.toISOString?.() || notice['created_at'],
      updatedAt: notice['updated_at']?.toISOString?.() || notice['updated_at'],
      attachments,
      commentCount: parseInt(commentCountResult?.TOTAL || '0', 10),
    };

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('GET /api/notices/[id] error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const userId = user.id;
    const userRole = user.role;

    const noticeId = parseInt(params.id, 10);
    if (isNaN(noticeId)) {
      return NextResponse.json({ message: 'Invalid notice ID' }, { status: 400 });
    }

    // Check notice exists and get author
    const notice = await executeQuerySingle<any>(
      `SELECT ID, AUTHOR_ID FROM NOTICE WHERE ID = :noticeId AND "deleted_at" IS NULL`,
      { noticeId }
    );

    if (!notice) {
      return NextResponse.json({ message: '게시물을 찾을 수 없습니다' }, { status: 404 });
    }

    // Permission check: author or ADMIN
    if (notice.AUTHOR_ID !== userId && userRole !== 'ADMIN') {
      return NextResponse.json({ message: '수정 권한이 없습니다' }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, type } = body;

    // Validation
    const errors: Record<string, string> = {};

    if (title !== undefined && (title.length < 5 || title.length > 200)) {
      errors.title = '제목은 5자 이상 200자 이하여야 합니다';
    }
    if (content !== undefined && (content.length < 10 || content.length > 10000)) {
      errors.content = '내용은 10자 이상 10,000자 이하여야 합니다';
    }
    if (type !== undefined && !VALID_TYPES.includes(type)) {
      errors.type = '유효한 게시판 유형을 선택하세요';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const updateParams: Record<string, any> = { noticeId };

    if (title !== undefined) {
      updates.push('TITLE = :title');
      updateParams.title = title;
    }
    if (content !== undefined) {
      updates.push('CONTENT = :content');
      updateParams.content = content;
    }
    if (type !== undefined) {
      updates.push('TYPE = :type');
      updateParams.type = type;
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: '수정할 내용이 없습니다' }, { status: 400 });
    }

    // Track who updated (Decision #12)
    updates.push('UPDATED_BY_ID = :updatedById');
    updateParams.updatedById = userId;
    updates.push('"updated_at" = SYSTIMESTAMP');

    const updateQuery = `
      UPDATE NOTICE
      SET ${updates.join(', ')}
      WHERE ID = :noticeId
    `;

    await executeUpdate(updateQuery, updateParams);

    return NextResponse.json({ message: '게시물이 수정되었습니다' });
  } catch (error: any) {
    console.error('PUT /api/notices/[id] error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
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
    if (isNaN(noticeId)) {
      return NextResponse.json({ message: 'Invalid notice ID' }, { status: 400 });
    }

    // Check notice exists and get author
    const notice = await executeQuerySingle<any>(
      `SELECT ID, AUTHOR_ID FROM NOTICE WHERE ID = :noticeId AND "deleted_at" IS NULL`,
      { noticeId }
    );

    if (!notice) {
      return NextResponse.json({ message: '게시물을 찾을 수 없습니다' }, { status: 404 });
    }

    // Permission check: author or ADMIN
    if (notice.AUTHOR_ID !== userId && userRole !== 'ADMIN') {
      return NextResponse.json({ message: '삭제 권한이 없습니다' }, { status: 403 });
    }

    // Get optional deletion reason from body
    let deletionReason: string | null = null;
    try {
      const body = await req.json();
      deletionReason = body.reason || null;
    } catch {
      // No body is fine
    }

    // Cascade soft delete (Decision #1): Notice → Comments → Attachments
    const operations = [
      // Soft delete attachments
      {
        query: `UPDATE NOTICE_ATTACHMENT SET "deleted_at" = SYSTIMESTAMP WHERE NOTICE_ID = :noticeId AND "deleted_at" IS NULL`,
        params: { noticeId },
      },
      // Soft delete comments
      {
        query: `UPDATE NOTICE_COMMENT SET "deleted_at" = SYSTIMESTAMP WHERE NOTICE_ID = :noticeId AND "deleted_at" IS NULL`,
        params: { noticeId },
      },
      // Soft delete notice
      {
        query: `UPDATE NOTICE SET "deleted_at" = SYSTIMESTAMP, DELETION_REASON = :reason WHERE ID = :noticeId`,
        params: { noticeId, reason: deletionReason },
      },
    ];

    await executeTransaction(operations);

    return NextResponse.json({ message: '게시물이 삭제되었습니다' });
  } catch (error: any) {
    console.error('DELETE /api/notices/[id] error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
