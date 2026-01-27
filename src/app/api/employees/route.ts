// Generated: 2026-01-27 23:55:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeUpdate } from '@/lib/db-direct';
import type { EmployeeListItem, EmployeeListResponse, Pagination } from '@/types/employee';

export const dynamic = 'force-dynamic';

// ============================================================
// GET /api/employees - 직원 목록 조회 (페이지네이션, 필터링)
// ============================================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. 인증 검증
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const userRole = user.role;
    const userDepartmentId = user.department; // Note: auth.ts stores as 'department', not 'departmentId'

    // 2. RBAC 검증 (ADMIN 또는 MANAGER만)
    if (!['ADMIN', 'MANAGER'].includes(userRole)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // 3. 쿼리 파라미터 파싱
    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search')?.trim();
    const departmentId = searchParams.get('departmentId');
    const positionId = searchParams.get('positionId');
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') === 'DESC' ? 'DESC' : 'ASC';

    // 4. WHERE 절 구성
    const whereClauses: string[] = ['e.DELETED_AT IS NULL'];
    const params: Record<string, any> = {};

    // 4a. MANAGER 권한 제한 (Decision #1: 정확한 부서만)
    if (userRole === 'MANAGER') {
      whereClauses.push('e.DEPARTMENT_ID = :userDeptId');
      params.userDeptId = userDepartmentId;
    } else if (departmentId) {
      // ADMIN은 부서 필터 선택 가능
      whereClauses.push('e.DEPARTMENT_ID = :deptId');
      params.deptId = parseInt(departmentId, 10);
    }

    // 4b. 직급 필터
    if (positionId) {
      whereClauses.push('e.POSITION_ID = :posId');
      params.posId = parseInt(positionId, 10);
    }

    // 4c. 활성 상태 필터 (ADMIN만)
    if (isActive !== null && isActive !== undefined && userRole === 'ADMIN') {
      if (isActive === 'true') {
        whereClauses.push('(a.IS_ACTIVE = 1 OR a.IS_ACTIVE IS NULL)');
      } else if (isActive === 'false') {
        whereClauses.push('a.IS_ACTIVE = 0');
      }
    }

    // 4d. 검색 (이름 또는 이메일)
    if (search) {
      whereClauses.push('(LOWER(e.NAME) LIKE :search OR LOWER(e.EMAIL) LIKE :search)');
      params.search = `%${search.toLowerCase()}%`;
    }

    // 5. 정렬 설정
    let orderBy = 'e.NAME';
    if (sortBy === 'hiredAt') {
      orderBy = 'e.HIRED_AT';
    } else if (sortBy === 'department') {
      orderBy = 'd.NAME';
    }

    const whereClause = whereClauses.join(' AND ');

    // 6. 직원 목록 조회
    const listQuery = `
      SELECT
        e.ID,
        e.NAME,
        e.EMAIL,
        e.PHONE,
        e.DEPARTMENT_ID,
        d.NAME as DEPARTMENT_NAME,
        e.POSITION_ID,
        p.NAME as POSITION_NAME,
        p.LVL as POSITION_LEVEL,
        e.HIRED_AT,
        ${userRole === 'ADMIN' ? 'a.IS_ACTIVE' : 'NULL as IS_ACTIVE'}
      FROM EMPLOYEE e
      LEFT JOIN DEPARTMENT d ON e.DEPARTMENT_ID = d.ID
      LEFT JOIN POSITION p ON e.POSITION_ID = p.ID
      ${userRole === 'ADMIN' ? 'LEFT JOIN ACCOUNT a ON a.EMPLOYEE_ID = e.ID' : ''}
      WHERE ${whereClause}
      ORDER BY ${orderBy} ${sortOrder}
      OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY
    `;

    const countQuery = `
      SELECT COUNT(*) as TOTAL
      FROM EMPLOYEE e
      ${userRole === 'ADMIN' ? 'LEFT JOIN ACCOUNT a ON a.EMPLOYEE_ID = e.ID' : ''}
      WHERE ${whereClause}
    `;

    const offset = (page - 1) * limit;

    const [listResult, countResult] = await Promise.all([
      executeQuery<{
        ID: number;
        NAME: string;
        EMAIL: string;
        PHONE: string | null;
        DEPARTMENT_ID: number;
        DEPARTMENT_NAME: string;
        POSITION_ID: number;
        POSITION_NAME: string;
        POSITION_LEVEL: number;
        HIRED_AT: Date;
        IS_ACTIVE: number | null;
      }>(listQuery, { ...params, offset, pageSize: limit }),
      executeQuery<{ TOTAL: number }>(countQuery, params),
    ]);

    const employees: EmployeeListItem[] = (listResult.rows || []).map(row => ({
      id: row.ID,
      name: row.NAME,
      email: row.EMAIL,
      phone: row.PHONE || undefined,
      departmentId: row.DEPARTMENT_ID,
      departmentName: row.DEPARTMENT_NAME,
      positionId: row.POSITION_ID,
      positionName: row.POSITION_NAME,
      positionLevel: row.POSITION_LEVEL,
      hiredAt: row.HIRED_AT?.toISOString() || '',
      isActive: userRole === 'ADMIN' ? (row.IS_ACTIVE === 1 || row.IS_ACTIVE === null ? true : false) : undefined,
    }));

    const total = (countResult.rows || [])[0]?.TOTAL || 0;

    const pagination: Pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    const response: EmployeeListResponse = {
      data: employees,
      pagination,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('GET /api/employees error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/employees - 직원 생성
// ============================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. 인증/권한 검증
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // 2. 요청 본문 파싱
    let body: {
      name?: string;
      email?: string;
      phone?: string;
      jobTitle?: string;
      departmentId?: number;
      positionId?: number;
      managerId?: number;
      hiredAt?: string;
      birthday?: string;
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

    // 3. 필수 필드 검증
    const errors: Record<string, string> = {};

    if (!name || name.trim().length === 0) {
      errors.name = '이름은 필수입니다.';
    } else if (name.trim().length > 100) {
      errors.name = '이름은 100자 이내여야 합니다.';
    }

    if (!email || email.trim().length === 0) {
      errors.email = '이메일은 필수입니다.';
    } else if (!isValidEmail(email)) {
      errors.email = '유효한 이메일 형식이 아닙니다.';
    }

    if (phone && !isValidPhone(phone)) {
      errors.phone = '유효한 전화번호 형식이 아닙니다. (예: 010-1234-5678)';
    }

    if (!departmentId) {
      errors.departmentId = '부서는 필수입니다.';
    }

    if (!positionId) {
      errors.positionId = '직급은 필수입니다.';
    }

    if (!hiredAt) {
      errors.hiredAt = '입사일은 필수입니다.';
    } else {
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

    // 4. 이메일 중복 검증
    const existingEmail = await executeQuery(
      `SELECT ID FROM EMPLOYEE WHERE EMAIL = :email AND DELETED_AT IS NULL`,
      { email: email!.trim().toLowerCase() }
    );
    if ((existingEmail.rows || []).length > 0) {
      return NextResponse.json(
        { message: 'Validation failed', errors: { email: '이미 존재하는 이메일입니다.' } },
        { status: 400 }
      );
    }

    // 5. 부서 존재 확인
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

    // 6. 직급 존재 확인
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

    // 7. 매니저 존재 확인 (선택)
    if (managerId) {
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

    // 8. 직원 생성
    const now = new Date();
    await executeUpdate(
      `INSERT INTO EMPLOYEE (
        NAME, EMAIL, PHONE, JOB_TITLE,
        DEPARTMENT_ID, POSITION_ID, MANAGER_ID,
        HIRED_AT, BIRTHDAY,
        CREATED_AT, CREATED_BY_ID, UPDATED_AT, UPDATED_BY_ID
      ) VALUES (
        :name, :email, :phone, :jobTitle,
        :departmentId, :positionId, :managerId,
        :hiredAt, :birthday,
        :now, :createdById, :now, :updatedById
      )`,
      {
        name: name!.trim(),
        email: email!.trim().toLowerCase(),
        phone: phone?.trim() || null,
        jobTitle: jobTitle?.trim() || null,
        departmentId,
        positionId,
        managerId: managerId || null,
        hiredAt: new Date(hiredAt!),
        birthday: birthday ? new Date(birthday) : null,
        now,
        createdById: user.id,
        updatedById: user.id,
      }
    );

    // 9. 생성된 직원 조회
    const created = await executeQuery<{
      ID: number;
      NAME: string;
      EMAIL: string;
    }>(
      `SELECT ID, NAME, EMAIL
       FROM EMPLOYEE
       WHERE EMAIL = :email AND DELETED_AT IS NULL`,
      { email: email!.trim().toLowerCase() }
    );

    const emp = (created.rows || [])[0];

    // 10. 이력 기록
    await executeUpdate(
      `INSERT INTO EMPLOYEE_HISTORY (
        EMPLOYEE_ID, CHANGE_TYPE, CHANGED_FIELDS, CHANGED_BY_ID, CHANGED_AT
      ) VALUES (
        :employeeId, :changeType, :changedFields, :changedById, :changedAt
      )`,
      {
        employeeId: emp.ID,
        changeType: 'CREATE',
        changedFields: JSON.stringify({
          name: { before: null, after: name!.trim() },
          email: { before: null, after: email!.trim().toLowerCase() },
          departmentId: { before: null, after: departmentId },
          positionId: { before: null, after: positionId },
        }),
        changedById: user.id,
        changedAt: now,
      }
    );

    return NextResponse.json(
      {
        message: '직원이 등록되었습니다.',
        data: {
          id: emp.ID,
          name: emp.NAME,
          email: emp.EMAIL,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST /api/employees error:', error);
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
