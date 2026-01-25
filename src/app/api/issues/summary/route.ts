// Generated: 2026-01-25 18:55:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getDataSource } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { Issue } from '@/entities/Issue';

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

    // 2. Parse query parameters (filters)
    const searchParams = req.nextUrl.searchParams;
    const customer_id = searchParams.get('customer_id')
      ? parseInt(searchParams.get('customer_id')!)
      : undefined;
    const severity = searchParams.get('severity')
      ? searchParams.get('severity')!.split(',')
      : undefined;

    // 3. Build WHERE clause (RLS + filters)
    let whereClause = 'WHERE i.deleted_at IS NULL';
    const params: Record<string, any> = {};
    let paramIndex = 1;

    if (userRole === 'ADMIN') {
      // ADMIN sees all
    } else if (userRole === 'MANAGER') {
      whereClause += ` AND i.assigned_to_id IS NOT NULL
        AND e_assigned.department_id = :userDepartmentId`;
      params.userDepartmentId = userDepartmentId;
    } else if (userRole === 'USER') {
      whereClause += ` AND (
        i.created_by_id = :userId
        OR i.assigned_to_id = :userId
        OR (i.is_public = 1 AND e_assigned.department_id = :userDepartmentId)
      )`;
      params.userId = userId;
      params.userDepartmentId = userDepartmentId;
    }

    // Apply filters
    if (customer_id) {
      whereClause += ` AND i.customer_id = ${customer_id}`;
    }

    if (severity && severity.length > 0) {
      const severityPlaceholders = severity
        .map((_, i) => `:severity_${i}`)
        .join(',');
      whereClause += ` AND i.severity IN (${severityPlaceholders})`;
      severity.forEach((s, i) => {
        params[`severity_${i}`] = s;
      });
    }

    // 4. Execute query (status counts)
    const dataSource = await getDataSource();

    const query = `
      SELECT
        i.status,
        COUNT(*) as count
      FROM ISSUE i
      LEFT JOIN EMPLOYEE e_assigned ON i.assigned_to_id = e_assigned.id
      ${whereClause}
      GROUP BY i.status
    `;

    const results = await dataSource.query(query, Object.values(params));

    // 5. Format results
    const statusCounts: Record<string, number> = {
      INTAKE: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
    };

    results.forEach((r: any) => {
      statusCounts[r.STATUS] = parseInt(r.COUNT);
    });

    const total = Object.values(statusCounts).reduce(
      (a: number, b: number) => a + b,
      0
    );

    // 6. Response
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
