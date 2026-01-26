// Generated: 2026-01-26 22:50:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { getDataSource } from '../../../lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/maintenance
 *
 * 유지보수 계약 목록 조회 (페이지네이션 + 필터 + 정렬)
 * - 권한: USER+ (모든 인증 사용자)
 * - 쿼리 파라미터: status, assignedEmployeeId, customerId, contractNameSearch, startDateFrom, startDateTo, endDateFrom, endDateTo, sortBy, order, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 세션 검증
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 권한 검증 (USER, MANAGER, ADMIN만 허용)
    const allowedRoles = ['USER', 'MANAGER', 'ADMIN'];
    const userRole = (session.user as any)?.role;
    if (!allowedRoles.includes(userRole as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. 데이터베이스 연결 확인
    const dataSource = await getDataSource();
    if (!dataSource.isInitialized) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // 4. 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;

    const filters = {
      status: searchParams.get('status') || undefined,
      customerId: searchParams.get('customerId')
        ? parseInt(searchParams.get('customerId')!)
        : undefined,
      assignedEmployeeId: searchParams.get('assignedEmployeeId')
        ? parseInt(searchParams.get('assignedEmployeeId')!)
        : undefined,
      contractNameSearch: searchParams.get('contractNameSearch') || undefined,
      startDateFrom: searchParams.get('startDateFrom')
        ? new Date(searchParams.get('startDateFrom')!)
        : undefined,
      startDateTo: searchParams.get('startDateTo')
        ? new Date(searchParams.get('startDateTo')!)
        : undefined,
      endDateFrom: searchParams.get('endDateFrom')
        ? new Date(searchParams.get('endDateFrom')!)
        : undefined,
      endDateTo: searchParams.get('endDateTo')
        ? new Date(searchParams.get('endDateTo')!)
        : undefined,
      sortBy: searchParams.get('sortBy') || 'mc.created_at',
      sortOrder: (searchParams.get('order') || 'DESC') as 'ASC' | 'DESC',
    };

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    // 5. 서비스를 통해 계약 조회
    const { MaintenanceContractRepository } = await import('../../../lib/maintenance-repository');
    const repository = new MaintenanceContractRepository(dataSource);
    const [contracts, total] = await repository.findActiveContracts(filters, {
      page,
      limit,
    });

    // 6. 응답 반환
    const totalPages = Math.ceil(total / limit);
    return NextResponse.json(
      {
        data: contracts,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/maintenance error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/maintenance
 *
 * 유지보수 계약 생성 (트랜잭션 + 이력 기록)
 * - 권한: MANAGER+ (MANAGER, ADMIN만)
 * - 요청 본문: customer_id, contract_name, contract_type, start_date, end_date, assigned_employee_id, contract_amount?, notes?
 */
export async function POST(request: NextRequest) {
  let dataSource;

  try {
    // 1. 세션 검증
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 권한 검증 (MANAGER, ADMIN만 허용)
    const allowedRoles = ['MANAGER', 'ADMIN'];
    const userRole = (session.user as any)?.role;
    if (!allowedRoles.includes(userRole as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. 데이터베이스 연결 확인
    dataSource = await getDataSource();
    if (!dataSource.isInitialized) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // 4. 요청 본문 파싱
    const body = await request.json();
    const {
      customer_id,
      contract_name,
      contract_type,
      start_date,
      end_date,
      assigned_employee_id,
      contract_amount,
      notes,
    } = body;

    // 5. 필수 필드 검증
    if (!customer_id || !contract_name || !contract_type || !start_date || !end_date || !assigned_employee_id) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          details: 'Missing required fields: customer_id, contract_name, contract_type, start_date, end_date, assigned_employee_id',
        },
        { status: 400 }
      );
    }

    // 6. 필드 값 검증
    if (typeof contract_name !== 'string' || contract_name.length > 255) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          details: 'contract_name must be a string (max 255 chars)',
        },
        { status: 400 }
      );
    }

    if (contract_amount !== null && contract_amount !== undefined) {
      if (typeof contract_amount !== 'number' || contract_amount < 0) {
        return NextResponse.json(
          {
            error: 'Validation Error',
            details: 'contract_amount must be a non-negative number',
          },
          { status: 400 }
        );
      }
    }

    // 7. 날짜 검증
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          details: 'Invalid date format for start_date or end_date',
        },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          details: 'start_date must be before or equal to end_date',
        },
        { status: 400 }
      );
    }

    // 8. 의존성 확인 (Customer, Employee 존재 여부) - 동적 import 사용
    const { Customer } = await import('../../../entities/Customer');
    const { Employee } = await import('../../../entities/Employee');

    const customerRepo = dataSource.getRepository(Customer);
    const employeeRepo = dataSource.getRepository(Employee);

    const customerExists = await customerRepo.findOne({
      where: { id: customer_id, deleted_at: null },
    });

    if (!customerExists) {
      return NextResponse.json(
        {
          error: 'Not Found',
          details: `Customer with id ${customer_id} not found`,
        },
        { status: 404 }
      );
    }

    const employeeExists = await employeeRepo.findOne({
      where: { id: assigned_employee_id, deleted_at: null },
    });

    if (!employeeExists) {
      return NextResponse.json(
        {
          error: 'Not Found',
          details: `Employee with id ${assigned_employee_id} not found`,
        },
        { status: 404 }
      );
    }

    // 9. 서비스를 통해 계약 생성 (트랜잭션 포함)
    const { MaintenanceContractService } = await import('../../../lib/maintenance-service');
    const service = new MaintenanceContractService(dataSource);
    const userId = (session.user as any)?.id as number;
    const contract = await service.createContract(
      {
        customer_id,
        contract_name,
        contract_type,
        start_date: startDate,
        end_date: endDate,
        assigned_employee_id,
        contract_amount: contract_amount || null,
        notes: notes || null,
      },
      userId
    );

    // 10. 성공 응답
    return NextResponse.json(
      {
        data: contract,
        message: '유지보수 계약이 생성되었습니다.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/maintenance error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
