// Generated: 2026-01-25 17:15:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';
import { Project } from '@/entities/Project';
import { ProjectAttachment, AttachmentCategory } from '@/entities/ProjectAttachment';
import { Employee } from '@/entities/Employee';
import { IsNull } from 'typeorm';
import { validateFile, sanitizeFilename, getExtension } from '@/lib/file-utils';
import { randomUUID } from 'crypto';
import { mkdir, writeFile, chmod } from 'fs/promises';
import path from 'path';

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

    const ds = await getDataSource();
    const projectRepo = ds.getRepository(Project);
    const attachmentRepo = ds.getRepository(ProjectAttachment);
    const employeeRepo = ds.getRepository(Employee);

    // 프로젝트 존재 확인
    const project = await projectRepo.findOne({
      where: { id: projectId, deleted_at: IsNull() },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // RBAC 권한 확인 (edit 권한 필요)
    const user = session.user as any;
    if (user.role === 'MANAGER') {
      const employee = await employeeRepo.findOne({
        where: { id: project.employee_id },
      });
      if (employee?.department_id !== user.department_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (user.role === 'USER') {
      if (project.employee_id !== user.id) {
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
    const attachment = new ProjectAttachment();
    attachment.project_id = projectId;
    attachment.file_name = originalName;
    attachment.file_size = file.size;
    attachment.category = category as AttachmentCategory;
    attachment.file_path = relativePath;

    const saved = await attachmentRepo.save(attachment);

    return NextResponse.json(
      {
        id: saved.id,
        file_name: saved.file_name,
        category: saved.category,
        file_size: saved.file_size,
        created_at: saved.created_at.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/projects/[id]/attachments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
