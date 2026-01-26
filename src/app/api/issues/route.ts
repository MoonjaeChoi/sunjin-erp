// Generated: 2026-01-26 23:45:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface IssueListItem {
  id: number;
  customer_id: number;
  customer_name: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  is_public: number;
  created_by_id: number;
  created_by_name: string;
  assigned_to_id: number | null;
  assigned_to_name: string | null;
  treatment_method: string | null;
  treatment_time_minutes: number | null;
  treatment_result: string | null;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

interface IssueListResponse {
  data: IssueListItem[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

interface CreateIssueRequest {
  customer_id: number;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  assigned_to_id?: number;
  treatment_method?: 'REMOTE' | 'PHONE' | 'ONSITE';
  treatment_time_minutes?: number;
  treatment_result?: string;
}

interface CreateIssueResponse {
  message: string;
  data: {
    id: number;
    customer_id: number;
    title: string;
    severity: string;
    status: string;
    is_public: number;
    created_by_id: number;
    assigned_to_id: number | null;
    created_at: Date;
  };
}

const ALLOWED_SORT_BY = [
  'created_at',
  'status',
  'severity',
  'assigned_to_id',
] as const;

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. 세션 확인 (인증 검증)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = session.user as any;
    const userId = user.id;
    const userRole = user.role;
    const userDepartmentId = user.department;

    // 2. 쿼리 파라미터 파싱
    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const page_size = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('page_size') || '20', 10))
    );
    const customer_id = searchParams.get('customer_id')
      ? parseInt(searchParams.get('customer_id')!, 10)
      : undefined;
    const status = searchParams.get('status')
      ? searchParams.get('status')!.split(',')
      : undefined;
    const severity = searchParams.get('severity')
      ? searchParams.get('severity')!.split(',')
      : undefined;
    const assignee_id = searchParams.get('assignee_id')
      ? parseInt(searchParams.get('assignee_id')!, 10)
      : undefined;
    const created_by_id = searchParams.get('created_by_id')
      ? parseInt(searchParams.get('created_by_id')!, 10)
      : undefined;
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const keyword = searchParams.get('keyword');
    const sort_by = searchParams.get('sort_by') || 'created_at';
    const sort_order = (searchParams.get('sort_order') || 'DESC').toUpperCase();

    // 3. 권한별 WHERE 절 동적 구성 (RLS)
    // Note: ISSUE table uses unquoted column names (stored as uppercase by Oracle)
    const whereClauses: string[] = ['i.DELETED_AT IS NULL'];
    const params: any = {};
    let paramIndex = 0;

    if (userRole === 'ADMIN') {
      // ADMIN: 모든 행 반환
    } else if (userRole === 'MANAGER') {
      // MANAGER: 같은 부서 담당자의 Issue만
      whereClauses.push(
        `i.ASSIGNED_TO_ID IS NOT NULL AND e_assigned.department_id = :departmentId${paramIndex}`
      );
      params[`departmentId${paramIndex}`] = userDepartmentId;
      paramIndex++;
    } else if (userRole === 'USER') {
      // USER: 자신 생성 + 자신 담당 + 같은 부서 공개
      whereClauses.push(
        `(i.CREATED_BY_ID = :userId${paramIndex}
         OR i.ASSIGNED_TO_ID = :userId${paramIndex + 1}
         OR (i.IS_PUBLIC = 1 AND e_assigned.department_id = :departmentId${paramIndex + 2}))`
      );
      params[`userId${paramIndex}`] = userId;
      params[`userId${paramIndex + 1}`] = userId;
      params[`departmentId${paramIndex + 2}`] = userDepartmentId;
      paramIndex += 3;
    }

    // 4. 필터 적용 (AND 조합)
    if (customer_id) {
      whereClauses.push(`i.CUSTOMER_ID = :customerId${paramIndex}`);
      params[`customerId${paramIndex}`] = customer_id;
      paramIndex++;
    }

    if (status && status.length > 0) {
      const statusPlaceholders = status
        .map((_, i) => `:status${paramIndex + i}`)
        .join(',');
      whereClauses.push(`i.STATUS IN (${statusPlaceholders})`);
      status.forEach((s, i) => {
        params[`status${paramIndex + i}`] = s;
      });
      paramIndex += status.length;
    }

    if (severity && severity.length > 0) {
      const severityPlaceholders = severity
        .map((_, i) => `:severity${paramIndex + i}`)
        .join(',');
      whereClauses.push(`i.SEVERITY IN (${severityPlaceholders})`);
      severity.forEach((s, i) => {
        params[`severity${paramIndex + i}`] = s;
      });
      paramIndex += severity.length;
    }

    if (assignee_id) {
      whereClauses.push(`i.ASSIGNED_TO_ID = :assigneeId${paramIndex}`);
      params[`assigneeId${paramIndex}`] = assignee_id;
      paramIndex++;
    }

    if (created_by_id) {
      whereClauses.push(`i.CREATED_BY_ID = :createdById${paramIndex}`);
      params[`createdById${paramIndex}`] = created_by_id;
      paramIndex++;
    }

    if (date_from) {
      whereClauses.push(
        `TRUNC(i.CREATED_AT) >= TRUNC(TO_DATE(:dateFrom${paramIndex}, 'YYYY-MM-DD'))`
      );
      params[`dateFrom${paramIndex}`] = date_from;
      paramIndex++;
    }

    if (date_to) {
      whereClauses.push(
        `TRUNC(i.CREATED_AT) <= TRUNC(TO_DATE(:dateTo${paramIndex}, 'YYYY-MM-DD'))`
      );
      params[`dateTo${paramIndex}`] = date_to;
      paramIndex++;
    }

    if (keyword) {
      whereClauses.push(
        `(LOWER(i.TITLE) LIKE LOWER(:keyword${paramIndex})
         OR LOWER(DBMS_LOB.SUBSTR(i.DESCRIPTION, 4000, 1)) LIKE LOWER(:keyword${paramIndex}))`
      );
      params[`keyword${paramIndex}`] = `%${keyword}%`;
      paramIndex++;
    }

    // 5. 정렬 옵션 검증
    const finalSortBy = (ALLOWED_SORT_BY as readonly string[]).includes(sort_by)
      ? sort_by
      : 'created_at';
    const finalSortOrder = sort_order === 'ASC' ? 'ASC' : 'DESC';

    // 6. 데이터베이스 연결 및 쿼리 실행
    const ds = await getDataSource();
    const queryRunner = ds.createQueryRunner();

    try {
      const offset = (page - 1) * page_size;
      params.offset = offset;
      params.pageSize = page_size;

      const query = `
        SELECT
          i.ID,
          i.CUSTOMER_ID,
          i.TITLE,
          i.DESCRIPTION,
          i.SEVERITY,
          i.STATUS,
          i.IS_PUBLIC,
          i.CREATED_BY_ID,
          i.ASSIGNED_TO_ID,
          i.TREATMENT_METHOD,
          i.TREATMENT_TIME_MINUTES,
          i.TREATMENT_RESULT,
          i.CREATED_AT,
          i.COMPLETED_AT,
          i.UPDATED_AT,
          i.DELETED_AT,
          c."name" AS customer_name,
          e_created."name" AS created_by_name,
          e_assigned."name" AS assigned_to_name
        FROM ISSUE i
        LEFT JOIN CUSTOMER c ON c."id" = i.CUSTOMER_ID AND c."deleted_at" IS NULL
        LEFT JOIN EMPLOYEE e_created ON e_created."id" = i.CREATED_BY_ID AND e_created."deleted_at" IS NULL
        LEFT JOIN EMPLOYEE e_assigned ON e_assigned."id" = i.ASSIGNED_TO_ID AND e_assigned."deleted_at" IS NULL
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY i.${finalSortBy.toUpperCase()} ${finalSortOrder}
        OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM ISSUE i
        LEFT JOIN EMPLOYEE e_assigned ON e_assigned."id" = i.ASSIGNED_TO_ID
        WHERE ${whereClauses.join(' AND ')}
      `;

      // Separate params for count query (no offset/pageSize) and data query
      const countParams = { ...params };
      delete countParams.offset;
      delete countParams.pageSize;

      console.log('Main query:', query);
      console.log('Count query:', countQuery);
      console.log('Params:', params);
      console.log('CountParams:', countParams);

      const [issues, countResult] = await Promise.all([
        queryRunner.query(query, params),
        queryRunner.query(countQuery, countParams),
      ]);

      const total = parseInt(countResult[0]?.total || '0', 10);

      // 7. 응답 반환
      const formattedIssues: IssueListItem[] = issues.map((row: any) => ({
        id: row.ID,
        customer_id: row.CUSTOMER_ID,
        customer_name: row.customer_name || '',
        title: row.TITLE,
        description: row.DESCRIPTION,
        severity: row.SEVERITY,
        status: row.STATUS,
        is_public: row.IS_PUBLIC,
        created_by_id: row.CREATED_BY_ID,
        created_by_name: row.created_by_name || '',
        assigned_to_id: row.ASSIGNED_TO_ID,
        assigned_to_name: row.assigned_to_name || null,
        treatment_method: row.TREATMENT_METHOD,
        treatment_time_minutes: row.TREATMENT_TIME_MINUTES,
        treatment_result: row.TREATMENT_RESULT,
        created_at: row.CREATED_AT,
        completed_at: row.COMPLETED_AT,
        updated_at: row.UPDATED_AT,
      }));

      return NextResponse.json<IssueListResponse>({
        data: formattedIssues,
        pagination: {
          page,
          page_size,
          total,
          total_pages: Math.ceil(total / page_size),
        },
      });
    } finally {
      await queryRunner.release();
    }
  } catch (error: any) {
    console.error('GET /api/issues error:', error);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    console.error('Error driverError:', error?.driverError);
    console.error('SQL Query:', error?.query);
    console.error('Parameters:', error?.parameters);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = session.user as any;
    const userId = user.id;
    const userRole = user.role;
    const userDepartmentId = user.department;

    // 권한 검사: USER, MANAGER, ADMIN만 등록 가능
    if (!['USER', 'MANAGER', 'ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // 2. 요청 본문 파싱
    const body = (await req.json()) as CreateIssueRequest;
    const {
      customer_id,
      title,
      severity,
      description,
      assigned_to_id,
      treatment_method,
      treatment_time_minutes,
      treatment_result,
    } = body;

    // 3. 필드 검증
    const errors: Record<string, string> = {};

    if (!customer_id || typeof customer_id !== 'number') {
      errors.customer_id = 'customer_id is required and must be a number';
    }

    if (
      !title ||
      typeof title !== 'string' ||
      title.length < 1 ||
      title.length > 255
    ) {
      errors.title = 'title is required and must be 1-255 characters';
    }

    if (
      !severity ||
      !['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(severity)
    ) {
      errors.severity = 'severity must be CRITICAL, HIGH, MEDIUM, or LOW';
    }

    if (
      !description ||
      typeof description !== 'string' ||
      description.length < 10
    ) {
      errors.description =
        'description is required and must be at least 10 characters';
    }

    if (
      treatment_time_minutes !== undefined &&
      (typeof treatment_time_minutes !== 'number' ||
        treatment_time_minutes < 1 ||
        treatment_time_minutes > 1440)
    ) {
      errors.treatment_time_minutes =
        'treatment_time_minutes must be 1-1440 (minutes)';
    }

    if (
      treatment_method &&
      !['REMOTE', 'PHONE', 'ONSITE'].includes(treatment_method)
    ) {
      errors.treatment_method =
        'treatment_method must be REMOTE, PHONE, or ONSITE';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { message: 'Validation failed', errors },
        { status: 400 }
      );
    }

    // 4. 데이터베이스 연결
    const ds = await getDataSource();
    const queryRunner = ds.createQueryRunner();

    try {
      // 5. 외래키 존재 확인 (customer_id)
      const customerResult = await queryRunner.query(
        `SELECT "id" FROM CUSTOMER WHERE "id" = :customerId AND "deleted_at" IS NULL`,
        { customerId: customer_id }
      );
      if (customerResult.length === 0) {
        return NextResponse.json(
          { message: 'Customer not found' },
          { status: 404 }
        );
      }

      // 6. 담당자 존재 확인 및 MANAGER 부서 제약 검증
      let assignee = null;
      if (assigned_to_id) {
        const assigneeResult = await queryRunner.query(
          `SELECT "id", "department_id" FROM EMPLOYEE WHERE "id" = :assigneeId AND "deleted_at" IS NULL`,
          { assigneeId: assigned_to_id }
        );
        if (assigneeResult.length === 0) {
          return NextResponse.json(
            { message: 'Assignee employee not found' },
            { status: 404 }
          );
        }
        assignee = assigneeResult[0];

        // MANAGER는 다른 부서 직원에게 할당 불가
        if (userRole === 'MANAGER' && assignee.department_id !== userDepartmentId) {
          return NextResponse.json(
            {
              message:
                'MANAGER can only assign to employees in the same department',
            },
            { status: 400 }
          );
        }
      }

      // 7. Issue INSERT
      const now = new Date();

      // Get next ID from sequence - use uppercase for the result alias since table uses uppercase columns
      const seqResult = await queryRunner.query(
        `SELECT ISSUE_SEQ.NEXTVAL as ID FROM DUAL`
      );
      const issueId = seqResult[0]?.ID;

      if (!issueId) {
        return NextResponse.json(
          { message: 'Failed to generate issue ID' },
          { status: 500 }
        );
      }

      const insertSql = `
        INSERT INTO ISSUE (
          id, customer_id, title, severity, description, status,
          is_public, created_by_id, assigned_to_id,
          treatment_method, treatment_time_minutes, treatment_result,
          created_at, updated_at, deleted_at
        ) VALUES (
          :id, :customerId, :title, :severity, :description, :status,
          :isPublic, :createdById, :assignedToId,
          :treatmentMethod, :treatmentTimeMinutes, :treatmentResult,
          :createdAt, :updatedAt, :deletedAt
        )
      `;

      await queryRunner.query(insertSql, {
        id: issueId,
        customerId: customer_id,
        title,
        severity,
        description,
        status: 'INTAKE',
        isPublic: 0,
        createdById: userId,
        assignedToId: assigned_to_id || null,
        treatmentMethod: treatment_method || null,
        treatmentTimeMinutes: treatment_time_minutes || null,
        treatmentResult: treatment_result || null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });

      const createdAt = now;

      // 8. IssueHistory 첫 기록
      try {
        // Get next history ID from sequence
        const historySeqResult = await queryRunner.query(
          `SELECT ISSUE_HISTORY_SEQ.NEXTVAL as ID FROM DUAL`
        );
        const historyId = historySeqResult[0]?.ID;

        if (historyId) {
          await queryRunner.query(
            `INSERT INTO ISSUE_HISTORY (
              id, issue_id, change_type, old_value, new_value, changed_by_id, changed_at, remark
            ) VALUES (
              :id, :issueId, :changeType, :oldValue, :newValue, :changedById, :changedAt, :remark
            )`,
            {
              id: historyId,
              issueId,
              changeType: 'STATUS_CHANGE',
              oldValue: null,
              newValue: 'INTAKE',
              changedById: userId,
              changedAt: now,
              remark: 'Issue created',
            }
          );
        }
      } catch (historyError) {
        // ISSUE_HISTORY table might not exist yet - continue without it
        console.warn('ISSUE_HISTORY insert failed (table may not exist):', historyError);
      }

      // 9. 응답 반환
      return NextResponse.json<CreateIssueResponse>(
        {
          message: 'Issue created successfully',
          data: {
            id: issueId,
            customer_id,
            title,
            severity,
            status: 'INTAKE',
            is_public: 0,
            created_by_id: userId,
            assigned_to_id: assigned_to_id || null,
            created_at: createdAt,
          },
        },
        { status: 201 }
      );
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('POST /api/issues error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
