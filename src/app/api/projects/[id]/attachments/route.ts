// Generated: 2026-01-28 00:05:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeQuerySingle, executeUpdate } from '@/lib/db-direct';
import { validateFile, sanitizeFilename, getExtension } from '@/lib/file-utils';
import { randomUUID } from 'crypto';
import { mkdir, writeFile, chmod } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

interface ProjectAttachmentResponse {
  id: number;
  file_name: string;
  category: string;
  file_size: number;
  created_at: string;
}

function getUploadDir(): string {
  return process.env.UPLOAD_DIR || './uploads';
}

/**
 * POST /api/projects/[id]/attachments
 * 프로젝트 첨부파일 업로드
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ProjectAttachmentResponse | { error: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = parseInt(params.id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // 프로젝트 존재 확인
    const projectResult = await executeQuerySingle(
      'SELECT id, employee_id FROM PROJECT WHERE id = :id AND deleted_at IS NULL',
      { id: projectId }
    );

    if (!projectResult) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // RBAC 권한 확인 (edit 권한 필요)
    const user = session.user as any;
    if (user.role === 'MANAGER') {
      const employeeResult = await executeQuerySingle(
        'SELECT department_id FROM EMPLOYEE WHERE id = :id',
        { id: projectResult.employee_id }
      );
      if (employeeResult?.department_id !== user.department) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (user.role === 'USER') {
      if (projectResult.employee_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // FormData 파싱
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = formData.get('category') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    // 파일 검증
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid file' },
        { status: 400 }
      );
    }

    // 파일명 sanitize
    const originalName = sanitizeFilename(file.name);
    const ext = getExtension(originalName);
    const uuid = randomUUID();
    const storedFilename = `${uuid}.${ext}`;

    // 저장 경로
    const uploadDir = getUploadDir();
    const dirPath = path.resolve(uploadDir, 'projects', String(projectId));
    const filePath = path.join(dirPath, storedFilename);

    // 디렉토리 생성
    await mkdir(dirPath, { recursive: true });

    // 파일 쓰기
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    await chmod(filePath, 0o644);

    // DB 저장
    const relativePath = path.join('projects', String(projectId), storedFilename);
    const now = new Date();

    const insertSql = `
      INSERT INTO PROJECT_ATTACHMENT (
        project_id, file_name, file_size, category, file_path, created_at
      ) VALUES (
        :projectId, :fileName, :fileSize, :category, :filePath, :now
      )
    `;

    const insertResult = await executeQuery(
      insertSql + ' RETURNING id',
      {
        projectId,
        fileName: originalName,
        fileSize: file.size,
        category,
        filePath: relativePath,
        now,
      }
    );

    const attachmentId = insertResult.rows[0]?.id || null;
    if (!attachmentId) {
      const lastIdResult = await executeQuerySingle(
        'SELECT MAX(id) as id FROM PROJECT_ATTACHMENT'
      );
      return NextResponse.json(
        {
          id: lastIdResult?.id,
          file_name: originalName,
          category,
          file_size: file.size,
          created_at: now.toISOString(),
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        id: attachmentId,
        file_name: originalName,
        category,
        file_size: file.size,
        created_at: now.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/projects/[id]/attachments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
