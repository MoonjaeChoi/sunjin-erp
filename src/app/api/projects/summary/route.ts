// Generated: 2026-01-28 00:15:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery } from '@/lib/db-direct';

export const dynamic = 'force-dynamic';

interface ProjectSummaryResponse {
  preparing: number;
  in_progress: number;
  completed: number;
  on_hold: number;
}

/**
 * GET /api/projects/summary
 * 프로젝트 상태별 카운트 조회 (RBAC 및 필터링 적용)
 */
export async function GET(request: NextRequest): Promise<NextResponse<ProjectSummaryResponse | { error: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customer_id')
      ? parseInt(searchParams.get('customer_id')!, 10)
      : undefined;
    const employeeId = searchParams.get('employee_id')
      ? parseInt(searchParams.get('employee_id')!, 10)
      : undefined;

    const user = session.user as any;

    // Raw SQL to count projects by status
    let whereClauses: string[] = ['p."deleted_at" IS NULL'];
    const params: any = {};
    let paramIndex = 0;

    // RBAC 조건 적용 (EMPLOYEE 테이블은 UPPERCASE 컬럼 사용)
    if (user.role === 'MANAGER') {
      whereClauses.push(`E.DEPARTMENT_ID = :departmentId${paramIndex}`);
      params[`departmentId${paramIndex}`] = user.department;
      paramIndex++;
    } else if (user.role === 'USER') {
      whereClauses.push(`p."employee_id" = :userId${paramIndex}`);
      params[`userId${paramIndex}`] = user.id;
      paramIndex++;
    }
    // ADMIN: no additional filtering

    // 필터 조건 적용
    if (customerId) {
      whereClauses.push(`p."customer_id" = :customerId${paramIndex}`);
      params[`customerId${paramIndex}`] = customerId;
      paramIndex++;
    }

    if (employeeId) {
      whereClauses.push(`p."employee_id" = :employeeId${paramIndex}`);
      params[`employeeId${paramIndex}`] = employeeId;
      paramIndex++;
    }

    // EMPLOYEE 테이블은 UPPERCASE 컬럼 사용
    const sql = `
      SELECT
        COUNT(CASE WHEN p."status" = 'PREPARING' THEN 1 END) AS preparing,
        COUNT(CASE WHEN p."status" = 'IN_PROGRESS' THEN 1 END) AS in_progress,
        COUNT(CASE WHEN p."status" = 'COMPLETED' THEN 1 END) AS completed,
        COUNT(CASE WHEN p."status" = 'ON_HOLD' THEN 1 END) AS on_hold
      FROM "PROJECT" p
      LEFT JOIN EMPLOYEE E ON E.ID = p."employee_id"
      WHERE ${whereClauses.join(' AND ')}
    `;

    const result = await executeQuery(sql, params);

    return NextResponse.json({
      preparing: parseInt(result.rows[0]?.PREPARING || result.rows[0]?.preparing || '0', 10),
      in_progress: parseInt(result.rows[0]?.IN_PROGRESS || result.rows[0]?.in_progress || '0', 10),
      completed: parseInt(result.rows[0]?.COMPLETED || result.rows[0]?.completed || '0', 10),
      on_hold: parseInt(result.rows[0]?.ON_HOLD || result.rows[0]?.on_hold || '0', 10),
    });
  } catch (error) {
    console.error('GET /api/projects/summary error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
