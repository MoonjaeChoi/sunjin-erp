// Generated: 2026-01-27 18:00:00 KST

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
  let queryRunner;

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

    const status = searchParams.get('status') || undefined;
    const customerId = searchParams.get('customerId')
      ? parseInt(searchParams.get('customerId')!)
      : undefined;
    const assignedEmployeeId = searchParams.get('assignedEmployeeId')
      ? parseInt(searchParams.get('assignedEmployeeId')!)
      : undefined;
    const contractNameSearch = searchParams.get('contractNameSearch') || undefined;
    const startDateFrom = searchParams.get('startDateFrom') || undefined;
    const startDateTo = searchParams.get('startDateTo') || undefined;
    const endDateFrom = searchParams.get('endDateFrom') || undefined;
    const endDateTo = searchParams.get('endDateTo') || undefined;
    const sortBy = searchParams.get('sortBy') || 'mc.CREATED_AT';
    const sortOrder = (searchParams.get('order') || 'DESC') as 'ASC' | 'DESC';

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    // 5. Raw SQL 쿼리 구성
    queryRunner = dataSource.createQueryRunner();

    let whereClause = 'WHERE mc.DELETED_AT IS NULL';
    const params: any = {};

    if (status) {
      whereClause += ' AND mc.CONTRACT_STATUS = :status';
      params.status = status;
    }

    if (customerId) {
      whereClause += ' AND mc.CUSTOMER_ID = :customerId';
      params.customerId = customerId;
    }

    if (assignedEmployeeId) {
      whereClause += ' AND mc.ASSIGNED_EMPLOYEE_ID = :assignedEmployeeId';
      params.assignedEmployeeId = assignedEmployeeId;
    }

    if (contractNameSearch) {
      whereClause += ' AND LOWER(mc.CONTRACT_NAME) LIKE LOWER(:contractNameSearch)';
      params.contractNameSearch = `%${contractNameSearch}%`;
    }

    if (startDateFrom) {
      whereClause += ' AND mc.START_DATE >= TO_DATE(:startDateFrom, \'YYYY-MM-DD\')';
      params.startDateFrom = startDateFrom;
    }

    if (startDateTo) {
      whereClause += ' AND mc.START_DATE <= TO_DATE(:startDateTo, \'YYYY-MM-DD\')';
      params.startDateTo = startDateTo;
    }

    if (endDateFrom) {
      whereClause += ' AND mc.END_DATE >= TO_DATE(:endDateFrom, \'YYYY-MM-DD\')';
      params.endDateFrom = endDateFrom;
    }

    if (endDateTo) {
      whereClause += ' AND mc.END_DATE <= TO_DATE(:endDateTo, \'YYYY-MM-DD\')';
      params.endDateTo = endDateTo;
    }

    const offset = (page - 1) * limit;

    // 총 개수 조회
    const countResult = await queryRunner.query(
      `SELECT COUNT(*) as total FROM MAINTENANCE_CONTRACTS mc ${whereClause}`,
      Object.values(params)
    );
    const total = parseInt(countResult[0]?.TOTAL || '0');

    // 목록 조회
    const sql = `
      SELECT
        mc.ID as id,
        mc.CUSTOMER_ID as customer_id,
        mc.CONTRACT_NAME as contract_name,
        mc.CONTRACT_TYPE as contract_type,
        mc.START_DATE as start_date,
        mc.END_DATE as end_date,
        mc.ASSIGNED_EMPLOYEE_ID as assigned_employee_id,
        mc.CONTRACT_AMOUNT as contract_amount,
        mc.CONTRACT_STATUS as contract_status,
        mc.NOTES as notes,
        mc.CREATED_AT as created_at,
        mc.UPDATED_AT as updated_at,
        mc.CREATED_BY_ID as created_by_id,
        mc.UPDATED_BY_ID as updated_by_id
      FROM MAINTENANCE_CONTRACTS mc
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    const contracts = await queryRunner.query(sql, {
      ...params,
      offset,
      limit,
    });

    // 6. 응답 반환
    const totalPages = Math.ceil(total / limit);
    return NextResponse.json(
      {
        data: contracts.map((c: any) => ({
          id: c.ID,
          customer_id: c.CUSTOMER_ID,
          contract_name: c.CONTRACT_NAME,
          contract_type: c.CONTRACT_TYPE,
          start_date: c.START_DATE,
          end_date: c.END_DATE,
          assigned_employee_id: c.ASSIGNED_EMPLOYEE_ID,
          contract_amount: c.CONTRACT_AMOUNT,
          contract_status: c.CONTRACT_STATUS,
          notes: c.NOTES,
          created_at: c.CREATED_AT,
          updated_at: c.UPDATED_AT,
          created_by_id: c.CREATED_BY_ID,
          updated_by_id: c.UPDATED_BY_ID,
        })),
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
  } finally {
    if (queryRunner) {
      await queryRunner.release();
    }
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
  let queryRunner;

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
    const dataSource = await getDataSource();
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

    // 8. QueryRunner 생성 및 트랜잭션 시작
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    // 9. 의존성 확인 (Customer, Employee 존재 여부)
    const customerCheck = await queryRunner.query(
      'SELECT "id" FROM CUSTOMER WHERE "id" = :customer_id AND "deleted_at" IS NULL',
      { customer_id }
    );

    if (customerCheck.length === 0) {
      await queryRunner.rollbackTransaction();
      return NextResponse.json(
        {
          error: 'Not Found',
          details: `Customer with id ${customer_id} not found`,
        },
        { status: 404 }
      );
    }

    const employeeCheck = await queryRunner.query(
      'SELECT "id" FROM EMPLOYEE WHERE "id" = :assigned_employee_id AND "deleted_at" IS NULL',
      { assigned_employee_id }
    );

    if (employeeCheck.length === 0) {
      await queryRunner.rollbackTransaction();
      return NextResponse.json(
        {
          error: 'Not Found',
          details: `Employee with id ${assigned_employee_id} not found`,
        },
        { status: 404 }
      );
    }

    // 10. 계약 생성
    const userId = (session.user as any)?.id as number;
    const now = new Date();

    const insertResult = await queryRunner.query(
      `INSERT INTO maintenance_contracts
      (id, customer_id, contract_name, contract_type, start_date, end_date, assigned_employee_id, contract_amount, contract_status, notes, created_by_id, updated_by_id, created_at, updated_at)
      VALUES (MAINTENANCE_CONTRACTS_ID_SEQ.NEXTVAL, :customer_id, :contract_name, :contract_type, TO_DATE(:start_date, 'YYYY-MM-DD'), TO_DATE(:end_date, 'YYYY-MM-DD'), :assigned_employee_id, :contract_amount, '활성', :notes, :created_by_id, :updated_by_id, :created_at, :updated_at)`,
      {
        customer_id,
        contract_name,
        contract_type,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        assigned_employee_id,
        contract_amount: contract_amount || null,
        notes: notes || null,
        created_by_id: userId,
        updated_by_id: userId,
        created_at: now,
        updated_at: now,
      }
    );

    // 11. 최근 생성된 계약 ID 조회 (Oracle에서)
    const lastIdResult = await queryRunner.query(
      'SELECT MAX(ID) as id FROM MAINTENANCE_CONTRACTS WHERE CUSTOMER_ID = :customer_id',
      { customer_id }
    );
    const contractId = lastIdResult[0]?.ID;

    // 12. 이력 기록
    await queryRunner.query(
      `INSERT INTO MAINTENANCE_CONTRACT_HISTORIES
      (ID, MAINTENANCE_CONTRACT_ID, CHANGE_TYPE, REASON, CHANGED_BY_ID, CHANGED_AT, DELETED_AT)
      VALUES (MAINTENANCE_CONTRACT_HISTORIES_ID_SEQ.NEXTVAL, :contract_id, '정보_수정', '계약 생성', :changed_by_id, :changed_at, NULL)`,
      {
        contract_id: contractId,
        changed_by_id: userId,
        changed_at: now,
      }
    );

    // 13. 커밋
    await queryRunner.commitTransaction();

    // 14. 생성된 계약 조회 및 반환
    const created = await queryRunner.query(
      'SELECT * FROM MAINTENANCE_CONTRACTS WHERE ID = :id',
      { id: contractId }
    );

    const contract = created[0];

    return NextResponse.json(
      {
        data: {
          id: contract.ID,
          customer_id: contract.CUSTOMER_ID,
          contract_name: contract.CONTRACT_NAME,
          contract_type: contract.CONTRACT_TYPE,
          start_date: contract.START_DATE,
          end_date: contract.END_DATE,
          assigned_employee_id: contract.ASSIGNED_EMPLOYEE_ID,
          contract_amount: contract.CONTRACT_AMOUNT,
          contract_status: contract.CONTRACT_STATUS,
          notes: contract.NOTES,
          created_at: contract.CREATED_AT,
          updated_at: contract.UPDATED_AT,
        },
        message: '유지보수 계약이 생성되었습니다.',
      },
      { status: 201 }
    );
  } catch (error) {
    if (queryRunner && queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    console.error('POST /api/maintenance error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    if (queryRunner) {
      await queryRunner.release();
    }
  }
}
