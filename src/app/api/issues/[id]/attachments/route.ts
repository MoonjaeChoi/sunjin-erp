// Generated: 2026-01-27 23:52:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { executeQuery, executeUpdate, executeQuerySingle } from '@/lib/db-direct';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads/issues';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_ISSUE = 5;
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
];
const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.docx',
  '.xlsx',
  '.pptx',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
];

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  req: NextRequest,
  { params }: RouteParams
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

    const issueId = parseInt(params.id);

    if (isNaN(issueId)) {
      return NextResponse.json(
        { message: 'Invalid issue ID' },
        { status: 400 }
      );
    }

    // 2. Verify issue exists
    const issueSql = `SELECT id FROM ISSUE WHERE id = :issueId AND deleted_at IS NULL`;
    const issue = await executeQuerySingle(issueSql, { issueId });

    if (!issue) {
      return NextResponse.json(
        { message: 'Issue not found' },
        { status: 404 }
      );
    }

    // 3. Fetch all attachments for this issue
    const attachmentsSql = `
      SELECT id, file_name, file_size, uploaded_by_id, created_at
      FROM ISSUE_ATTACHMENT
      WHERE issue_id = :issueId AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;
    const attachmentsResult = await executeQuery(attachmentsSql, { issueId });

    // 4. Response
    return NextResponse.json({
      message: 'Attachments retrieved successfully',
      data: attachmentsResult.rows.map((row: any) => ({
        id: row.ID,
        file_name: row.FILE_NAME,
        file_size: row.FILE_SIZE,
        uploaded_by_id: row.UPLOADED_BY_ID,
        created_at: row.CREATED_AT,
      })),
    });
  } catch (error) {
    console.error('GET /api/issues/[id]/attachments error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: RouteParams
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

    if (isNaN(issueId)) {
      return NextResponse.json(
        { message: 'Invalid issue ID' },
        { status: 400 }
      );
    }

    // 2. Verify issue exists
    const issueSql = `SELECT id FROM ISSUE WHERE id = :issueId AND deleted_at IS NULL`;
    const issue = await executeQuerySingle(issueSql, { issueId });

    if (!issue) {
      return NextResponse.json(
        { message: 'Issue not found' },
        { status: 404 }
      );
    }

    // 3. Check current file count
    const countSql = `
      SELECT COUNT(*) as file_count
      FROM ISSUE_ATTACHMENT
      WHERE issue_id = :issueId AND deleted_at IS NULL
    `;
    const countResult = await executeQuerySingle(countSql, { issueId });
    const currentFileCount = countResult?.FILE_COUNT || 0;

    if (currentFileCount >= MAX_FILES_PER_ISSUE) {
      return NextResponse.json(
        {
          message: `Maximum ${MAX_FILES_PER_ISSUE} files per issue`,
          error_code: 'MAX_FILES_EXCEEDED',
        },
        { status: 400 }
      );
    }

    // 4. Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    // 5. Validate file (server-side re-validation)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          message: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
          error_code: 'FILE_TOO_LARGE',
          file_size: file.size,
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          message: 'File type not allowed',
          error_code: 'UNSUPPORTED_FILE_TYPE',
          mime_type: file.type,
        },
        { status: 400 }
      );
    }

    const fileExtension = file.name
      .substring(file.name.lastIndexOf('.'))
      .toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json(
        {
          message: 'File extension not allowed',
          error_code: 'UNSUPPORTED_EXTENSION',
          extension: fileExtension,
        },
        { status: 400 }
      );
    }

    // 6. Save file
    await mkdir(UPLOAD_DIR, { recursive: true });
    const fileName = `${issueId}_${Date.now()}_${uuidv4()}${fileExtension}`;
    const filePath = join(UPLOAD_DIR, fileName);
    const buffer = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(buffer));

    // 7. Create attachment record in database
    const attachmentSeqSql = `SELECT ISSUE_ATTACHMENT_SEQ.NEXTVAL as ID FROM DUAL`;
    const attachmentSeqResult = await executeQuerySingle(attachmentSeqSql);
    const attachmentId = attachmentSeqResult?.ID;

    if (!attachmentId) {
      return NextResponse.json(
        { message: 'Failed to generate attachment ID' },
        { status: 500 }
      );
    }

    const now = new Date();
    const insertSql = `
      INSERT INTO ISSUE_ATTACHMENT (
        id, issue_id, file_name, file_path, file_size, uploaded_by_id, created_at, updated_at, deleted_at
      ) VALUES (
        :id, :issueId, :fileName, :filePath, :fileSize, :uploadedById, :createdAt, :updatedAt, :deletedAt
      )
    `;
    await executeUpdate(insertSql, {
      id: attachmentId,
      issueId,
      fileName: file.name,
      filePath,
      fileSize: file.size,
      uploadedById: userId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    // 8. Record ATTACHMENT_UPLOADED history
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
        changeType: 'ATTACHMENT_UPLOADED',
        oldValue: null,
        newValue: file.name,
        changedById: userId,
        changedAt: now,
        remark: null,
      });
    }

    // 9. Response
    return NextResponse.json(
      {
        message: 'File uploaded successfully',
        data: {
          id: attachmentId,
          file_name: file.name,
          file_size: file.size,
          created_at: now,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/issues/[id]/attachments error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
