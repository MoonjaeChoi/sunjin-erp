// Generated: 2026-01-28 16:00:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuerySingle, executeUpdate, executeTransaction } from '@/lib/db-direct';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string; commentId: string };
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
    const commentId = parseInt(params.commentId, 10);

    if (isNaN(noticeId) || isNaN(commentId)) {
      return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
    }

    // Check comment exists and belongs to the notice
    const comment = await executeQuerySingle<any>(
      `SELECT ID, AUTHOR_ID, NOTICE_ID
       FROM NOTICE_COMMENT
       WHERE ID = :commentId AND NOTICE_ID = :noticeId AND "deleted_at" IS NULL`,
      { commentId, noticeId }
    );

    if (!comment) {
      return NextResponse.json({ message: '댓글을 찾을 수 없습니다' }, { status: 404 });
    }

    // Permission check: author or ADMIN
    if (comment.AUTHOR_ID !== userId && userRole !== 'ADMIN') {
      return NextResponse.json({ message: '수정 권한이 없습니다' }, { status: 403 });
    }

    const body = await req.json();
    const { content } = body;

    // Validation
    if (!content || content.trim().length < 1 || content.length > 1000) {
      return NextResponse.json(
        { message: '댓글은 1자 이상 1000자 이하여야 합니다' },
        { status: 400 }
      );
    }

    // Update comment (this will mark it as edited via updated_at change)
    await executeUpdate(
      `UPDATE NOTICE_COMMENT
       SET CONTENT = :content, "updated_at" = SYSTIMESTAMP
       WHERE ID = :commentId`,
      { commentId, content: content.trim() }
    );

    return NextResponse.json({ message: '댓글이 수정되었습니다' });
  } catch (error: any) {
    console.error('PUT /api/notices/[id]/comments/[commentId] error:', error);
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
    const commentId = parseInt(params.commentId, 10);

    if (isNaN(noticeId) || isNaN(commentId)) {
      return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
    }

    // Check comment exists
    const comment = await executeQuerySingle<any>(
      `SELECT ID, AUTHOR_ID, NOTICE_ID
       FROM NOTICE_COMMENT
       WHERE ID = :commentId AND NOTICE_ID = :noticeId AND "deleted_at" IS NULL`,
      { commentId, noticeId }
    );

    if (!comment) {
      return NextResponse.json({ message: '댓글을 찾을 수 없습니다' }, { status: 404 });
    }

    // Permission check: author or ADMIN
    if (comment.AUTHOR_ID !== userId && userRole !== 'ADMIN') {
      return NextResponse.json({ message: '삭제 권한이 없습니다' }, { status: 403 });
    }

    // Soft delete comment and its replies
    const operations = [
      // First, delete all replies to this comment
      {
        query: `UPDATE NOTICE_COMMENT SET "deleted_at" = SYSTIMESTAMP WHERE PARENT_COMMENT_ID = :commentId AND "deleted_at" IS NULL`,
        params: { commentId },
      },
      // Then delete the comment itself
      {
        query: `UPDATE NOTICE_COMMENT SET "deleted_at" = SYSTIMESTAMP WHERE ID = :commentId`,
        params: { commentId },
      },
    ];

    await executeTransaction(operations);

    return NextResponse.json({ message: '댓글이 삭제되었습니다' });
  } catch (error: any) {
    console.error('DELETE /api/notices/[id]/comments/[commentId] error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
