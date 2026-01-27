// Generated: 2026-01-27 23:58:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeUpdate } from '@/lib/db-direct';

export const dynamic = 'force-dynamic';

// ============================================================
// GET /api/employees/[id] - 직원 상세 조회
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

    // 1. 인증 검증
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const userRole = user.role;
    const userDepartmentId = user.departmentId;

    // 2. RBAC 검증
    if (!['ADMIN', 'MANAGER'].includes(userRole)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // 3. 직원 상세 조회
    const result = await executeQuery<{
      ID: number;
      NAME: string;
      EMAIL: string;
      PHONE: string | null;
      JOB_TITLE: string | null;
      DEPARTMENT_ID: number;
      DEPARTMENT_NAME: string;
      DEPARTMENT_CODE: string;
      POSITION_ID: number;
      POSITION_NAME: string;
      POSITION_CODE: string;
      POSITION_LEVEL: number;
      MANAGER_ID: number | null;
      MANAGER_NAME: string | null;
      MANAGER_EMAIL: string | null;
      HIRED_AT: Date;
      BIRTHDAY: Date | null;
      CREATED_AT: Date;
      CREATED_BY_ID: number | null;
      CREATED_BY_NAME: string | null;
      UPDATED_AT: Date;
      UPDATED_BY_ID: number | null;
      UPDATED_BY_NAME: string | null;
    }>(
      `SELECT
        e.ID,
        e.NAME,
        e.EMAIL,
        e.PHONE,
        e.JOB_TITLE,
        e.DEPARTMENT_ID,
        d.NAME as DEPARTMENT_NAME,
        d.CODE as DEPARTMENT_CODE,
        e.POSITION_ID,
        p.NAME as POSITION_NAME,
        p.CODE as POSITION_CODE,
        p.LVL as POSITION_LEVEL,
        e.MANAGER_ID,
        m.NAME as MANAGER_NAME,
        m.EMAIL as MANAGER_EMAIL,
        e.HIRED_AT,
        e.BIRTHDAY,
        e.CREATED_AT,
        e.CREATED_BY_ID,
        cb.NAME as CREATED_BY_NAME,
        e.UPDATED_AT,
        e.UPDATED_BY_ID,
        ub.NAME as UPDATED_BY_NAME
       FROM EMPLOYEE e
       LEFT JOIN DEPARTMENT d ON e.DEPARTMENT_ID = d.ID
       LEFT JOIN POSITION p ON e.POSITION_ID = p.ID
       LEFT JOIN EMPLOYEE m ON e.MANAGER_ID = m.ID
       LEFT JOIN EMPLOYEE cb ON e.CREATED_BY_ID = cb.ID
       LEFT JOIN EMPLOYEE ub ON e.UPDATED_BY_ID = ub.ID
       WHERE e.ID = :id AND e.DELETED_AT IS NULL`,
      { id: employeeId }
    );

    const rows = result.rows || [];
    if (rows.length === 0) {
      return NextResponse.json({ message: '직원을 찾을 수 없습니다.' }, { status: 404 });
    }

    const emp = rows[0];

    // 4. MANAGER 권한 검증 (Decision #1: 정확한 부서만)
    if (userRole === 'MANAGER' && emp.DEPARTMENT_ID !== userDepartmentId) {
      return NextResponse.json({ message: '접근 권한이 없습니다.' }, { status: 403 });
    }

    // 5. 계정 정보 조회 (ADMIN만)
    let account = undefined;
    if (userRole === 'ADMIN') {
      const accountResult = await executeQuery<{
        ID: number;
        EMPLOYEE_ID: number;
        USERNAME: string;
        ROLE: string;
        IS_ACTIVE: number;
        LAST_LOGIN_AT: Date | null;
        PASSWORD_CHANGED_AT: Date | null;
        CREATED_AT: Date;
        UPDATED_AT: Date;
      }>(
        `SELECT
          ID,
          EMPLOYEE_ID,
          USERNAME,
          ROLE,
          IS_ACTIVE,
          LAST_LOGIN_AT,
          PASSWORD_CHANGED_AT,
          CREATED_AT,
          UPDATED_AT
         FROM ACCOUNT
         WHERE EMPLOYEE_ID = :employeeId AND DELETED_AT IS NULL`,
        { employeeId }
      );

      if ((accountResult.rows || []).length > 0) {
        const acc = accountResult.rows[0];
        account = {
          id: acc.ID,
          employeeId: acc.EMPLOYEE_ID,
          username: acc.USERNAME,
          role: acc.ROLE,
          isActive: acc.IS_ACTIVE === 1,
          lastLoginAt: acc.LAST_LOGIN_AT?.toISOString() || null,
          passwordChangedAt: acc.PASSWORD_CHANGED_AT?.toISOString() || null,
          createdAt: acc.CREATED_AT?.toISOString() || '',
          updatedAt: acc.UPDATED_AT?.toISOString() || '',
        };
      }
    }

    // 6. 응답 구성
    const response: any = {
      data: {
        id: emp.ID,
        name: emp.NAME,
        email: emp.EMAIL,
        phone: emp.PHONE || undefined,
        jobTitle: emp.JOB_TITLE || undefined,
        departmentId: emp.DEPARTMENT_ID,
        positionId: emp.POSITION_ID,
        managerId: emp.MANAGER_ID || undefined,
        hiredAt: emp.HIRED_AT?.toISOString() || '',
        birthday: emp.BIRTHDAY?.toISOString() || undefined,
        createdAt: emp.CREATED_AT?.toISOString() || '',
        updatedAt: emp.UPDATED_AT?.toISOString() || '',
        department: {
          id: emp.DEPARTMENT_ID,
          name: emp.DEPARTMENT_NAME,
          code: emp.DEPARTMENT_CODE,
        },
        position: {
          id: emp.POSITION_ID,
          name: emp.POSITION_NAME,
          code: emp.POSITION_CODE,
          level: emp.POSITION_LEVEL,
        },
        manager: emp.MANAGER_ID ? {
          id: emp.MANAGER_ID,
          name: emp.MANAGER_NAME,
          email: emp.MANAGER_EMAIL,
        } : undefined,
        createdBy: emp.CREATED_BY_ID ? {
          id: emp.CREATED_BY_ID,
          name: emp.CREATED_BY_NAME,
        } : undefined,
        updatedBy: emp.UPDATED_BY_ID ? {
          id: emp.UPDATED_BY_ID,
          name: emp.UPDATED_BY_NAME,
        } : undefined,
        account,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('GET /api/employees/[id] error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT /api/employees/[id] - 직원 정보 수정
// ============================================================

export async function PUT(
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

    // 2. 기존 직원 조회
    const existing = await executeQuery<{
      ID: number;
      NAME: string;
      EMAIL: string;
      PHONE: string | null;
      JOB_TITLE: string | null;
      DEPARTMENT_ID: number;
      POSITION_ID: number;
      MANAGER_ID: number | null;
      HIRED_AT: Date;
      BIRTHDAY: Date | null;
    }>(
      `SELECT ID, NAME, EMAIL, PHONE, JOB_TITLE, DEPARTMENT_ID, POSITION_ID,
              MANAGER_ID, HIRED_AT, BIRTHDAY
       FROM EMPLOYEE WHERE ID = :id AND DELETED_AT IS NULL`,
      { id: employeeId }
    );

    if ((existing.rows || []).length === 0) {
      return NextResponse.json({ message: '직원을 찾을 수 없습니다.' }, { status: 404 });
    }

    const oldData = existing.rows[0];

    // 3. 요청 본문 파싱
    let body: {
      name?: string;
      email?: string;
      phone?: string | null;
      jobTitle?: string | null;
      departmentId?: number;
      positionId?: number;
      managerId?: number | null;
      hiredAt?: string;
      birthday?: string | null;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const {
      name,
      email,
      phone,
      jobTitle,
      departmentId,
      positionId,
      managerId,
      hiredAt,
      birthday,
    } = body;

    // 4. 유효성 검증
    const errors: Record<string, string> = {};

    if (name !== undefined && name.trim().length === 0) {
      errors.name = '이름은 필수입니다.';
    }

    if (email !== undefined) {
      if (!isValidEmail(email)) {
        errors.email = '유효한 이메일 형식이 아닙니다.';
      } else {
        // 이메일 중복 검증 (자기 제외)
        const existingEmail = await executeQuery(
          `SELECT ID FROM EMPLOYEE WHERE EMAIL = :email AND ID != :id AND DELETED_AT IS NULL`,
          { email: email.trim().toLowerCase(), id: employeeId }
        );
        if ((existingEmail.rows || []).length > 0) {
          errors.email = '이미 존재하는 이메일입니다.';
        }
      }
    }

    if (phone !== undefined && phone && !isValidPhone(phone)) {
      errors.phone = '유효한 전화번호 형식이 아닙니다.';
    }

    if (hiredAt !== undefined) {
      const hiredDate = new Date(hiredAt);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (hiredDate > today) {
        errors.hiredAt = '입사일은 미래 날짜일 수 없습니다.';
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
    }

    // 5. 부서/직급/매니저 존재 검증
    if (departmentId !== undefined) {
      const deptExists = await executeQuery(
        `SELECT ID FROM DEPARTMENT WHERE ID = :id AND DELETED_AT IS NULL`,
        { id: departmentId }
      );
      if ((deptExists.rows || []).length === 0) {
        return NextResponse.json(
          { message: 'Validation failed', errors: { departmentId: '존재하지 않는 부서입니다.' } },
          { status: 400 }
        );
      }
    }

    if (positionId !== undefined) {
      const posExists = await executeQuery(
        `SELECT ID FROM POSITION WHERE ID = :id AND DELETED_AT IS NULL`,
        { id: positionId }
      );
      if ((posExists.rows || []).length === 0) {
        return NextResponse.json(
          { message: 'Validation failed', errors: { positionId: '존재하지 않는 직급입니다.' } },
          { status: 400 }
        );
      }
    }

    if (managerId !== undefined && managerId !== null) {
      if (managerId === employeeId) {
        return NextResponse.json(
          { message: 'Validation failed', errors: { managerId: '자기 자신을 매니저로 설정할 수 없습니다.' } },
          { status: 400 }
        );
      }
      const mgrExists = await executeQuery(
        `SELECT ID FROM EMPLOYEE WHERE ID = :id AND DELETED_AT IS NULL`,
        { id: managerId }
      );
      if ((mgrExists.rows || []).length === 0) {
        return NextResponse.json(
          { message: 'Validation failed', errors: { managerId: '존재하지 않는 매니저입니다.' } },
          { status: 400 }
        );
      }
    }

    // 6. 업데이트 쿼리 구성
    const updates: string[] = [];
    const updateParams: Record<string, any> = { id: employeeId, now: new Date(), updatedById: user.id };
    const changedFields: Record<string, { before: any; after: any }> = {};

    if (name !== undefined) {
      updates.push('NAME = :name');
      updateParams.name = name.trim();
      if (oldData.NAME !== name.trim()) {
        changedFields.name = { before: oldData.NAME, after: name.trim() };
      }
    }
    if (email !== undefined) {
      updates.push('EMAIL = :email');
      updateParams.email = email.trim().toLowerCase();
      if (oldData.EMAIL !== email.trim().toLowerCase()) {
        changedFields.email = { before: oldData.EMAIL, after: email.trim().toLowerCase() };
      }
    }
    if (phone !== undefined) {
      updates.push('PHONE = :phone');
      updateParams.phone = phone?.trim() || null;
      if (oldData.PHONE !== (phone?.trim() || null)) {
        changedFields.phone = { before: oldData.PHONE, after: phone?.trim() || null };
      }
    }
    if (jobTitle !== undefined) {
      updates.push('JOB_TITLE = :jobTitle');
      updateParams.jobTitle = jobTitle?.trim() || null;
      if (oldData.JOB_TITLE !== (jobTitle?.trim() || null)) {
        changedFields.jobTitle = { before: oldData.JOB_TITLE, after: jobTitle?.trim() || null };
      }
    }
    if (departmentId !== undefined) {
      updates.push('DEPARTMENT_ID = :departmentId');
      updateParams.departmentId = departmentId;
      if (oldData.DEPARTMENT_ID !== departmentId) {
        changedFields.departmentId = { before: oldData.DEPARTMENT_ID, after: departmentId };
      }
    }
    if (positionId !== undefined) {
      updates.push('POSITION_ID = :positionId');
      updateParams.positionId = positionId;
      if (oldData.POSITION_ID !== positionId) {
        changedFields.positionId = { before: oldData.POSITION_ID, after: positionId };
      }
    }
    if (managerId !== undefined) {
      updates.push('MANAGER_ID = :managerId');
      updateParams.managerId = managerId || null;
      if (oldData.MANAGER_ID !== (managerId || null)) {
        changedFields.managerId = { before: oldData.MANAGER_ID, after: managerId || null };
      }
    }
    if (hiredAt !== undefined) {
      updates.push('HIRED_AT = :hiredAt');
      updateParams.hiredAt = new Date(hiredAt);
    }
    if (birthday !== undefined) {
      updates.push('BIRTHDAY = :birthday');
      updateParams.birthday = birthday ? new Date(birthday) : null;
    }

    updates.push('UPDATED_AT = :now');
    updates.push('UPDATED_BY_ID = :updatedById');

    await executeUpdate(
      `UPDATE EMPLOYEE SET ${updates.join(', ')} WHERE ID = :id`,
      updateParams
    );

    // 7. 이력 기록
    if (Object.keys(changedFields).length > 0) {
      await executeUpdate(
        `INSERT INTO EMPLOYEE_HISTORY (
          EMPLOYEE_ID, CHANGE_TYPE, CHANGED_FIELDS, CHANGED_BY_ID, CHANGED_AT
        ) VALUES (
          :employeeId, :changeType, :changedFields, :changedById, :changedAt
        )`,
        {
          employeeId,
          changeType: 'UPDATE',
          changedFields: JSON.stringify(changedFields),
          changedById: user.id,
          changedAt: new Date(),
        }
      );
    }

    return NextResponse.json({
      message: '직원 정보가 수정되었습니다.',
    });

  } catch (error) {
    console.error('PUT /api/employees/[id] error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE /api/employees/[id] - 직원 삭제 (Hard Delete)
// ============================================================

export async function DELETE(
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
    const existing = await executeQuery<{ ID: number; NAME: string }>(
      `SELECT ID, NAME FROM EMPLOYEE WHERE ID = :id AND DELETED_AT IS NULL`,
      { id: employeeId }
    );

    if ((existing.rows || []).length === 0) {
      return NextResponse.json({ message: '직원을 찾을 수 없습니다.' }, { status: 404 });
    }

    const empName = existing.rows[0].NAME;

    // 3. 의존성 검증 (Decision #6: 모든 FK 참조 검증)
    const dependencies: { type: string; count: number; details?: string }[] = [];

    // 3a. 프로젝트 담당자
    const projectCount = await executeQuery<{ CNT: number }>(
      `SELECT COUNT(*) as CNT FROM PROJECT WHERE ASSIGNED_EMPLOYEE_ID = :id AND DELETED_AT IS NULL`,
      { id: employeeId }
    );
    if ((projectCount.rows?.[0]?.CNT || 0) > 0) {
      dependencies.push({
        type: '프로젝트',
        count: projectCount.rows[0].CNT,
        details: '이 직원이 담당자로 지정된 프로젝트가 있습니다.',
      });
    }

    // 3b. 기술지원 담당자
    const techSupportCount = await executeQuery<{ CNT: number }>(
      `SELECT COUNT(*) as CNT FROM TECH_SUPPORT WHERE ASSIGNED_EMPLOYEE_ID = :id AND DELETED_AT IS NULL`,
      { id: employeeId }
    );
    if ((techSupportCount.rows?.[0]?.CNT || 0) > 0) {
      dependencies.push({
        type: '기술지원',
        count: techSupportCount.rows[0].CNT,
        details: '이 직원이 담당자로 지정된 기술지원 건이 있습니다.',
      });
    }

    // 3c. 업무(Task) 담당자
    const taskCount = await executeQuery<{ CNT: number }>(
      `SELECT COUNT(*) as CNT FROM TASK WHERE ASSIGNED_EMPLOYEE_ID = :id AND DELETED_AT IS NULL`,
      { id: employeeId }
    );
    if ((taskCount.rows?.[0]?.CNT || 0) > 0) {
      dependencies.push({
        type: '업무',
        count: taskCount.rows[0].CNT,
        details: '이 직원에게 할당된 업무가 있습니다.',
      });
    }

    // 3d. 이슈 담당자
    const issueCount = await executeQuery<{ CNT: number }>(
      `SELECT COUNT(*) as CNT FROM ISSUE WHERE ASSIGNED_EMPLOYEE_ID = :id AND DELETED_AT IS NULL`,
      { id: employeeId }
    );
    if ((issueCount.rows?.[0]?.CNT || 0) > 0) {
      dependencies.push({
        type: '이슈',
        count: issueCount.rows[0].CNT,
        details: '이 직원에게 할당된 이슈가 있습니다.',
      });
    }

    // 3e. 계정 존재
    const accountCount = await executeQuery<{ CNT: number }>(
      `SELECT COUNT(*) as CNT FROM ACCOUNT WHERE EMPLOYEE_ID = :id AND DELETED_AT IS NULL`,
      { id: employeeId }
    );
    if ((accountCount.rows?.[0]?.CNT || 0) > 0) {
      dependencies.push({
        type: '계정',
        count: accountCount.rows[0].CNT,
        details: '이 직원의 계정이 존재합니다. 먼저 계정을 삭제하세요.',
      });
    }

    // 3f. 하위 직원 (매니저로 참조)
    const subordinateCount = await executeQuery<{ CNT: number }>(
      `SELECT COUNT(*) as CNT FROM EMPLOYEE WHERE MANAGER_ID = :id AND DELETED_AT IS NULL`,
      { id: employeeId }
    );
    if ((subordinateCount.rows?.[0]?.CNT || 0) > 0) {
      dependencies.push({
        type: '하위 직원',
        count: subordinateCount.rows[0].CNT,
        details: '이 직원을 매니저로 둔 직원이 있습니다.',
      });
    }

    // 3g. 생성자/수정자로 참조 (ON DELETE RESTRICT - Decision #3)
    const createdByCount = await executeQuery<{ CNT: number }>(
      `SELECT COUNT(*) as CNT FROM EMPLOYEE WHERE CREATED_BY_ID = :id AND ID != :id`,
      { id: employeeId }
    );
    if ((createdByCount.rows?.[0]?.CNT || 0) > 0) {
      dependencies.push({
        type: '생성자 참조',
        count: createdByCount.rows[0].CNT,
        details: '이 직원이 생성자로 기록된 직원이 있습니다.',
      });
    }

    // 3h. 이력 변경자로 참조
    const historyCount = await executeQuery<{ CNT: number }>(
      `SELECT COUNT(*) as CNT FROM EMPLOYEE_HISTORY WHERE CHANGED_BY_ID = :id`,
      { id: employeeId }
    );
    if ((historyCount.rows?.[0]?.CNT || 0) > 0) {
      dependencies.push({
        type: '이력 변경자',
        count: historyCount.rows[0].CNT,
        details: '이 직원이 변경자로 기록된 이력이 있습니다.',
      });
    }

    // 4. 의존성이 있으면 삭제 거부
    if (dependencies.length > 0) {
      const totalDeps = dependencies.reduce((sum, d) => sum + d.count, 0);
      const depDetails = dependencies.map(d => `${d.type}: ${d.count}건`).join(', ');

      return NextResponse.json(
        {
          message: `이 직원은 ${totalDeps}건의 참조가 있어 삭제할 수 없습니다. (${depDetails})`,
          dependencies,
        },
        { status: 400 }
      );
    }

    // 5. 직원 이력 삭제 (해당 직원 본인의 이력)
    await executeUpdate(
      `DELETE FROM EMPLOYEE_HISTORY WHERE EMPLOYEE_ID = :id`,
      { id: employeeId }
    );

    // 6. Hard delete 실행
    await executeUpdate(
      `DELETE FROM EMPLOYEE WHERE ID = :id`,
      { id: employeeId }
    );

    return NextResponse.json({
      message: `'${empName}' 직원이 완전히 삭제되었습니다.`,
    });

  } catch (error) {
    console.error('DELETE /api/employees/[id] error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// Helper Functions
// ============================================================

// 이메일 유효성 검증 헬퍼
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 전화번호 유효성 검증 헬퍼 (한국 표준)
function isValidPhone(phone: string): boolean {
  // 02-xxxx-xxxx, 0xx-xxx-xxxx, 0xx-xxxx-xxxx, 010-xxxx-xxxx
  const phoneRegex = /^(02|0[3-9]\d)-?\d{3,4}-?\d{4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}
