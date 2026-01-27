// Generated: 2026-01-28 00:05:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeUpdate } from '@/lib/db-direct';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

const SALT_ROUNDS = 10;

// ============================================================
// POST /api/employees/[id]/accounts - 계정 생성
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

    // 2. 직원 존재 확인
    const empExists = await executeQuery<{ ID: number; NAME: string; EMAIL: string }>(
      `SELECT ID, NAME, EMAIL
       FROM EMPLOYEE WHERE ID = :id AND DELETED_AT IS NULL`,
      { id: employeeId }
    );

    if ((empExists.rows || []).length === 0) {
      return NextResponse.json({ message: '직원을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 3. 기존 계정 확인
    const existingAccount = await executeQuery(
      `SELECT ID FROM ACCOUNT WHERE EMPLOYEE_ID = :employeeId AND DELETED_AT IS NULL`,
      { employeeId }
    );

    if ((existingAccount.rows || []).length > 0) {
      return NextResponse.json(
        { message: '이미 계정이 존재합니다.' },
        { status: 400 }
      );
    }

    // 4. 요청 본문 파싱
    let body: { username?: string; password?: string; role?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const { username, password, role } = body;

    // 5. 유효성 검증
    const errors: Record<string, string> = {};

    // 5a. username 검증
    if (!username || username.trim().length === 0) {
      errors.username = '사용자명은 필수입니다.';
    } else if (username.length < 6 || username.length > 20) {
      errors.username = '사용자명은 6~20자 사이여야 합니다.';
    } else if (!/^[a-zA-Z0-9]+$/.test(username)) {
      errors.username = '사용자명은 영문과 숫자만 사용 가능합니다.';
    } else {
      // username 중복 검증
      const existingUsername = await executeQuery(
        `SELECT ID FROM ACCOUNT WHERE USERNAME = :username AND DELETED_AT IS NULL`,
        { username: username.trim() }
      );
      if ((existingUsername.rows || []).length > 0) {
        errors.username = '이미 존재하는 사용자명입니다.';
      }
    }

    // 5b. password 검증 (Decision #5: Phase 1은 수동 설정)
    if (!password || password.length === 0) {
      errors.password = '비밀번호는 필수입니다.';
    } else if (password.length < 8) {
      errors.password = '비밀번호는 최소 8자 이상이어야 합니다.';
    } else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.password = '비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.';
    }

    // 5c. role 검증
    const validRoles = ['ADMIN', 'MANAGER', 'USER'];
    if (!role) {
      errors.role = '역할은 필수입니다.';
    } else if (!validRoles.includes(role)) {
      errors.role = '유효한 역할이 아닙니다. (ADMIN, MANAGER, USER)';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
    }

    // 6. 비밀번호 해시
    const passwordHash = await bcrypt.hash(password!, SALT_ROUNDS);

    // 7. 계정 생성
    const now = new Date();
    await executeUpdate(
      `INSERT INTO ACCOUNT (
        EMPLOYEE_ID, USERNAME, PASSWORD_HASH, ROLE, IS_ACTIVE,
        PASSWORD_CHANGED_AT, CREATED_AT, UPDATED_AT
      ) VALUES (
        :employeeId, :username, :passwordHash, :role, 1,
        :now, :now, :now
      )`,
      {
        employeeId,
        username: username!.trim(),
        passwordHash,
        role,
        now,
      }
    );

    // 8. 생성된 계정 조회
    const created = await executeQuery<{
      ID: number;
      EMPLOYEE_ID: number;
      USERNAME: string;
      ROLE: string;
      IS_ACTIVE: number;
      CREATED_AT: Date;
    }>(
      `SELECT ID, EMPLOYEE_ID, USERNAME, ROLE, IS_ACTIVE, CREATED_AT
       FROM ACCOUNT
       WHERE EMPLOYEE_ID = :employeeId AND DELETED_AT IS NULL`,
      { employeeId }
    );

    const acc = created.rows[0];

    // 9. 이력 기록
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
          account: { before: null, after: { username: username!.trim(), role } },
        }),
        changedById: user.id,
        changedAt: now,
      }
    );

    // 10. 응답 (임시 암호 포함 - 일회 표시용)
    return NextResponse.json(
      {
        message: '계정이 생성되었습니다.',
        data: {
          account: {
            id: acc.ID,
            employeeId: acc.EMPLOYEE_ID,
            username: acc.USERNAME,
            role: acc.ROLE,
            isActive: acc.IS_ACTIVE === 1,
            createdAt: acc.CREATED_AT?.toISOString() || '',
          },
          temporaryPassword: password, // Phase 1: 일회 표시용
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST /api/employees/[id]/accounts error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
