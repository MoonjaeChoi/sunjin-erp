// Generated: 2026-01-26 23:15:00 KST


import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { getDataSource } from '../../../../../lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/maintenance/[id]/status
 *
 * 유지보수 계약 상태 변경
 * - 권한: MANAGER+ (MANAGER, ADMIN)
 * - 상태 전이 검증 (VALID_STATUS_TRANSITIONS)
 * - 이력 자동 기록 (change_type: '상태변경')
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

    // 5. 요청 본문 파싱
    const body = await request.json();
    const { status, reason } = body;

    // 6. 필수 필드 검증
    if (!status || !reason) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          details: 'status and reason are required',
        },
        { status: 400 }
      );
    }

    if (typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          details: 'reason must be a non-empty string',
        },
        { status: 400 }
      );
    }

    // 7. 저장소 동적 import 및 기존 계약 조회
    const { MaintenanceContractRepository } = await import(
      '../../../../../lib/maintenance-repository'
    );
    const repository = new MaintenanceContractRepository(dataSource);
    const existingContract = await repository.findById(contractId);

    if (!existingContract) {
      return NextResponse.json(
        { error: 'Not Found', details: `Contract with id ${contractId} not found` },
        { status: 404 }
      );
    }

    // 8. 상태 전이 검증
    const { VALID_STATUS_TRANSITIONS } = await import(
      '../../../../../lib/maintenance-constants'
    );
    const currentStatus = existingContract.contract_status as string;
    const validNextStatuses = (VALID_STATUS_TRANSITIONS as any)[currentStatus];

    if (!validNextStatuses || !validNextStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          details: `Cannot transition from ${currentStatus} to ${status}. Valid transitions: ${
            validNextStatuses ? validNextStatuses.join(', ') : 'none'
          }`,
        },
        { status: 400 }
      );
    }

    // 9. 서비스를 통해 상태 변경 (트랜잭션 포함)
    const { MaintenanceContractService } = await import(
      '../../../../../lib/maintenance-service'
    );
    const service = new MaintenanceContractService(dataSource);
    const userId = (session.user as any)?.id as number;

    const updatedContract = await service.changeStatus(
      contractId,
      status,
      reason,
      userId
    );

    if (!updatedContract) {
      return NextResponse.json(
        { error: 'Not Found', details: `Contract with id ${contractId} not found` },
        { status: 404 }
      );
    }

    // 10. 성공 응답
    return NextResponse.json(
      {
        id: updatedContract.id,
        contract_status: updatedContract.contract_status,
        message: 'Status updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`POST /api/maintenance/[id]/status error:`, error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
