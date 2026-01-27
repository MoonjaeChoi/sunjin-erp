// Generated: 2026-01-27 10:30:00 KST

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery } from '@/lib/db-direct';

export const dynamic = 'force-dynamic';

interface EmployeeListItem {
  id: number;
  name: string;
  department_name: string | null;
}

interface EmployeeListResponse {
  employees: EmployeeListItem[];
}

/**
 * GET /api/employees/list
 * 담당자 필터용 Employee 목록 API
 *
 * 인증: NextAuth session 필수
 * RBAC:
 * - ADMIN: 전체 직원
 * - MANAGER: 본인 부서 직원만
 * - USER: 전체 직원
 */
export async function GET(): Promise<NextResponse<EmployeeListResponse | { error: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;

    // RBAC 조건에 따른 Raw SQL 쿼리 작성
    // EMPLOYEE 테이블은 UPPERCASE 컬럼 사용 (2091 직원관리 모듈)
    let sql = `
      SELECT E.ID, E.NAME, D.NAME AS DEPARTMENT_NAME
      FROM EMPLOYEE E
      LEFT JOIN DEPARTMENT D ON D.ID = E.DEPARTMENT_ID
      WHERE E.DELETED_AT IS NULL
    `;
    const params: any = {};

    if (user.role === 'MANAGER' && user.department) {
      sql += ' AND E.DEPARTMENT_ID = :departmentId';
      params.departmentId = user.department;
    }
    // ADMIN과 USER는 전체 직원 목록 조회 가능

    sql += ' ORDER BY E.NAME ASC';

    // Raw SQL 쿼리 실행
    const result = await executeQuery(sql, params);

    // 응답 형태 변환 (Oracle은 대문자 컬럼명 반환)
    const employees: EmployeeListItem[] = result.rows.map((row: any) => ({
      id: row.ID || row.id,
      name: row.NAME || row.name,
      department_name: row.DEPARTMENT_NAME || row.department_name || null,
    }));

    return NextResponse.json({ employees });
  } catch (error) {
    console.error('GET /api/employees/list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
