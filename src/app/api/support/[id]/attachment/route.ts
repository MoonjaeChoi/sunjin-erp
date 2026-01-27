// Generated: 2026-01-27 23:45:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeQuerySingle, executeUpdate } from '@/lib/db-direct';
import { validateFile, sanitizeFilename, getMimeType, getExtension } from '@/lib/file-utils';
import { randomUUID } from 'crypto';
import { mkdir, writeFile, unlink, readFile, chmod } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

function getUploadDir(): string {
  return process.env.UPLOAD_DIR || './uploads';
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = Number(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    const support = await executeQuerySingle<any>(
      `SELECT "id", "employee_id", "attachment_path", "attachment_name"
       FROM TECH_SUPPORT
       WHERE "id" = :id AND "deleted_at" IS NULL`,
      { id }
    );

    if (!support) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // RBAC: 본인 건 또는 ADMIN
    const user = session.user as any;
    if (user.role !== 'ADMIN' && support.employee_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // FormData 파싱
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 파일 검증
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 파일명 sanitize
    const originalName = sanitizeFilename(file.name);
    const ext = getExtension(originalName);
    const uuid = randomUUID();
    const storedFilename = `${uuid}.${ext}`;

    // 저장 경로
    const uploadDir = getUploadDir();
    const dirPath = path.resolve(uploadDir, 'support', String(id));
    const filePath = path.join(dirPath, storedFilename);

    // 기존 파일 삭제
    if (support.attachment_path) {
      try {
        const existingPath = path.resolve(uploadDir, support.attachment_path);
        await unlink(existingPath);
      } catch {
        // 파일이 없는 경우 무시
      }
    }

    // 디렉토리 생성
    await mkdir(dirPath, { recursive: true });

    // 파일 쓰기
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    await chmod(filePath, 0o644);

    // DB 업데이트
    const relativePath = path.join('support', String(id), storedFilename);
    await executeUpdate(
      `UPDATE TECH_SUPPORT
       SET "attachment_path" = :attachmentPath,
           "attachment_name" = :attachmentName
       WHERE "id" = :id`,
      {
        attachmentPath: relativePath,
        attachmentName: originalName,
        id,
      }
    );

    return NextResponse.json({
      attachment_path: relativePath,
      attachment_name: originalName,
    });
  } catch (error) {
    console.error('POST /api/support/[id]/attachment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = Number(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    const support = await executeQuerySingle<any>(
      `SELECT "id", "employee_id", "attachment_path", "attachment_name"
       FROM TECH_SUPPORT
       WHERE "id" = :id AND "deleted_at" IS NULL`,
      { id }
    );

    if (!support) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // RBAC: 본인 건 또는 ADMIN
    const user = session.user as any;
    if (user.role !== 'ADMIN' && support.employee_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!support.attachment_path) {
      return NextResponse.json({ error: 'No attachment' }, { status: 404 });
    }

    const uploadDir = getUploadDir();
    const filePath = path.resolve(uploadDir, support.attachment_path);

    const fileBuffer = await readFile(filePath);
    const ext = getExtension(support.attachment_name || support.attachment_path);
    const mimeType = getMimeType(ext);
    const filename = support.attachment_name || path.basename(support.attachment_path);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': String(fileBuffer.length),
      },
    });
  } catch (error) {
    console.error('GET /api/support/[id]/attachment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = Number(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    const support = await executeQuerySingle<any>(
      `SELECT "id", "employee_id", "attachment_path", "attachment_name"
       FROM TECH_SUPPORT
       WHERE "id" = :id AND "deleted_at" IS NULL`,
      { id }
    );

    if (!support) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // RBAC: 본인 건 또는 ADMIN
    const user = session.user as any;
    if (user.role !== 'ADMIN' && support.employee_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!support.attachment_path) {
      return NextResponse.json({ error: 'No attachment' }, { status: 404 });
    }

    // 파일 물리 삭제
    try {
      const uploadDir = getUploadDir();
      const filePath = path.resolve(uploadDir, support.attachment_path);
      await unlink(filePath);
    } catch {
      // 파일이 이미 없는 경우 무시
    }

    // DB 업데이트
    await executeUpdate(
      `UPDATE TECH_SUPPORT
       SET "attachment_path" = NULL,
           "attachment_name" = NULL
       WHERE "id" = :id`,
      { id }
    );

    return NextResponse.json({ message: 'Attachment deleted' });
  } catch (error) {
    console.error('DELETE /api/support/[id]/attachment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
