// Generated: 2026-01-25 17:15:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';
import { Project } from '../../../../../../entities/Project';
import { ProjectAttachment } from '../../../../../../entities/ProjectAttachment';
import { Employee } from '../../../../../../entities/Employee';
import { IsNull } from 'typeorm';
import { getMimeType, getExtension } from '@/lib/file-utils';
import { readFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

function getUploadDir(): string {
  return process.env.UPLOAD_DIR || './uploads';
}

/**
 * GET /api/projects/[id]/attachments/[attachmentId]
 * 첨부파일 다운로드
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = parseInt(params.id, 10);
    const attachmentId = parseInt(params.attachmentId, 10);

    if (isNaN(projectId) || isNaN(attachmentId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
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

    // RBAC 권한 확인 (read 권한, 모든 역할이 접근 가능)
    const user = session.user as any;
    if (user.role === 'MANAGER') {
      const employee = await employeeRepo.findOne({
        where: { id: project.employee_id },
      });
      if (employee?.department_id !== user.department) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (user.role === 'USER') {
      if (project.employee_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // 첨부파일 조회
    const attachment = await attachmentRepo.findOne({
      where: { id: attachmentId, project_id: projectId },
    });

    if (!attachment || !attachment.file_path) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // 파일 읽기
    const uploadDir = getUploadDir();
    const filePath = path.resolve(uploadDir, attachment.file_path);
    const fileBuffer = await readFile(filePath);

    const ext = getExtension(attachment.file_name);
    const mimeType = getMimeType(ext);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.file_name)}"`,
        'Content-Length': String(fileBuffer.length),
      },
    });
  } catch (error) {
    console.error('GET /api/projects/[id]/attachments/[attachmentId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/projects/[id]/attachments/[attachmentId]
 * 첨부파일 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
): Promise<NextResponse<{ success: boolean } | { error: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = parseInt(params.id, 10);
    const attachmentId = parseInt(params.attachmentId, 10);

    if (isNaN(projectId) || isNaN(attachmentId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
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
      if (employee?.department_id !== user.department) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (user.role === 'USER') {
      if (project.employee_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // 첨부파일 존재 확인
    const attachment = await attachmentRepo.findOne({
      where: { id: attachmentId, project_id: projectId },
    });

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // 파일 물리 삭제
    if (attachment.file_path) {
      try {
        const { unlink } = await import('fs/promises');
        const uploadDir = getUploadDir();
        const filePath = path.resolve(uploadDir, attachment.file_path);
        await unlink(filePath);
      } catch {
        // 파일이 없는 경우 무시
      }
    }

    // DB 삭제
    await attachmentRepo.remove(attachment);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/projects/[id]/attachments/[attachmentId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
