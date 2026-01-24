// Generated: 2026-01-24 23:30:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';
import { Task } from '@/entities/Task';
import { TaskType, TaskStatus } from '@/types/task';

export async function GET(request: NextRequest) {
  // 1. 인증 체크
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Query params 추출
  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const employeeId = searchParams.get('employee_id');
  const type = searchParams.get('type');
  const status = searchParams.get('status');

  // 3. 필수 파라미터 검증
  if (!dateFrom || !dateTo) {
    return NextResponse.json(
      { error: 'date_from and date_to are required' },
      { status: 400 }
    );
  }

  // 날짜 형식 검증
  const dateFromParsed = new Date(dateFrom);
  const dateToParsed = new Date(dateTo);
  if (isNaN(dateFromParsed.getTime()) || isNaN(dateToParsed.getTime())) {
    return NextResponse.json(
      { error: 'Invalid date format. Use ISO date string.' },
      { status: 400 }
    );
  }

  // type enum 검증
  if (type && !Object.values(TaskType).includes(type as TaskType)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${Object.values(TaskType).join(', ')}` },
      { status: 400 }
    );
  }

  // status enum 검증
  if (status && !Object.values(TaskStatus).includes(status as TaskStatus)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${Object.values(TaskStatus).join(', ')}` },
      { status: 400 }
    );
  }

  try {
    // 4. DB 연결 및 쿼리 빌드
    const ds = await getDataSource();
    const taskRepository = ds.getRepository(Task);

    const queryBuilder = taskRepository
      .createQueryBuilder('task')
      .where('task.deleted_at IS NULL')
      .andWhere('task.task_date BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      });

    // 5. RBAC 필터링
    const user = session.user as any;
    if (user.role === 'USER') {
      queryBuilder.andWhere('task.employee_id = :userId', {
        userId: user.id,
      });
    } else if (user.role === 'MANAGER') {
      // Phase 1 완료 후: 부서 내 직원 ID 목록으로 필터링
      // 현재는 본인 업무만 반환
      queryBuilder.andWhere('task.employee_id = :userId', {
        userId: user.id,
      });
    }
    // ADMIN: 전체 조회 (추가 필터 없음)

    // 6. 선택 필터
    if (employeeId) {
      queryBuilder.andWhere('task.employee_id = :employeeId', {
        employeeId: Number(employeeId),
      });
    }
    if (type) {
      queryBuilder.andWhere('task.task_type = :type', { type });
    }
    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    // 7. 정렬
    queryBuilder
      .orderBy('task.task_date', 'ASC')
      .addOrderBy('task.start_time', 'ASC');

    // 8. 실행
    const [tasks, total] = await queryBuilder.getManyAndCount();

    return NextResponse.json({ tasks, total });
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
