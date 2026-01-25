// Generated: 2026-01-25 16:10:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';
import { Project } from '@/entities/Project';
import { Customer } from '@/entities/Customer';
import { Employee } from '@/entities/Employee';
import { IsNull } from 'typeorm';

export const dynamic = 'force-dynamic';

interface CreateProjectRequest {
  project_name: string;
  customer_id: number;
  employee_id: number;
  project_code?: string;
  start_date?: string;
  end_date?: string;
  contract_amount?: number;
  description?: string;
}

interface CreateProjectResponse {
  id: number;
}

interface ProjectListItem {
  id: number;
  project_code: string | null;
  project_name: string;
  customer_id: number;
  customer_name: string;
  employee_id: number;
  employee_name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  contract_amount: number | null;
  created_at: string;
}

interface ProjectListResponse {
  projects: ProjectListItem[];
  total: number;
  page: number;
  page_size: number;
}

const ALLOWED_SORT_BY = [
  'created_at',
  'project_name',
  'project_code',
  'status',
  'start_date',
  'end_date',
  'contract_amount',
] as const;

/**
 * GET /api/projects
 * 프로젝트 목록 조회 (페이지네이션, 필터링, 정렬, RBAC)
 */
export async function GET(request: NextRequest): Promise<NextResponse<ProjectListResponse | { error: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    let pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('page_size') || '20', 10)));
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = (searchParams.get('sort_order') || 'DESC').toUpperCase() as 'ASC' | 'DESC';
    const customerId = searchParams.get('customer_id') ? parseInt(searchParams.get('customer_id')!, 10) : undefined;
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employee_id') ? parseInt(searchParams.get('employee_id')!, 10) : undefined;
    const keyword = searchParams.get('keyword');

    // 유효성 검증
    if (!ALLOWED_SORT_BY.includes(sortBy as any)) {
      return NextResponse.json(
        { error: 'Invalid sort_by parameter' },
        { status: 400 }
      );
    }

    if (keyword && keyword.length < 2) {
      return NextResponse.json(
        { error: 'Keyword must be at least 2 characters' },
        { status: 400 }
      );
    }

    const ds = await getDataSource();
    const queryRunner = ds.createQueryRunner();

    try {
      const user = session.user as any;

      // 동적 WHERE 절 구성
      let whereClauses: string[] = ['"p"."deleted_at" IS NULL'];
      const params: any = {};
      let paramIndex = 0;

      // RBAC 조건 적용
      if (user.role === 'MANAGER') {
        whereClauses.push(`"e"."department_id" = :departmentId${paramIndex}`);
        params[`departmentId${paramIndex}`] = user.department;
        paramIndex++;
      } else if (user.role === 'USER') {
        whereClauses.push(`"p"."employee_id" = :userId${paramIndex}`);
        params[`userId${paramIndex}`] = user.id;
        paramIndex++;
      }
      // ADMIN은 모든 프로젝트 조회 가능

      // 필터 조건 적용
      if (customerId) {
        whereClauses.push(`"p"."customer_id" = :customerId${paramIndex}`);
        params[`customerId${paramIndex}`] = customerId;
        paramIndex++;
      }

      if (status) {
        whereClauses.push(`"p"."status" = :status${paramIndex}`);
        params[`status${paramIndex}`] = status;
        paramIndex++;
      }

      if (employeeId) {
        whereClauses.push(`"p"."employee_id" = :employeeId${paramIndex}`);
        params[`employeeId${paramIndex}`] = employeeId;
        paramIndex++;
      }

      // 키워드 검색
      if (keyword && keyword.length >= 2) {
        whereClauses.push(`("p"."project_name" LIKE :keyword${paramIndex} OR "p"."project_code" LIKE :keyword${paramIndex})`);
        params[`keyword${paramIndex}`] = `%${keyword}%`;
        paramIndex++;
      }

      // Raw SQL 쿼리
      const sql = `SELECT "p"."id", "p"."project_code", "p"."project_name", "p"."customer_id",
                          "c"."name" AS customer_name, "p"."employee_id", "e"."name" AS employee_name,
                          "p"."status", "p"."start_date", "p"."end_date", "p"."contract_amount", "p"."created_at"
                   FROM PROJECT "p"
                   LEFT JOIN CUSTOMER "c" ON "c"."id" = "p"."customer_id" AND "c"."deleted_at" IS NULL
                   LEFT JOIN EMPLOYEE "e" ON "e"."id" = "p"."employee_id" AND "e"."deleted_at" IS NULL
                   WHERE ${whereClauses.join(' AND ')}
                   ORDER BY "p"."${sortBy}" ${sortOrder}
                   OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`;

      const countSql = `SELECT COUNT(*) as total
                        FROM PROJECT "p"
                        LEFT JOIN EMPLOYEE "e" ON "e"."id" = "p"."employee_id"
                        WHERE ${whereClauses.join(' AND ')}`;

      // Separate params for count query (no offset/pageSize) and data query
      const countParams = { ...params };
      const dataParams = { ...params, offset: (page - 1) * pageSize, pageSize };

      const [results, countResult] = await Promise.all([
        queryRunner.query(sql, dataParams),
        queryRunner.query(countSql, countParams),
      ]);

      const total = parseInt(countResult[0]?.total || '0', 10);

      // 응답 형태 변환
      const projects: ProjectListItem[] = results.map((row: any) => {
        const formatDate = (date: any) => {
          if (!date) return null;
          if (typeof date === 'string') return date.split('T')[0];
          if (date instanceof Date) return date.toISOString().split('T')[0];
          return null;
        };

        const formatDateTime = (date: any) => {
          if (!date) return new Date().toISOString();
          if (typeof date === 'string') return date;
          if (date instanceof Date) return date.toISOString();
          return new Date().toISOString();
        };

        return {
          id: row.id,
          project_code: row.project_code,
          project_name: row.project_name,
          customer_id: row.customer_id,
          customer_name: row.customer_name,
          employee_id: row.employee_id,
          employee_name: row.employee_name,
          status: row.status,
          start_date: formatDate(row.start_date),
          end_date: formatDate(row.end_date),
          contract_amount: row.contract_amount,
          created_at: formatDateTime(row.created_at),
        };
      });

      return NextResponse.json({
        projects,
        total,
        page,
        page_size: pageSize,
      });
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('GET /api/projects error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * 신규 프로젝트 등록
 */
export async function POST(request: NextRequest): Promise<NextResponse<CreateProjectResponse | { error: string; details?: Record<string, string> }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateProjectRequest = await request.json();

    // ============================================================================
    // 1. 필수 필드 검증
    // ============================================================================
    const errors: Record<string, string> = {};

    if (!body.project_name || body.project_name.trim().length === 0) {
      errors.project_name = 'Project name is required';
    } else if (body.project_name.length > 200) {
      errors.project_name = 'Project name must not exceed 200 characters';
    }

    if (!body.customer_id) {
      errors.customer_id = 'Customer ID is required';
    }

    if (!body.employee_id) {
      errors.employee_id = 'Employee ID is required';
    }

    if (body.start_date && body.end_date && body.start_date > body.end_date) {
      errors.end_date = 'End date must be after start date';
    }

    if (body.contract_amount !== undefined && body.contract_amount < 0) {
      errors.contract_amount = 'Contract amount must be non-negative';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: 'Validation error', details: errors },
        { status: 400 }
      );
    }

    const ds = await getDataSource();

    // ============================================================================
    // 2. FK 존재 확인 (customer_id, employee_id)
    // ============================================================================
    const customerRepo = ds.getRepository(Customer);
    const employeeRepo = ds.getRepository(Employee);

    const [customer, employee] = await Promise.all([
      customerRepo.findOne({
        where: { id: body.customer_id, deleted_at: IsNull() },
      }),
      employeeRepo.findOne({
        where: { id: body.employee_id, deleted_at: IsNull() },
      }),
    ]);

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 400 }
      );
    }

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 400 }
      );
    }

    // ============================================================================
    // 3. project_code 중복 확인 (제공 시)
    // ============================================================================
    if (body.project_code) {
      const projectRepo = ds.getRepository(Project);
      const existingProject = await projectRepo.findOne({
        where: { project_code: body.project_code },
      });

      if (existingProject) {
        return NextResponse.json(
          { error: 'Project code already exists' },
          { status: 409 }
        );
      }
    }

    // ============================================================================
    // 4. PROJECT INSERT
    // ============================================================================
    const projectRepo = ds.getRepository(Project);
    const project = projectRepo.create({
      project_name: body.project_name.trim(),
      customer_id: body.customer_id,
      employee_id: body.employee_id,
      project_code: body.project_code || null,
      start_date: body.start_date ? new Date(body.start_date) : null,
      end_date: body.end_date ? new Date(body.end_date) : null,
      contract_amount: body.contract_amount || null,
      description: body.description || null,
      status: 'PREPARING', // 초기 상태
    });

    const result = await projectRepo.save(project);

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
