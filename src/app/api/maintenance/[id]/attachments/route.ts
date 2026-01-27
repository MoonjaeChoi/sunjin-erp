// Generated: 2026-01-27 23:45:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { executeQuerySingle, executeQuery, executeUpdate } from '../../../../../lib/db-direct';
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

    // 4. 계약 존재 여부 확인
    const contract = await executeQuerySingle(
      `SELECT MC.ID FROM MAINTENANCE_CONTRACT MC
       WHERE MC.ID = :id AND MC.DELETED_AT IS NULL`,
      { id: contractId }
    );

    if (!contract) {
      return NextResponse.json(
        { error: 'Not Found', details: `Contract with id ${contractId} not found` },
        { status: 404 }
      );
    }

    // 5. 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));

    // 6. 총 첨부파일 개수 조회
    const countResult = await executeQuerySingle(
      `SELECT COUNT(*) as TOTAL FROM MAINTENANCE_CONTRACT_ATTACHMENT
       WHERE MAINTENANCE_CONTRACT_ID = :contract_id AND DELETED_AT IS NULL`,
      { contract_id: contractId }
    );
    const total = parseInt((countResult as any)?.TOTAL || '0');

    // 7. 첨부파일 조회 (페이지네이션)
    const offset = (page - 1) * limit;
    const attachmentsResult = await executeQuery(
      `SELECT ID, FILE_NAME, FILE_PATH, FILE_SIZE, CREATED_AT, UPLOADED_BY_ID
       FROM MAINTENANCE_CONTRACT_ATTACHMENT
       WHERE MAINTENANCE_CONTRACT_ID = :contract_id AND DELETED_AT IS NULL
       ORDER BY CREATED_AT DESC
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      { contract_id: contractId, offset, limit }
    );

    // 8. 성공 응답
    const totalPages = Math.ceil(total / limit);
    return NextResponse.json(
      {
        data: attachmentsResult.rows.map((a: any) => ({
          id: a.ID,
          file_name: a.FILE_NAME,
          file_path: a.FILE_PATH,
          file_size: a.FILE_SIZE,
          created_at: a.CREATED_AT,
          uploaded_by_id: a.UPLOADED_BY_ID,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
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

    // 4. 계약 존재 여부 확인
    const contract = await executeQuerySingle(
      `SELECT MC.ID FROM MAINTENANCE_CONTRACT MC
       WHERE MC.ID = :id AND MC.DELETED_AT IS NULL`,
      { id: contractId }
    );

    if (!contract) {
      return NextResponse.json(
        { error: 'Not Found', details: `Contract with id ${contractId} not found` },
        { status: 404 }
      );
    }

    // 5. 현재 첨부파일 개수 확인
    const countResult = await executeQuerySingle(
      `SELECT COUNT(*) as TOTAL FROM MAINTENANCE_CONTRACT_ATTACHMENT
       WHERE MAINTENANCE_CONTRACT_ID = :contract_id AND DELETED_AT IS NULL`,
      { contract_id: contractId }
    );
    const currentFileCount = parseInt((countResult as any)?.TOTAL || '0');

    if (currentFileCount >= 5) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          details: 'Maximum 5 files allowed per contract',
        },
        { status: 400 }
      );
    }

    // 6. FormData 파싱
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Validation Error', details: 'file is required' },
        { status: 400 }
      );
    }

    // 7. 파일 타입 검증 (MIME 타입 + 확장자)
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

    // 8. 파일 크기 검증 (10MB limit)
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

    // 9. 파일 저장
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const maintenanceDir = path.join(uploadDir, 'maintenance');

    // 디렉토리 생성
    await fs.mkdir(maintenanceDir, { recursive: true });

    // UUID + 원본 파일명
    const uuid = crypto.randomUUID();
    const fileName = `${uuid}${fileExt}`;
    const filePath = path.join(maintenanceDir, fileName);
    const relativeFilePath = `maintenance/${fileName}`;

    // 파일 저장
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // 10. 데이터베이스에 기록
    const userId = (session.user as any)?.id as number;
    const now = new Date();

    const insertResult = await executeUpdate(
      `INSERT INTO MAINTENANCE_CONTRACT_ATTACHMENT
        (ID, MAINTENANCE_CONTRACT_ID, FILE_NAME, FILE_PATH, FILE_SIZE, UPLOADED_BY_ID, CREATED_AT, DELETED_AT)
        VALUES (SEQ_MC_ATTACHMENT.NEXTVAL, :contract_id, :file_name, :file_path, :file_size, :uploaded_by_id, :created_at, NULL)`,
      {
        contract_id: contractId,
        file_name: file.name,
        file_path: relativeFilePath,
        file_size: file.size,
        uploaded_by_id: userId,
        created_at: now,
      }
    );

    // 11. 생성된 첨부파일 ID 조회
    const attachmentResult = await executeQuerySingle(
      `SELECT ID, FILE_NAME, FILE_SIZE, CREATED_AT FROM MAINTENANCE_CONTRACT_ATTACHMENT
       WHERE MAINTENANCE_CONTRACT_ID = :contract_id AND DELETED_AT IS NULL
       ORDER BY CREATED_AT DESC FETCH FIRST 1 ROWS ONLY`,
      { contract_id: contractId }
    );

    const attachment = attachmentResult as any;

    // 12. 성공 응답
    return NextResponse.json(
      {
        id: attachment.ID,
        file_name: attachment.FILE_NAME,
        file_size: attachment.FILE_SIZE,
        created_at: attachment.CREATED_AT,
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
