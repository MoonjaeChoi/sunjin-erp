// Generated: 2026-01-28 16:00:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeQuerySingle, executeUpdate } from '@/lib/db-direct';
import type { Comment, CommentListResponse } from '@/types/notice';

export const dynamic = 'force-dynamic';

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

    // Check notice exists
    const notice = await executeQuerySingle<any>(
      `SELECT ID FROM NOTICE WHERE ID = :noticeId AND "deleted_at" IS NULL`,
      { noticeId }
    );

    if (!notice) {
      return NextResponse.json({ message: '게시물을 찾을 수 없습니다' }, { status: 404 });
    }

    // Get all comments for this notice (oldest-first, Decision #14)
    const commentsQuery = `
      SELECT
        c.ID,
        c.NOTICE_ID,
        c.CONTENT,
        c.AUTHOR_ID,
        e.NAME AS AUTHOR_NAME,
        c.PARENT_COMMENT_ID,
        e_parent.NAME AS PARENT_AUTHOR_NAME,
        c."created_at",
        c."updated_at"
      FROM NOTICE_COMMENT c
      LEFT JOIN EMPLOYEE e ON e.ID = c.AUTHOR_ID AND e.DELETED_AT IS NULL
      LEFT JOIN NOTICE_COMMENT c_parent ON c_parent.ID = c.PARENT_COMMENT_ID
      LEFT JOIN EMPLOYEE e_parent ON e_parent.ID = c_parent.AUTHOR_ID AND e_parent.DELETED_AT IS NULL
      WHERE c.NOTICE_ID = :noticeId AND c."deleted_at" IS NULL
      ORDER BY c."created_at" ASC
    `;

    const commentsResult = await executeQuery<any>(commentsQuery, { noticeId });

    // Build tree structure
    const commentMap = new Map<number, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create all comment objects
    for (const row of commentsResult.rows) {
      const comment: Comment = {
        id: row.ID,
        noticeId: row.NOTICE_ID,
        content: row.CONTENT,
        authorId: row.AUTHOR_ID,
        authorName: row.AUTHOR_NAME || '',
        parentCommentId: row.PARENT_COMMENT_ID,
        parentAuthorName: row.PARENT_AUTHOR_NAME,
        isEdited: row['created_at']?.getTime?.() !== row['updated_at']?.getTime?.(),
        createdAt: row['created_at']?.toISOString?.() || row['created_at'],
        updatedAt: row['updated_at']?.toISOString?.() || row['updated_at'],
        replies: [],
      };
      commentMap.set(comment.id, comment);
    }

    // Second pass: build tree
    for (const comment of Array.from(commentMap.values())) {
      if (comment.parentCommentId) {
        const parent = commentMap.get(comment.parentCommentId);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    }

    // Get total count
    const totalCount = commentsResult.rows.length;

    return NextResponse.json<CommentListResponse>({
      data: rootComments,
      pagination: {
        page: 1,
        pageSize: totalCount,
        total: totalCount,
        totalPages: 1,
      },
    });
  } catch (error: any) {
    console.error('GET /api/notices/[id]/comments error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const userId = user.id;

    const noticeId = parseInt(params.id, 10);
    if (isNaN(noticeId)) {
      return NextResponse.json({ message: 'Invalid notice ID' }, { status: 400 });
    }

    // Check notice exists
    const notice = await executeQuerySingle<any>(
      `SELECT ID FROM NOTICE WHERE ID = :noticeId AND "deleted_at" IS NULL`,
      { noticeId }
    );

    if (!notice) {
      return NextResponse.json({ message: '게시물을 찾을 수 없습니다' }, { status: 404 });
    }

    const body = await req.json();
    const { content, parentCommentId } = body;

    // Validation
    if (!content || content.trim().length < 1 || content.length > 1000) {
      return NextResponse.json(
        { message: '댓글은 1자 이상 1000자 이하여야 합니다' },
        { status: 400 }
      );
    }

    // If replying to a comment, check depth limit (Decision #3: max 2 levels)
    if (parentCommentId) {
      const parentComment = await executeQuerySingle<any>(
        `SELECT ID, PARENT_COMMENT_ID FROM NOTICE_COMMENT WHERE ID = :parentId AND NOTICE_ID = :noticeId AND "deleted_at" IS NULL`,
        { parentId: parentCommentId, noticeId }
      );

      if (!parentComment) {
        return NextResponse.json({ message: '부모 댓글을 찾을 수 없습니다' }, { status: 404 });
      }

      // If parent already has a parent, it's depth 1, so reply would be depth 2 (max)
      // If parent's parent exists, we cannot add more replies (would be depth 3)
      if (parentComment.PARENT_COMMENT_ID !== null) {
        return NextResponse.json(
          { message: '답글에는 답글을 달 수 없습니다 (최대 2단계)' },
          { status: 400 }
        );
      }
    }

    // Get next ID
    const idResult = await executeQuerySingle<any>(
      `SELECT NVL(MAX(ID), 0) + 1 AS NEXT_ID FROM NOTICE_COMMENT`
    );
    const commentId = idResult?.NEXT_ID || 1;

    // Insert comment
    await executeUpdate(
      `INSERT INTO NOTICE_COMMENT (ID, NOTICE_ID, CONTENT, AUTHOR_ID, PARENT_COMMENT_ID, "created_at", "updated_at")
       VALUES (:id, :noticeId, :content, :authorId, :parentCommentId, SYSTIMESTAMP, SYSTIMESTAMP)`,
      {
        id: commentId,
        noticeId,
        content: content.trim(),
        authorId: userId,
        parentCommentId: parentCommentId || null,
      }
    );

    return NextResponse.json(
      {
        message: parentCommentId ? '답글이 등록되었습니다' : '댓글이 등록되었습니다',
        data: { id: commentId },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/notices/[id]/comments error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
