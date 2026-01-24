// Generated: 2026-01-24 23:30:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { IsNull } from 'typeorm';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';
import { Task } from '@/entities/Task';

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
    const ds = await getDataSource();
    const taskRepository = ds.getRepository(Task);

    const user = session.user as any;
    const whereCondition: any = {
      task_date: new Date(date),
      deleted_at: IsNull(),
    };

    // RBAC 필터링
    if (user.role === 'USER') {
      whereCondition.employee_id = user.id;
    } else if (user.role === 'MANAGER') {
      // Phase 1 완료 후: 부서 내 직원 필터링
      whereCondition.employee_id = user.id;
    }
    // ADMIN: 전체 조회

    const tasks = await taskRepository.find({
      where: whereCondition,
      order: { start_time: 'ASC' },
    });

    // 4. 응답 구성
    return NextResponse.json({
      date,
      tasks: tasks.map((task) => ({
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
  } catch (error) {
    console.error('GET /api/dashboard/daily-summary error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
