// Generated: 2026-01-25 16:10:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';
import { Project } from '@/entities/Project';
import { Customer } from '@/entities/Customer';
import { Employee } from '@/entities/Employee';
import { IsNull } from 'typeorm';

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
    const user = session.user as any;

    // QueryBuilder를 사용하여 복잡한 쿼리 작성
    let query = ds
      .getRepository(Project)
      .createQueryBuilder('p')
      .leftJoin(Customer, 'c', '"c"."id" = "p"."customer_id"')
      .leftJoin(Employee, 'e', '"e"."id" = "p"."employee_id"')
      .where('"p"."deleted_at" IS NULL')
      .select([
        '"p"."id"',
        '"p"."project_code"',
        '"p"."project_name"',
        '"p"."customer_id"',
        '"c"."name"',
        '"p"."employee_id"',
        '"e"."name"',
        '"p"."status"',
        '"p"."start_date"',
        '"p"."end_date"',
        '"p"."contract_amount"',
        '"p"."created_at"',
      ]);

    // RBAC 조건 적용
    if (user.role === 'MANAGER') {
      query = query.andWhere('"e"."department_id" = :departmentId', {
        departmentId: user.department_id,
      });
    } else if (user.role === 'USER') {
      query = query.andWhere('"p"."employee_id" = :userId', {
        userId: user.id,
      });
    }
    // ADMIN은 모든 프로젝트 조회 가능

    // 필터 조건 적용
    if (customerId) {
      query = query.andWhere('"p"."customer_id" = :customerId', { customerId });
    }

    if (status) {
      query = query.andWhere('"p"."status" = :status', { status });
    }

    if (employeeId) {
      query = query.andWhere('"p"."employee_id" = :employeeId', { employeeId });
    }

    // 키워드 검색
    if (keyword && keyword.length >= 2) {
      query = query.andWhere(
        '("p"."project_name" LIKE :keyword OR "p"."project_code" LIKE :keyword)',
        { keyword: `%${keyword}%` }
      );
    }

    // 정렬 적용
    query = query.orderBy(`"p"."${sortBy}"`, sortOrder);

    // 총 개수 조회
    const total = await query.getCount();

    // 페이지네이션 적용
    const skip = (page - 1) * pageSize;
    const results = await query
      .skip(skip)
      .take(pageSize)
      .getRawMany<any>();

    // 응답 형태 변환
    const projects: ProjectListItem[] = results.map((row) => {
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
        id: row.p_id,
        project_code: row.p_project_code,
        project_name: row.p_project_name,
        customer_id: row.p_customer_id,
        customer_name: row.c_name,
        employee_id: row.p_employee_id,
        employee_name: row.e_name,
        status: row.p_status,
        start_date: formatDate(row.p_start_date),
        end_date: formatDate(row.p_end_date),
        contract_amount: row.p_contract_amount,
        created_at: formatDateTime(row.p_created_at),
      };
    });

    return NextResponse.json({
      projects,
      total,
      page,
      page_size: pageSize,
    });
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
