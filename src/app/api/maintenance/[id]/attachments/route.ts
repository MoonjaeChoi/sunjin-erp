// Generated: 2026-01-26 23:30:00 KST

// CRITICAL: Load reflect-metadata BEFORE any imports
require('reflect-metadata');


import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { getDataSource } from '../../../../../lib/db';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/maintenance/[id]/attachments
 *
 * 파일 첨부 목록 조회 (페이지네이션)
 * - 권한: USER+ (모든 인증 사용자)
 * - 응답: { data: [], pagination: { page, limit, total } }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 세션 검증
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 권한 검증 (USER, MANAGER, ADMIN)
    const allowedRoles = ['USER', 'MANAGER', 'ADMIN'];
    const userRole = (session.user as any)?.role;
    if (!allowedRoles.includes(userRole as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. ID 파싱 및 검증
    const contractId = parseInt(params.id);
    if (isNaN(contractId)) {
      return NextResponse.json(
        { error: 'Validation Error', details: 'Invalid contract ID' },
        { status: 400 }
      );
    }

    // 4. 데이터베이스 연결 확인
    const dataSource = await getDataSource();
    if (!dataSource.isInitialized) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // 5. 계약 존재 여부 확인
    const { MaintenanceContractRepository } = await import(
      '../../../../../lib/maintenance-repository'
    );
    const repository = new MaintenanceContractRepository(dataSource);
    const contract = await repository.findById(contractId);

    if (!contract) {
      return NextResponse.json(
        { error: 'Not Found', details: `Contract with id ${contractId} not found` },
        { status: 404 }
      );
    }

    // 6. 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));

    // 7. 첨부파일 조회
    const attachments = await repository.findAttachments(contractId);

    // 8. 페이지네이션 처리 (간단한 인메모리 페이지네이션)
    const total = attachments.length;
    const offset = (page - 1) * limit;
    const paginatedAttachments = attachments.slice(offset, offset + limit);

    // 9. 성공 응답
    return NextResponse.json(
      {
        data: paginatedAttachments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      `GET /api/maintenance/[id]/attachments error:`,
      error
    );
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/maintenance/[id]/attachments
 *
 * 파일 업로드
 * - 권한: MANAGER+ (MANAGER, ADMIN)
 * - MIME 검증: PDF, DOCX, DOC만
 * - 파일 크기: 최대 10MB
 * - 파일 개수: 최대 5개
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 세션 검증
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 권한 검증 (MANAGER, ADMIN만)
    const allowedRoles = ['MANAGER', 'ADMIN'];
    const userRole = (session.user as any)?.role;
    if (!allowedRoles.includes(userRole as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. ID 파싱 및 검증
    const contractId = parseInt(params.id);
    if (isNaN(contractId)) {
      return NextResponse.json(
        { error: 'Validation Error', details: 'Invalid contract ID' },
        { status: 400 }
      );
    }

    // 4. 데이터베이스 연결 확인
    const dataSource = await getDataSource();
    if (!dataSource.isInitialized) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // 5. 계약 존재 여부 확인
    const { MaintenanceContractRepository } = await import(
      '../../../../../lib/maintenance-repository'
    );
    const repository = new MaintenanceContractRepository(dataSource);
    const contract = await repository.findById(contractId);

    if (!contract) {
      return NextResponse.json(
        { error: 'Not Found', details: `Contract with id ${contractId} not found` },
        { status: 404 }
      );
    }

    // 6. 현재 첨부파일 개수 확인
    const existingAttachments = await repository.findAttachments(contractId);
    if (existingAttachments.length >= 5) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          details: 'Maximum 5 files allowed per contract',
        },
        { status: 400 }
      );
    }

    // 7. FormData 파싱
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Validation Error', details: 'file is required' },
        { status: 400 }
      );
    }

    // 8. 파일 타입 검증 (MIME 타입 + 확장자)
    const fileExt = path.extname(file.name).toLowerCase();
    const validExtensions = ['.pdf', '.doc', '.docx'];
    const validMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    // MIME type check (if available)
    let isValidType = false;
    if (file.type && validMimeTypes.includes(file.type)) {
      isValidType = true;
    }
    // Extension check as fallback
    if (!isValidType && validExtensions.includes(fileExt)) {
      isValidType = true;
    }

    if (!isValidType) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          details: `Invalid file type. Allowed extensions: ${validExtensions.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // 9. 파일 크기 검증 (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          details: `File size exceeds 10MB limit`,
        },
        { status: 400 }
      );
    }

    // 10. 파일 저장
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const maintenanceDir = path.join(uploadDir, 'maintenance');

    // 디렉토리 생성
    await fs.mkdir(maintenanceDir, { recursive: true });

    // UUID + 원본 파일명 (fileExt는 이미 위에서 선언됨)
    const uuid = crypto.randomUUID();
    const fileName = `${uuid}${fileExt}`;
    const filePath = path.join(maintenanceDir, fileName);
    const relativeFilePath = `maintenance/${fileName}`;

    // 파일 저장
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // 11. 데이터베이스에 기록
    const { MaintenanceContractService } = await import(
      '../../../../../lib/maintenance-service'
    );
    const service = new MaintenanceContractService(dataSource);
    const userId = (session.user as any)?.id as number;

    const attachment = await service.addAttachment(contractId, {
      file_name: file.name,
      file_path: relativeFilePath,
      file_size: file.size,
      uploaded_by_id: userId,
    });

    // 12. 성공 응답
    return NextResponse.json(
      {
        id: attachment.id,
        file_name: attachment.file_name,
        file_size: attachment.file_size,
        created_at: attachment.created_at,
        message: 'File uploaded successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(`POST /api/maintenance/[id]/attachments error:`, error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
