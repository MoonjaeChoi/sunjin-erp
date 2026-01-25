// Generated: 2026-01-25 16:10:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';
import { Project } from '@/entities/Project';

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

    const ds = await getDataSource();
    const user = session.user as any;

    // QueryBuilder를 사용하여 상태별 카운트 조회
    let query = ds
      .getRepository(Project)
      .createQueryBuilder('p')
      .leftJoin('EMPLOYEE', 'e', 'e.id = p.employee_id')
      .where('p.deleted_at IS NULL')
      .select([
        `COUNT(CASE WHEN p.status = 'PREPARING' THEN 1 END) AS preparing`,
        `COUNT(CASE WHEN p.status = 'IN_PROGRESS' THEN 1 END) AS in_progress`,
        `COUNT(CASE WHEN p.status = 'COMPLETED' THEN 1 END) AS completed`,
        `COUNT(CASE WHEN p.status = 'ON_HOLD' THEN 1 END) AS on_hold`,
      ]);

    // RBAC 조건 적용
    if (user.role === 'MANAGER') {
      query = query.andWhere('e.department_id = :departmentId', {
        departmentId: user.department_id,
      });
    } else if (user.role === 'USER') {
      query = query.andWhere('p.employee_id = :userId', {
        userId: user.id,
      });
    }
    // ADMIN은 모든 프로젝트 조회 가능

    // 필터 조건 적용
    if (customerId) {
      query = query.andWhere('p.customer_id = :customerId', { customerId });
    }

    if (employeeId) {
      query = query.andWhere('p.employee_id = :employeeId', { employeeId });
    }

    const result = await query.getRawOne<any>();

    return NextResponse.json({
      preparing: parseInt(result?.preparing || '0', 10),
      in_progress: parseInt(result?.in_progress || '0', 10),
      completed: parseInt(result?.completed || '0', 10),
      on_hold: parseInt(result?.on_hold || '0', 10),
    });
  } catch (error) {
    console.error('GET /api/projects/summary error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
