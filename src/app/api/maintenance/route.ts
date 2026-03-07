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
    const sortBy = searchParams.get('sortBy') || 'MC."created_at"';
    const sortOrder = (searchParams.get('order') || 'DESC') as 'ASC' | 'DESC';

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    // 4. Raw SQL 쿼리 구성
    let whereClause = 'WHERE MC."deleted_at" IS NULL';
    const params: any = {};

    if (status) {
      whereClause += ' AND MC."contract_status" = :status';
      params.status = status;
    }

    if (customerId) {
      whereClause += ' AND MC."customer_id" = :customerId';
      params.customerId = customerId;
    }

    if (assignedEmployeeId) {
      whereClause += ' AND MC."assigned_employee_id" = :assignedEmployeeId';
      params.assignedEmployeeId = assignedEmployeeId;
    }

    if (contractNameSearch) {
      whereClause += ' AND LOWER(MC."contract_name") LIKE LOWER(:contractNameSearch)';
      params.contractNameSearch = `%${contractNameSearch}%`;
    }

    if (startDateFrom) {
      whereClause += ' AND MC."start_date" >= TO_DATE(:startDateFrom, \'YYYY-MM-DD\')';
      params.startDateFrom = startDateFrom;
    }

    if (startDateTo) {
      whereClause += ' AND MC."start_date" <= TO_DATE(:startDateTo, \'YYYY-MM-DD\')';
      params.startDateTo = startDateTo;
    }

    if (endDateFrom) {
      whereClause += ' AND MC."end_date" >= TO_DATE(:endDateFrom, \'YYYY-MM-DD\')';
      params.endDateFrom = endDateFrom;
    }

    if (endDateTo) {
      whereClause += ' AND MC."end_date" <= TO_DATE(:endDateTo, \'YYYY-MM-DD\')';
      params.endDateTo = endDateTo;
    }

    const offset = (page - 1) * limit;

    // 5. 총 개수 조회
    const countResult = await executeQuery(
      `SELECT COUNT(*) as TOTAL FROM "MAINTENANCE_CONTRACT" MC ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.TOTAL || '0');

    // 6. 목록 조회
    const sql = `
      SELECT
        MC."id",
        MC."customer_id",
        MC."contract_name",
        MC."contract_type",
        MC."start_date",
        MC."end_date",
        MC."assigned_employee_id",
        MC."contract_amount",
        MC."contract_status",
        MC."notes",
        MC."created_at",
        MC."updated_at",
        MC."created_by_id",
        MC."updated_by_id"
      FROM "MAINTENANCE_CONTRACT" MC
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    const contractsResult = await executeQuery(sql, {
      ...params,
      offset,
      limit,
    });

    // 7. 응답 반환 (lowercase quoted columns → lowercase keys in result rows)
    const totalPages = Math.ceil(total / limit);
    return NextResponse.json(
      {
        data: contractsResult.rows.map((c: any) => ({
          id: c.id,
          customer_id: c.customer_id,
          contract_name: c.contract_name,
          contract_type: c.contract_type,
          start_date: c.start_date,
          end_date: c.end_date,
          assigned_employee_id: c.assigned_employee_id,
          contract_amount: c.contract_amount,
          contract_status: c.contract_status,
          notes: c.notes,
          created_at: c.created_at,
          updated_at: c.updated_at,
          created_by_id: c.created_by_id,
          updated_by_id: c.updated_by_id,
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
      'SELECT "id" FROM "CUSTOMER" WHERE "id" = :customer_id AND "deleted_at" IS NULL',
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

    // EMPLOYEE 테이블은 UPPERCASE 컬럼 사용
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
        query: `INSERT INTO "MAINTENANCE_CONTRACT"
          ("id", "customer_id", "contract_name", "contract_type", "start_date", "end_date", "assigned_employee_id", "contract_amount", "contract_status", "notes", "created_by_id", "updated_by_id", "created_at", "updated_at")
          VALUES (SEQ_MAINTENANCE_CONTRACT.NEXTVAL, :customer_id, :contract_name, :contract_type, TO_DATE(:start_date, 'YYYY-MM-DD'), TO_DATE(:end_date, 'YYYY-MM-DD'), :assigned_employee_id, :contract_amount, '활성', :notes, :created_by_id, :updated_by_id, :created_at, :updated_at)`,
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
      'SELECT MAX("id") as id FROM "MAINTENANCE_CONTRACT" WHERE "customer_id" = :customer_id',
      { customer_id }
    );
    const contractId = (lastIdResult as any)?.id;

    // 10. 이력 기록
    await executeUpdate(
      `INSERT INTO "MAINTENANCE_CONTRACT_HISTORY"
        ("id", "maintenance_contract_id", "change_type", "reason", "changed_by_id", "changed_at", "deleted_at")
        VALUES (SEQ_MAINTENANCE_CONTRACT_HISTORY.NEXTVAL, :contract_id, '정보수정', '계약 생성', :changed_by_id, :changed_at, NULL)`,
      {
        contract_id: contractId,
        changed_by_id: userId,
        changed_at: now,
      }
    );

    // 11. 생성된 계약 조회 및 반환
    const contract = await executeQuerySingle(
      'SELECT * FROM "MAINTENANCE_CONTRACT" WHERE "id" = :id',
      { id: contractId }
    );

    // lowercase quoted columns → lowercase keys in result rows
    return NextResponse.json(
      {
        data: {
          id: (contract as any)?.id,
          customer_id: (contract as any)?.customer_id,
          contract_name: (contract as any)?.contract_name,
          contract_type: (contract as any)?.contract_type,
          start_date: (contract as any)?.start_date,
          end_date: (contract as any)?.end_date,
          assigned_employee_id: (contract as any)?.assigned_employee_id,
          contract_amount: (contract as any)?.contract_amount,
          contract_status: (contract as any)?.contract_status,
          notes: (contract as any)?.notes,
          created_at: (contract as any)?.created_at,
          updated_at: (contract as any)?.updated_at,
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
