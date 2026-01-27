// Generated: 2026-01-27 10:30:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery } from '@/lib/db-direct';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 1. 인증 체크
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. MANAGER 이상만 접근 가능
  const user = session.user as any;
  if (user.role === 'USER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. 필수 파라미터 검증
  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const employeeId = searchParams.get('employee_id');

  if (!dateFrom || !dateTo) {
    return NextResponse.json(
      { error: 'date_from and date_to are required' },
      { status: 400 }
    );
  }

  if (isNaN(Date.parse(dateFrom)) || isNaN(Date.parse(dateTo))) {
    return NextResponse.json(
      { error: 'Invalid date format. Use ISO date string.' },
      { status: 400 }
    );
  }

  try {
    // 4. 쿼리 구성 - raw SQL (IDX_TASK_EMPLOYEE_DATE 인덱스 활용)
    // Build SQL query
    let sql = `
      SELECT id, title, task_date, start_time, end_time, task_type, work_type, status, employee_id
      FROM TASK
      WHERE deleted_at IS NULL
        AND task_date BETWEEN TO_DATE(:dateFrom, 'YYYY-MM-DD') AND TO_DATE(:dateTo, 'YYYY-MM-DD')
    `;
    const params: any = { dateFrom, dateTo };

    // Optional employee filter
    if (employeeId) {
      sql += ` AND employee_id = :employeeId`;
      params.employeeId = Number(employeeId);
    }

    sql += ` ORDER BY employee_id ASC, task_date ASC, start_time ASC`;

    const result = await executeQuery(sql, params);

    // 5. 직원별 그룹화
    const employeeMap = new Map<
      number,
      { employee_id: number; employee_name: string; tasks: any[] }
    >();

    for (const task of result.rows) {
      if (!employeeMap.has(task.employee_id)) {
        employeeMap.set(task.employee_id, {
          employee_id: task.employee_id,
          employee_name: '', // Phase 1 완료 후 Employee JOIN
          tasks: [],
        });
      }
      employeeMap.get(task.employee_id)!.tasks.push({
        id: task.id,
        title: task.title,
        task_date: task.task_date,
        start_time: task.start_time,
        end_time: task.end_time,
        task_type: task.task_type,
        work_type: task.work_type,
        status: task.status,
      });
    }

    return NextResponse.json({
      employees: Array.from(employeeMap.values()),
    });
  } catch (error) {
    console.error('GET /api/dashboard/team error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
