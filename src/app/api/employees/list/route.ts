// Generated: 2026-01-25 16:05:00 KST

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';
import { Employee } from '@/entities/Employee';
import { IsNull } from 'typeorm';

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

    const ds = await getDataSource();
    const user = session.user as any;

    // QueryBuilder를 사용하여 DEPARTMENT와 LEFT JOIN
    let query = ds
      .getRepository(Employee)
      .createQueryBuilder('e')
      .leftJoin(
        'DEPARTMENT',
        'd',
        '"d"."id" = "e"."department_id"'
      )
      .where('"e"."deleted_at" IS NULL')
      .select([
        '"e"."id" AS id',
        '"e"."name" AS name',
        'COALESCE("d"."name", NULL) AS department_name',
      ])
      .orderBy('"e"."name"', 'ASC');

    // RBAC: MANAGER는 본인 부서만
    if (user.role === 'MANAGER' && user.department_id) {
      query = query.andWhere('e.department_id = :departmentId', {
        departmentId: user.department_id,
      });
    }
    // ADMIN과 USER는 전체 직원 목록 조회 가능

    const results = await query.getRawMany<any>();

    // 응답 형태 변환
    const employees: EmployeeListItem[] = results.map((row) => ({
      id: row.id,
      name: row.name,
      department_name: row.department_name,
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
