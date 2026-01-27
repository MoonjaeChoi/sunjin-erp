// Generated: 2026-01-28 00:05:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeUpdate } from '@/lib/db-direct';

export const dynamic = 'force-dynamic';

// ============================================================
// PUT /api/employees/[id]/accounts/[accountId]/role - 권한 변경
// ============================================================

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; accountId: string }> }
): Promise<NextResponse> {
  try {
    const { id, accountId } = await params;
    const employeeId = parseInt(id, 10);
    const accId = parseInt(accountId, 10);

    if (isNaN(employeeId) || isNaN(accId)) {
      return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
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

    // 2. 계정 존재 확인
    const existing = await executeQuery<{ ID: number; ROLE: string; EMPLOYEE_ID: number }>(
      `SELECT ID, ROLE, EMPLOYEE_ID
       FROM ACCOUNT
       WHERE ID = :accountId AND EMPLOYEE_ID = :employeeId AND DELETED_AT IS NULL`,
      { accountId: accId, employeeId }
    );

    if ((existing.rows || []).length === 0) {
      return NextResponse.json({ message: '계정을 찾을 수 없습니다.' }, { status: 404 });
    }

    const oldRole = existing.rows[0].ROLE;

    // 3. 요청 본문 파싱
    let body: { role?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const { role } = body;

    // 4. role 검증
    const validRoles = ['ADMIN', 'MANAGER', 'USER'];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { message: 'Validation failed', errors: { role: '유효한 역할이 아닙니다. (ADMIN, MANAGER, USER)' } },
        { status: 400 }
      );
    }

    // 5. 변경이 없으면 스킵
    if (oldRole === role) {
      return NextResponse.json({ message: '권한이 동일합니다. 변경 없음.' });
    }

    // 6. 권한 변경
    const now = new Date();
    await executeUpdate(
      `UPDATE ACCOUNT SET ROLE = :role, UPDATED_AT = :now WHERE ID = :accountId`,
      { role, now, accountId: accId }
    );

    // 7. 이력 기록
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
          role: { before: oldRole, after: role },
        }),
        changedById: user.id,
        changedAt: now,
      }
    );

    return NextResponse.json({
      message: `권한이 ${oldRole}에서 ${role}(으)로 변경되었습니다.`,
      data: {
        accountId: accId,
        oldRole,
        newRole: role,
      },
    });

  } catch (error) {
    console.error('PUT /api/employees/[id]/accounts/[accountId]/role error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
