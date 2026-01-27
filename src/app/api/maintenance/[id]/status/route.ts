// Generated: 2026-01-27 23:45:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { executeQuerySingle, executeTransaction } from '../../../../../lib/db-direct';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/maintenance/[id]/status
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

    // 4. 요청 본문 파싱
    const body = await request.json();
    const { status, reason } = body;

    // 5. 필수 필드 검증
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

    // 6. 기존 계약 조회
    const existingContract = await executeQuerySingle(
      `SELECT MC.* FROM MAINTENANCE_CONTRACTS MC
       WHERE MC.ID = :id AND MC.DELETED_AT IS NULL`,
      { id: contractId }
    );

    if (!existingContract) {
      return NextResponse.json(
        { error: 'Not Found', details: `Contract with id ${contractId} not found` },
        { status: 404 }
      );
    }

    // 7. 상태 전이 검증
    const { VALID_STATUS_TRANSITIONS } = await import(
      '../../../../../lib/maintenance-constants'
    );
    const existing = existingContract as any;
    const currentStatus = existing.CONTRACT_STATUS;
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

    // 8. 트랜잭션으로 상태 변경 + 이력 기록
    const userId = (session.user as any)?.id as number;
    const now = new Date();

    await executeTransaction([
      {
        query: `UPDATE MAINTENANCE_CONTRACTS SET CONTRACT_STATUS = :status, UPDATED_AT = :updated_at, UPDATED_BY_ID = :updated_by_id WHERE ID = :id`,
        params: {
          id: contractId,
          status,
          updated_at: now,
          updated_by_id: userId,
        },
      },
      {
        query: `INSERT INTO MAINTENANCE_CONTRACT_HISTORIES
          (ID, MAINTENANCE_CONTRACT_ID, CHANGE_TYPE, REASON, CHANGED_BY_ID, CHANGED_AT, DELETED_AT)
          VALUES (SEQ_MAINTENANCE_CONTRACT_HISTORIES.NEXTVAL, :contract_id, '상태변경', :reason, :changed_by_id, :changed_at, NULL)`,
        params: {
          contract_id: contractId,
          reason,
          changed_by_id: userId,
          changed_at: now,
        },
      },
    ]);

    // 9. 수정된 계약 조회 및 반환
    const updatedContract = await executeQuerySingle(
      `SELECT MC.ID, MC.CONTRACT_STATUS FROM MAINTENANCE_CONTRACTS MC WHERE MC.ID = :id`,
      { id: contractId }
    );

    const updated = updatedContract as any;

    // 10. 성공 응답
    return NextResponse.json(
      {
        id: updated.ID,
        contract_status: updated.CONTRACT_STATUS,
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
