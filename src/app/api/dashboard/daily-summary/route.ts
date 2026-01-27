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

  // 2. date 파라미터 검증
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date || isNaN(Date.parse(date))) {
    return NextResponse.json(
      { error: 'valid date param is required' },
      { status: 400 }
    );
  }

  try {
    // 3. Task 조회
    const user = session.user as any;

    // Build SQL query with RBAC filtering
    let sql = `
      SELECT ID, TITLE, TASK_TYPE, WORK_TYPE, STATUS, START_TIME, END_TIME, EMPLOYEE_ID
      FROM TASK
      WHERE TRUNC(TASK_DATE) = TO_DATE(:dateParam, 'YYYY-MM-DD')
        AND DELETED_AT IS NULL
    `;
    const params: any = { dateParam: date };

    // RBAC filtering
    if (user.role === 'USER' || user.role === 'MANAGER') {
      sql += ` AND employee_id = :userId`;
      params.userId = user.id;
    }
    // ADMIN: no additional filtering

    sql += ` ORDER BY start_time ASC`;

    const result = await executeQuery(sql, params);

    // 4. 응답 구성
    return NextResponse.json({
      date,
      tasks: result.rows.map((task: any) => ({
        id: task.ID,
        title: task.TITLE,
        task_type: task.TASK_TYPE,
        work_type: task.WORK_TYPE,
        status: task.STATUS,
        start_time: task.START_TIME,
        end_time: task.END_TIME,
        customer_name: null, // Phase 1 완료 후 JOIN
      })),
      techSupports: [], // Phase 3 전까지 빈 배열
    });
  } catch (error) {
    console.error('GET /api/dashboard/daily-summary error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
