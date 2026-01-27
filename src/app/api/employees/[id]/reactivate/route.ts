// Generated: 2026-01-28 00:10:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeUpdate } from '@/lib/db-direct';

export const dynamic = 'force-dynamic';

// ============================================================
// POST /api/employees/[id]/reactivate - 계정 활성화
// ============================================================

export async function POST(
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

    // 2. 직원 및 계정 확인
    const existing = await executeQuery<{
      EMP_ID: number;
      EMP_NAME: string;
      ACC_ID: number | null;
      IS_ACTIVE: number | null;
    }>(
      `SELECT
        e.ID as EMP_ID, e.NAME as EMP_NAME,
        a.ID as ACC_ID, a.IS_ACTIVE as IS_ACTIVE
       FROM EMPLOYEE e
       LEFT JOIN ACCOUNT a ON a.EMPLOYEE_ID = e.ID AND a.DELETED_AT IS NULL
       WHERE e.ID = :employeeId AND e.DELETED_AT IS NULL`,
      { employeeId }
    );

    if ((existing.rows || []).length === 0) {
      return NextResponse.json({ message: '직원을 찾을 수 없습니다.' }, { status: 404 });
    }

    const emp = existing.rows[0];

    if (!emp.ACC_ID) {
      return NextResponse.json({ message: '계정이 존재하지 않습니다.' }, { status: 400 });
    }

    if (emp.IS_ACTIVE === 1) {
      return NextResponse.json({ message: '이미 활성화된 계정입니다.' }, { status: 400 });
    }

    // 3. 계정 활성화
    const now = new Date();
    await executeUpdate(
      `UPDATE ACCOUNT SET IS_ACTIVE = 1, UPDATED_AT = :now WHERE ID = :accountId`,
      { now, accountId: emp.ACC_ID }
    );

    // 4. 이력 기록
    await executeUpdate(
      `INSERT INTO EMPLOYEE_HISTORY (
        EMPLOYEE_ID, CHANGE_TYPE, CHANGED_FIELDS, CHANGED_BY_ID, CHANGED_AT
      ) VALUES (
        :employeeId, :changeType, :changedFields, :changedById, :changedAt
      )`,
      {
        employeeId,
        changeType: 'UPDATE',
        changedFields: JSON.stringify({
          isActive: { before: false, after: true },
        }),
        changedById: user.id,
        changedAt: now,
      }
    );

    return NextResponse.json({
      message: `'${emp.EMP_NAME}' 직원의 계정이 활성화되었습니다. 다시 로그인할 수 있습니다.`,
      data: {
        id: emp.ACC_ID,
        isActive: true,
      },
    });

  } catch (error) {
    console.error('POST /api/employees/[id]/reactivate error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
