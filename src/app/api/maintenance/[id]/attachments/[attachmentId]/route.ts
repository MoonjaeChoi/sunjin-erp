// Generated: 2026-01-26 23:45:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';
import { IsNull } from 'typeorm';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/maintenance/[id]/attachments/[attachmentId]
 *
 * 파일 첨부 삭제 (Soft Delete)
 * - 권한: ADMIN만
 * - deleted_at 설정 (물리적 삭제 아님)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    // 1. 세션 검증
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 권한 검증 (ADMIN만)
    const userRole = (session.user as any)?.role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. ID 파싱 및 검증
    const contractId = parseInt(params.id);
    const attachmentId = parseInt(params.attachmentId);

    if (isNaN(contractId)) {
      return NextResponse.json(
        { error: 'Validation Error', details: 'Invalid contract ID' },
        { status: 400 }
      );
    }

    if (isNaN(attachmentId)) {
      return NextResponse.json(
        { error: 'Validation Error', details: 'Invalid attachment ID' },
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
      '@/lib/maintenance-repository'
    );
    const repository = new MaintenanceContractRepository(dataSource);
    const contract = await repository.findById(contractId);

    if (!contract) {
      return NextResponse.json(
        { error: 'Not Found', details: `Contract with id ${contractId} not found` },
        { status: 404 }
      );
    }

    // 6. 첨부파일 존재 여부 확인 및 Soft Delete
    const { MaintenanceContractAttachment } = await import(
      '@/entities/MaintenanceContractAttachment'
    );
    const attachmentRepo = dataSource.getRepository(MaintenanceContractAttachment);

    const attachment = await attachmentRepo.findOne({
      where: {
        id: attachmentId,
        maintenance_contract_id: contractId,
        deleted_at: IsNull(),
      },
    });

    if (!attachment) {
      return NextResponse.json(
        {
          error: 'Not Found',
          details: `Attachment with id ${attachmentId} not found`,
        },
        { status: 404 }
      );
    }

    // 7. Soft Delete 수행
    await attachmentRepo.update(
      { id: attachmentId },
      { deleted_at: new Date() }
    );

    // 8. 성공 응답
    return NextResponse.json(
      { message: 'Attachment deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      `DELETE /api/maintenance/[id]/attachments/[attachmentId] error:`,
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
