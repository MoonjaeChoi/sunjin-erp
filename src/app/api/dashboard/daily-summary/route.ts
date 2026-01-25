// Generated: 2026-01-24 23:30:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';

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
    // 3. Task 조회 (raw SQL to avoid ORM metadata issues)
    const ds = await getDataSource();
    const user = session.user as any;

    // Build SQL query with RBAC filtering
    let sql = `
      SELECT "id", "title", "task_type", "work_type", "status", "start_time", "end_time", "employee_id"
      FROM TASK
      WHERE TRUNC("task_date") = TO_DATE(:date, 'YYYY-MM-DD')
        AND "deleted_at" IS NULL
    `;
    const params: any = { date };

    // RBAC filtering
    if (user.role === 'USER' || user.role === 'MANAGER') {
      sql += ` AND "employee_id" = :employee_id`;
      params.employee_id = user.id;
    }
    // ADMIN: no additional filtering

    sql += ` ORDER BY "start_time" ASC`;

    const queryRunner = ds.createQueryRunner();
    try {
      const tasks = await queryRunner.query(sql, params);

      // 4. 응답 구성
      return NextResponse.json({
        date,
        tasks: tasks.map((task: any) => ({
          id: task.id,
          title: task.title,
          task_type: task.task_type,
          work_type: task.work_type,
          status: task.status,
          start_time: task.start_time,
          end_time: task.end_time,
          customer_name: null, // Phase 1 완료 후 JOIN
        })),
        techSupports: [], // Phase 3 전까지 빈 배열
      });
    } finally {
      await queryRunner.release();
    }
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
