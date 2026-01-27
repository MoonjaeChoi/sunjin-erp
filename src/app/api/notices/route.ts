// Generated: 2026-01-28 16:00:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeQuerySingle, executeUpdate, executeTransaction } from '@/lib/db-direct';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type {
  NoticeListResponse,
  NoticeListItem,
  NoticeType,
  NoticeSortBy,
  NOTICE_TYPES,
  ALLOWED_MIME_TYPES,
  FILE_UPLOAD_LIMITS,
} from '@/types/notice';

export const dynamic = 'force-dynamic';

const VALID_TYPES: NoticeType[] = ['공지', '공유', '지시', '건의', '자유'];
const VALID_SORT_BY: NoticeSortBy[] = ['latest', 'viewCount', 'commentCount'];

// Magic bytes for file type validation
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [[0x50, 0x4B, 0x03, 0x04]],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': [[0x50, 0x4B, 0x03, 0x04]],
};

function validateMagicBytes(buffer: Buffer, expectedType: string): boolean {
  const signatures = MAGIC_BYTES[expectedType];
  if (!signatures) return false;

  return signatures.some(signature => {
    return signature.every((byte, index) => buffer[index] === byte);
  });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const type = searchParams.get('type') as NoticeType | 'all' | null;
    const search = searchParams.get('search');
    const sortBy = (searchParams.get('sortBy') || 'latest') as NoticeSortBy;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const authorId = searchParams.get('authorId') ? parseInt(searchParams.get('authorId')!, 10) : undefined;

    const whereClauses: string[] = ['n."deleted_at" IS NULL'];
    const params: Record<string, any> = {};
    let paramIndex = 0;

    // Type filter
    if (type && type !== 'all' && VALID_TYPES.includes(type)) {
      whereClauses.push(`n.TYPE = :type${paramIndex}`);
      params[`type${paramIndex}`] = type;
      paramIndex++;
    }

    // Search filter (LIKE-based, Decision #5)
    if (search && search.trim()) {
      whereClauses.push(`(LOWER(n.TITLE) LIKE LOWER(:search${paramIndex}) OR LOWER(DBMS_LOB.SUBSTR(n.CONTENT, 4000, 1)) LIKE LOWER(:search${paramIndex}))`);
      params[`search${paramIndex}`] = `%${search.trim()}%`;
      paramIndex++;
    }

    // Date range filter
    if (startDate) {
      whereClauses.push(`TRUNC(n."created_at") >= TO_DATE(:startDate${paramIndex}, 'YYYY-MM-DD')`);
      params[`startDate${paramIndex}`] = startDate;
      paramIndex++;
    }
    if (endDate) {
      whereClauses.push(`TRUNC(n."created_at") <= TO_DATE(:endDate${paramIndex}, 'YYYY-MM-DD')`);
      params[`endDate${paramIndex}`] = endDate;
      paramIndex++;
    }

    // Author filter
    if (authorId) {
      whereClauses.push(`n.AUTHOR_ID = :authorId${paramIndex}`);
      params[`authorId${paramIndex}`] = authorId;
      paramIndex++;
    }

    // Sort order
    let orderBy = 'n."created_at" DESC';
    if (sortBy === 'viewCount') {
      orderBy = 'n.VIEW_COUNT DESC, n."created_at" DESC';
    } else if (sortBy === 'commentCount') {
      orderBy = 'comment_count DESC, n."created_at" DESC';
    }

    const offset = (page - 1) * limit;
    params.offset = offset;
    params.limit = limit;

    const whereClause = whereClauses.join(' AND ');

    // Count query
    const countQuery = `
      SELECT COUNT(*) AS TOTAL
      FROM NOTICE n
      WHERE ${whereClause}
    `;

    // List query with comment and attachment counts
    const listQuery = `
      SELECT
        n.ID,
        n.TITLE,
        n.TYPE,
        n.AUTHOR_ID,
        e.NAME AS AUTHOR_NAME,
        n.VIEW_COUNT,
        n."created_at",
        n."updated_at",
        (SELECT COUNT(*) FROM NOTICE_COMMENT nc WHERE nc.NOTICE_ID = n.ID AND nc."deleted_at" IS NULL) AS comment_count,
        (SELECT COUNT(*) FROM NOTICE_ATTACHMENT na WHERE na.NOTICE_ID = n.ID AND na."deleted_at" IS NULL) AS attachment_count
      FROM NOTICE n
      LEFT JOIN EMPLOYEE e ON e.ID = n.AUTHOR_ID AND e.DELETED_AT IS NULL
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    const countParams = { ...params };
    delete countParams.offset;
    delete countParams.limit;

    const [countResult, listResult] = await Promise.all([
      executeQuery<any>(countQuery, countParams),
      executeQuery<any>(listQuery, params),
    ]);

    const total = parseInt(countResult.rows[0]?.TOTAL || '0', 10);

    const data: NoticeListItem[] = listResult.rows.map((row: any) => ({
      id: row.ID,
      title: row.TITLE,
      type: row.TYPE as NoticeType,
      authorId: row.AUTHOR_ID,
      authorName: row.AUTHOR_NAME || '',
      viewCount: row.VIEW_COUNT || 0,
      commentCount: parseInt(row.COMMENT_COUNT || '0', 10),
      attachmentCount: parseInt(row.ATTACHMENT_COUNT || '0', 10),
      createdAt: row['created_at']?.toISOString?.() || row['created_at'],
      updatedAt: row['updated_at']?.toISOString?.() || row['updated_at'],
    }));

    return NextResponse.json<NoticeListResponse>({
      data,
      pagination: {
        page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('GET /api/notices error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const userId = user.id;
    const userRole = user.role;

    // Permission check: MANAGER or ADMIN only
    if (!['MANAGER', 'ADMIN'].includes(userRole)) {
      return NextResponse.json({ message: 'Forbidden: MANAGER or ADMIN role required' }, { status: 403 });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const type = formData.get('type') as NoticeType;
    const files = formData.getAll('files') as File[];

    // Validation
    const errors: Record<string, string> = {};

    if (!title || title.length < 5 || title.length > 200) {
      errors.title = '제목은 5자 이상 200자 이하여야 합니다';
    }
    if (!content || content.length < 10 || content.length > 10000) {
      errors.content = '내용은 10자 이상 10,000자 이하여야 합니다';
    }
    if (!type || !VALID_TYPES.includes(type)) {
      errors.type = '유효한 게시판 유형을 선택하세요';
    }
    if (files.length > 5) {
      errors.files = '첨부파일은 최대 5개까지 가능합니다';
    }

    // Validate files
    const validMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        errors.files = `파일 ${file.name}의 크기가 10MB를 초과합니다`;
        break;
      }
      if (!validMimeTypes.includes(file.type)) {
        errors.files = `파일 ${file.name}은 지원하지 않는 형식입니다`;
        break;
      }

      // Magic byte validation
      const buffer = Buffer.from(await file.arrayBuffer());
      if (!validateMagicBytes(buffer, file.type)) {
        errors.files = `파일 ${file.name}의 형식이 유효하지 않습니다`;
        break;
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
    }

    // Insert notice
    const insertNoticeQuery = `
      INSERT INTO NOTICE (TITLE, CONTENT, TYPE, AUTHOR_ID, VIEW_COUNT, "created_at", "updated_at")
      VALUES (:title, :content, :type, :authorId, 0, SYSTIMESTAMP, SYSTIMESTAMP)
      RETURNING ID INTO :noticeId
    `;

    // Use transaction for notice + attachments
    const operations: Array<{ query: string; params: Record<string, any> }> = [];

    // Get next ID
    const idResult = await executeQuerySingle<any>(`SELECT NVL(MAX(ID), 0) + 1 AS NEXT_ID FROM NOTICE`);
    const noticeId = idResult?.NEXT_ID || 1;

    operations.push({
      query: `
        INSERT INTO NOTICE (ID, TITLE, CONTENT, TYPE, AUTHOR_ID, VIEW_COUNT, "created_at", "updated_at")
        VALUES (:id, :title, :content, :type, :authorId, 0, SYSTIMESTAMP, SYSTIMESTAMP)
      `,
      params: { id: noticeId, title, content, type, authorId: userId },
    });

    // Handle file uploads
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const noticeUploadDir = path.join(uploadDir, 'notices', String(noticeId));

    if (files.length > 0 && !existsSync(noticeUploadDir)) {
      await mkdir(noticeUploadDir, { recursive: true });
    }

    const uploadedFiles: Array<{ filename: string; filePath: string; fileSize: number; mimeType: string }> = [];

    for (const file of files) {
      const uuid = uuidv4();
      const ext = path.extname(file.name);
      const savedFilename = `${uuid}${ext}`;
      const filePath = path.join(noticeUploadDir, savedFilename);
      const relativePath = path.join('notices', String(noticeId), savedFilename);

      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);

      uploadedFiles.push({
        filename: file.name,
        filePath: relativePath,
        fileSize: file.size,
        mimeType: file.type,
      });
    }

    // Insert attachments
    for (let i = 0; i < uploadedFiles.length; i++) {
      const attachIdResult = await executeQuerySingle<any>(`SELECT NVL(MAX(ID), 0) + 1 AS NEXT_ID FROM NOTICE_ATTACHMENT`);
      const attachId = (attachIdResult?.NEXT_ID || 1) + i;

      operations.push({
        query: `
          INSERT INTO NOTICE_ATTACHMENT (ID, NOTICE_ID, FILENAME, FILE_PATH, FILE_SIZE, MIME_TYPE, UPLOADED_AT)
          VALUES (:id, :noticeId, :filename, :filePath, :fileSize, :mimeType, SYSTIMESTAMP)
        `,
        params: {
          id: attachId,
          noticeId,
          filename: uploadedFiles[i].filename,
          filePath: uploadedFiles[i].filePath,
          fileSize: uploadedFiles[i].fileSize,
          mimeType: uploadedFiles[i].mimeType,
        },
      });
    }

    await executeTransaction(operations);

    return NextResponse.json({
      message: '게시물이 등록되었습니다',
      data: { id: noticeId },
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/notices error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
