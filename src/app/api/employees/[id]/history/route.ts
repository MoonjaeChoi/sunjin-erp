// Generated: 2026-01-28 00:15:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery } from '@/lib/db-direct';

export const dynamic = 'force-dynamic';

// ============================================================
// GET /api/employees/[id]/history - 직원 변경 이력 조회
// ============================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const employeeId = parseInt(id, 10);

    if (isNaN(employeeId)) {
      return NextResponse.json({ message: 'Invalid employee ID' }, { status: 400 });
    }

    // 1. 인증/권한 검증
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // 2. 직원 존재 확인 (soft deleted 포함 - 이력은 모두 조회 가능)
    const empExists = await executeQuery(
      `SELECT ID FROM EMPLOYEE WHERE ID = :id`,
      { id: employeeId }
    );

    if ((empExists.rows || []).length === 0) {
      return NextResponse.json({ message: '직원을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 3. 쿼리 파라미터
    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const changeType = searchParams.get('changeType');

    // 4. WHERE 절 구성
    const whereClauses = ['h.EMPLOYEE_ID = :employeeId'];
    const queryParams: Record<string, any> = {
      employeeId,
      offset: (page - 1) * limit,
      pageSize: limit,
    };

    if (changeType && ['CREATE', 'UPDATE', 'DELETE', 'DEACTIVATE'].includes(changeType)) {
      whereClauses.push('h.CHANGE_TYPE = :changeType');
      queryParams.changeType = changeType;
    }

    // 5. 이력 조회
    const listQuery = `
      SELECT
        h.ID,
        h.EMPLOYEE_ID,
        h.CHANGE_TYPE,
        h.CHANGED_FIELDS,
        h.CHANGED_BY_ID,
        e.NAME as CHANGED_BY_NAME,
        h.CHANGED_AT
       FROM EMPLOYEE_HISTORY h
       LEFT JOIN EMPLOYEE e ON h.CHANGED_BY_ID = e.ID
       WHERE ${whereClauses.join(' AND ')}
       ORDER BY h.CHANGED_AT DESC
       OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY
    `;

    const countQuery = `
      SELECT COUNT(*) as TOTAL
      FROM EMPLOYEE_HISTORY h
      WHERE ${whereClauses.join(' AND ')}
    `;

    const [listResult, countResult] = await Promise.all([
      executeQuery<{
        ID: number;
        EMPLOYEE_ID: number;
        CHANGE_TYPE: string;
        CHANGED_FIELDS: string;
        CHANGED_BY_ID: number;
        CHANGED_BY_NAME: string | null;
        CHANGED_AT: Date;
      }>(listQuery, queryParams),
      executeQuery<{ TOTAL: number }>(countQuery, queryParams),
    ]);

    // 6. 응답 변환
    const history = (listResult.rows || []).map(row => {
      let changedFields = {};
      try {
        changedFields = row.CHANGED_FIELDS ? JSON.parse(row.CHANGED_FIELDS) : {};
      } catch {
        changedFields = {};
      }

      return {
        id: row.ID,
        employeeId: row.EMPLOYEE_ID,
        changeType: row.CHANGE_TYPE,
        changedFields,
        changedById: row.CHANGED_BY_ID,
        changedByName: row.CHANGED_BY_NAME,
        changedAt: row.CHANGED_AT?.toISOString() || '',
      };
    });

    const total = (countResult.rows || [])[0]?.TOTAL || 0;

    return NextResponse.json({
      data: history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('GET /api/employees/[id]/history error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
