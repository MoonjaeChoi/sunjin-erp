// Generated: 2026-01-27 23:56:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { executeQuery } from '@/lib/db-direct';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Session validation
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const userDepartmentId = (session.user as any).department;

    // 2. Parse query parameters (filters - same as list API)
    const searchParams = req.nextUrl.searchParams;
    const customer_id = searchParams.get('customer_id')
      ? parseInt(searchParams.get('customer_id')!, 10)
      : undefined;
    const status = searchParams.get('status')
      ? searchParams.get('status')!.split(',')
      : undefined;
    const severity = searchParams.get('severity')
      ? searchParams.get('severity')!.split(',')
      : undefined;
    const assignee_id = searchParams.get('assignee_id')
      ? parseInt(searchParams.get('assignee_id')!, 10)
      : undefined;
    const created_by_id = searchParams.get('created_by_id')
      ? parseInt(searchParams.get('created_by_id')!, 10)
      : undefined;
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const keyword = searchParams.get('keyword');

    // 3. Build WHERE clause (RLS + filters)
    const whereClauses: string[] = ['i.DELETED_AT IS NULL'];
    const params: any = {};
    let paramIndex = 0;

    // EMPLOYEE 테이블은 UPPERCASE 컬럼 사용
    if (userRole === 'ADMIN') {
      // ADMIN: all issues
    } else if (userRole === 'MANAGER') {
      // MANAGER: same department assignee issues
      whereClauses.push(
        `i.ASSIGNED_TO_ID IS NOT NULL AND E_ASSIGNED.DEPARTMENT_ID = :departmentId${paramIndex}`
      );
      params[`departmentId${paramIndex}`] = userDepartmentId;
      paramIndex++;
    } else if (userRole === 'USER') {
      // USER: created by me + assigned to me + same dept public
      whereClauses.push(
        `(i.CREATED_BY_ID = :userId${paramIndex}
         OR i.ASSIGNED_TO_ID = :userId${paramIndex + 1}
         OR (i.IS_PUBLIC = 1 AND E_ASSIGNED.DEPARTMENT_ID = :departmentId${paramIndex + 2}))`
      );
      params[`userId${paramIndex}`] = userId;
      params[`userId${paramIndex + 1}`] = userId;
      params[`departmentId${paramIndex + 2}`] = userDepartmentId;
      paramIndex += 3;
    }

    // 4. Apply filters (AND combination)
    if (customer_id) {
      whereClauses.push(`i.CUSTOMER_ID = :customerId${paramIndex}`);
      params[`customerId${paramIndex}`] = customer_id;
      paramIndex++;
    }

    if (status && status.length > 0) {
      const statusPlaceholders = status
        .map((_, i) => `:status${paramIndex + i}`)
        .join(',');
      whereClauses.push(`i.STATUS IN (${statusPlaceholders})`);
      status.forEach((s, i) => {
        params[`status${paramIndex + i}`] = s;
      });
      paramIndex += status.length;
    }

    if (severity && severity.length > 0) {
      const severityPlaceholders = severity
        .map((_, i) => `:severity${paramIndex + i}`)
        .join(',');
      whereClauses.push(`i.SEVERITY IN (${severityPlaceholders})`);
      severity.forEach((s, i) => {
        params[`severity${paramIndex + i}`] = s;
      });
      paramIndex += severity.length;
    }

    if (assignee_id) {
      whereClauses.push(`i.ASSIGNED_TO_ID = :assigneeId${paramIndex}`);
      params[`assigneeId${paramIndex}`] = assignee_id;
      paramIndex++;
    }

    if (created_by_id) {
      whereClauses.push(`i.CREATED_BY_ID = :createdById${paramIndex}`);
      params[`createdById${paramIndex}`] = created_by_id;
      paramIndex++;
    }

    if (date_from) {
      whereClauses.push(
        `TRUNC(i.CREATED_AT) >= TRUNC(TO_DATE(:dateFrom${paramIndex}, 'YYYY-MM-DD'))`
      );
      params[`dateFrom${paramIndex}`] = date_from;
      paramIndex++;
    }

    if (date_to) {
      whereClauses.push(
        `TRUNC(i.CREATED_AT) <= TRUNC(TO_DATE(:dateTo${paramIndex}, 'YYYY-MM-DD'))`
      );
      params[`dateTo${paramIndex}`] = date_to;
      paramIndex++;
    }

    if (keyword) {
      whereClauses.push(
        `(LOWER(i.TITLE) LIKE LOWER(:keyword${paramIndex})
         OR LOWER(DBMS_LOB.SUBSTR(i.DESCRIPTION, 4000, 1)) LIKE LOWER(:keyword${paramIndex}))`
      );
      params[`keyword${paramIndex}`] = `%${keyword}%`;
      paramIndex++;
    }

    // 5. Execute count query per status (EMPLOYEE 테이블은 UPPERCASE 컬럼 사용)
    const query = `
      SELECT
        i.STATUS,
        COUNT(*) as count
      FROM ISSUE i
      LEFT JOIN EMPLOYEE E_ASSIGNED ON i.ASSIGNED_TO_ID = E_ASSIGNED.ID
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY i.STATUS
    `;

    const results = await executeQuery(query, params);

    // 6. Format results
    const statusCounts: Record<string, number> = {
      INTAKE: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
    };

    results.rows.forEach((r: any) => {
      const resultStatus = r.STATUS || r.status;
      if (resultStatus in statusCounts) {
        statusCounts[resultStatus] = parseInt(r.COUNT || r.count, 10);
      }
    });

    const total = Object.values(statusCounts).reduce(
      (a: number, b: number) => a + b,
      0
    );

    // 7. Response
    return NextResponse.json({
      data: {
        total,
        intake: statusCounts.INTAKE,
        in_progress: statusCounts.IN_PROGRESS,
        completed: statusCounts.COMPLETED,
      },
    });
  } catch (error) {
    console.error('GET /api/issues/summary error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
