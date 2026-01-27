// Generated: 2026-01-27 23:45:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { executeQuerySingle, executeQuery } from '../../../../../lib/db-direct';

export const dynamic = 'force-dynamic';

/**
 * GET /api/maintenance/[id]/history
 *
 * 계약 변경 이력 조회 (페이지네이션)
 * - 권한: USER+ (모든 인증 사용자)
 * - 정렬: changed_at DESC (최신순)
 * - 페이지네이션: 20개/페이지
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
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    // 6. 총 이력 개수 조회
    const countResult = await executeQuerySingle(
      `SELECT COUNT(*) as TOTAL FROM MAINTENANCE_CONTRACT_HISTORY
       WHERE MAINTENANCE_CONTRACT_ID = :contract_id AND DELETED_AT IS NULL`,
      { contract_id: contractId }
    );
    const total = parseInt((countResult as any)?.TOTAL || '0');

    // 7. 이력 조회 (페이지네이션)
    const offset = (page - 1) * limit;
    const historiesResult = await executeQuery(
      `SELECT ID, MAINTENANCE_CONTRACT_ID, CHANGE_TYPE, REASON, CHANGED_BY_ID, CHANGED_AT
       FROM MAINTENANCE_CONTRACT_HISTORY
       WHERE MAINTENANCE_CONTRACT_ID = :contract_id AND DELETED_AT IS NULL
       ORDER BY CHANGED_AT DESC
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      { contract_id: contractId, offset, limit }
    );

    // 8. 성공 응답
    const totalPages = Math.ceil(total / limit);
    return NextResponse.json(
      {
        data: historiesResult.rows.map((h: any) => ({
          id: h.ID,
          maintenance_contract_id: h.MAINTENANCE_CONTRACT_ID,
          change_type: h.CHANGE_TYPE,
          reason: h.REASON,
          changed_by_id: h.CHANGED_BY_ID,
          changed_at: h.CHANGED_AT,
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
    console.error(`GET /api/maintenance/[id]/history error:`, error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
