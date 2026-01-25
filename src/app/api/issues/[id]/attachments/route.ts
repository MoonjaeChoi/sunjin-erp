// Generated: 2026-01-25 21:00:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getDataSource } from '@/lib/db';
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

    // 2. Get datasource and repositories
    const dataSource = await getDataSource();
    const { Issue } = await import('@/entities/Issue');
    const { IssueAttachment } = await import('@/entities/IssueAttachment');
    const issueRepo = dataSource.getRepository(Issue);
    const attachmentRepo = dataSource.getRepository(IssueAttachment);

    // 3. Fetch issue
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

    // 4. Check current file count
    const currentFileCount = await attachmentRepo.count({
      where: {
        issue_id: issueId,
        deleted_at: null as any,
      },
    });

    if (currentFileCount >= MAX_FILES_PER_ISSUE) {
      return NextResponse.json(
        {
          message: `Maximum ${MAX_FILES_PER_ISSUE} files per issue`,
          error_code: 'MAX_FILES_EXCEEDED',
        },
        { status: 400 }
      );
    }

    // 5. Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    // 6. Validate file (server-side re-validation)
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

    // 7. Save file
    await mkdir(UPLOAD_DIR, { recursive: true });
    const fileName = `${issueId}_${Date.now()}_${uuidv4()}${fileExtension}`;
    const filePath = join(UPLOAD_DIR, fileName);
    const buffer = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(buffer));

    // 8. Create IssueAttachment entity
    const attachment = new IssueAttachment();
    attachment.issue_id = issueId;
    attachment.file_name = file.name;
    attachment.file_path = filePath;
    attachment.file_size = file.size;
    attachment.uploaded_by_id = userId;

    await attachmentRepo.save(attachment);

    // 9. Record ATTACHMENT_UPLOADED history
    const { IssueHistory } = await import('@/entities/IssueHistory');
    const historyRepo = dataSource.getRepository(IssueHistory);
    const history = new IssueHistory();
    history.issue_id = issueId;
    history.change_type = 'ATTACHMENT_UPLOADED';
    history.old_value = null;
    history.new_value = file.name;
    history.changed_by_id = userId;

    await historyRepo.save(history);

    // 10. Response
    return NextResponse.json(
      {
        message: 'File uploaded successfully',
        data: {
          id: attachment.id,
          file_name: attachment.file_name,
          file_size: attachment.file_size,
          created_at: attachment.created_at,
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
