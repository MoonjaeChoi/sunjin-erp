// Generated: 2026-01-27 23:45:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { executeQuery, executeQuerySingle, executeUpdate, executeTransaction } from '../../../lib/db-direct';

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

    // 3. 쿼리 파라미터 파싱
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
    const sortBy = searchParams.get('sortBy') || 'MC.CREATED_AT';
    const sortOrder = (searchParams.get('order') || 'DESC') as 'ASC' | 'DESC';

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    // 4. Raw SQL 쿼리 구성
    let whereClause = 'WHERE MC.DELETED_AT IS NULL';
    const params: any = {};

    if (status) {
      whereClause += ' AND MC.CONTRACT_STATUS = :status';
      params.status = status;
    }

    if (customerId) {
      whereClause += ' AND MC.CUSTOMER_ID = :customerId';
      params.customerId = customerId;
    }

    if (assignedEmployeeId) {
      whereClause += ' AND MC.ASSIGNED_EMPLOYEE_ID = :assignedEmployeeId';
      params.assignedEmployeeId = assignedEmployeeId;
    }

    if (contractNameSearch) {
      whereClause += ' AND LOWER(MC.CONTRACT_NAME) LIKE LOWER(:contractNameSearch)';
      params.contractNameSearch = `%${contractNameSearch}%`;
    }

    if (startDateFrom) {
      whereClause += ' AND MC.START_DATE >= TO_DATE(:startDateFrom, \'YYYY-MM-DD\')';
      params.startDateFrom = startDateFrom;
    }

    if (startDateTo) {
      whereClause += ' AND MC.START_DATE <= TO_DATE(:startDateTo, \'YYYY-MM-DD\')';
      params.startDateTo = startDateTo;
    }

    if (endDateFrom) {
      whereClause += ' AND MC.END_DATE >= TO_DATE(:endDateFrom, \'YYYY-MM-DD\')';
      params.endDateFrom = endDateFrom;
    }

    if (endDateTo) {
      whereClause += ' AND MC.END_DATE <= TO_DATE(:endDateTo, \'YYYY-MM-DD\')';
      params.endDateTo = endDateTo;
    }

    const offset = (page - 1) * limit;

    // 5. 총 개수 조회
    const countResult = await executeQuery(
      `SELECT COUNT(*) as TOTAL FROM MAINTENANCE_CONTRACTS MC ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.TOTAL || '0');

    // 6. 목록 조회
    const sql = `
      SELECT
        MC.ID,
        MC.CUSTOMER_ID,
        MC.CONTRACT_NAME,
        MC.CONTRACT_TYPE,
        MC.START_DATE,
        MC.END_DATE,
        MC.ASSIGNED_EMPLOYEE_ID,
        MC.CONTRACT_AMOUNT,
        MC.CONTRACT_STATUS,
        MC.NOTES,
        MC.CREATED_AT,
        MC.UPDATED_AT,
        MC.CREATED_BY_ID,
        MC.UPDATED_BY_ID
      FROM MAINTENANCE_CONTRACTS MC
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    const contractsResult = await executeQuery(sql, {
      ...params,
      offset,
      limit,
    });

    // 7. 응답 반환
    const totalPages = Math.ceil(total / limit);
    return NextResponse.json(
      {
        data: contractsResult.rows.map((c: any) => ({
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

    // 3. 요청 본문 파싱
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

    // 4. 필수 필드 검증
    if (!customer_id || !contract_name || !contract_type || !start_date || !end_date || !assigned_employee_id) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          details: 'Missing required fields: customer_id, contract_name, contract_type, start_date, end_date, assigned_employee_id',
        },
        { status: 400 }
      );
    }

    // 5. 필드 값 검증
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

    // 6. 날짜 검증
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

    // 7. 의존성 확인 (Customer, Employee 존재 여부)
    const customerCheck = await executeQuerySingle(
      'SELECT ID FROM CUSTOMER WHERE ID = :customer_id AND DELETED_AT IS NULL',
      { customer_id }
    );

    if (!customerCheck) {
      return NextResponse.json(
        {
          error: 'Not Found',
          details: `Customer with id ${customer_id} not found`,
        },
        { status: 404 }
      );
    }

    const employeeCheck = await executeQuerySingle(
      'SELECT ID FROM EMPLOYEE WHERE ID = :assigned_employee_id AND DELETED_AT IS NULL',
      { assigned_employee_id }
    );

    if (!employeeCheck) {
      return NextResponse.json(
        {
          error: 'Not Found',
          details: `Employee with id ${assigned_employee_id} not found`,
        },
        { status: 404 }
      );
    }

    // 8. 트랜잭션 실행 (계약 생성 + 이력 기록)
    const userId = (session.user as any)?.id as number;
    const now = new Date();
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const results = await executeTransaction([
      {
        query: `INSERT INTO MAINTENANCE_CONTRACTS
          (ID, CUSTOMER_ID, CONTRACT_NAME, CONTRACT_TYPE, START_DATE, END_DATE, ASSIGNED_EMPLOYEE_ID, CONTRACT_AMOUNT, CONTRACT_STATUS, NOTES, CREATED_BY_ID, UPDATED_BY_ID, CREATED_AT, UPDATED_AT)
          VALUES (SEQ_MAINTENANCE_CONTRACTS.NEXTVAL, :customer_id, :contract_name, :contract_type, TO_DATE(:start_date, 'YYYY-MM-DD'), TO_DATE(:end_date, 'YYYY-MM-DD'), :assigned_employee_id, :contract_amount, '활성', :notes, :created_by_id, :updated_by_id, :created_at, :updated_at)`,
        params: {
          customer_id,
          contract_name,
          contract_type,
          start_date: startDateStr,
          end_date: endDateStr,
          assigned_employee_id,
          contract_amount: contract_amount || null,
          notes: notes || null,
          created_by_id: userId,
          updated_by_id: userId,
          created_at: now,
          updated_at: now,
        },
      },
    ]);

    // 9. 생성된 계약 ID 조회
    const lastIdResult = await executeQuerySingle(
      'SELECT MAX(ID) as ID FROM MAINTENANCE_CONTRACTS WHERE CUSTOMER_ID = :customer_id',
      { customer_id }
    );
    const contractId = (lastIdResult as any)?.ID;

    // 10. 이력 기록
    await executeUpdate(
      `INSERT INTO MAINTENANCE_CONTRACT_HISTORIES
        (ID, MAINTENANCE_CONTRACT_ID, CHANGE_TYPE, REASON, CHANGED_BY_ID, CHANGED_AT, DELETED_AT)
        VALUES (SEQ_MAINTENANCE_CONTRACT_HISTORIES.NEXTVAL, :contract_id, '정보수정', '계약 생성', :changed_by_id, :changed_at, NULL)`,
      {
        contract_id: contractId,
        changed_by_id: userId,
        changed_at: now,
      }
    );

    // 11. 생성된 계약 조회 및 반환
    const contract = await executeQuerySingle(
      'SELECT * FROM MAINTENANCE_CONTRACTS WHERE ID = :id',
      { id: contractId }
    );

    return NextResponse.json(
      {
        data: {
          id: (contract as any)?.ID,
          customer_id: (contract as any)?.CUSTOMER_ID,
          contract_name: (contract as any)?.CONTRACT_NAME,
          contract_type: (contract as any)?.CONTRACT_TYPE,
          start_date: (contract as any)?.START_DATE,
          end_date: (contract as any)?.END_DATE,
          assigned_employee_id: (contract as any)?.ASSIGNED_EMPLOYEE_ID,
          contract_amount: (contract as any)?.CONTRACT_AMOUNT,
          contract_status: (contract as any)?.CONTRACT_STATUS,
          notes: (contract as any)?.NOTES,
          created_at: (contract as any)?.CREATED_AT,
          updated_at: (contract as any)?.UPDATED_AT,
        },
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
