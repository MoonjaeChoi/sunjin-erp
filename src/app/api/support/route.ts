// Generated: 2026-01-27 23:58:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeUpdate } from '@/lib/db-direct';
import { TechSupport, SupportType, SupportMethod } from '../../../entities/TechSupport';

export const dynamic = 'force-dynamic';

interface CreateSupportDto {
  title: string;
  customer_id: number;
  support_type: SupportType;
  support_date: string;
  support_method?: SupportMethod;
  start_time?: number;
  end_time?: number;
  description?: string;
}

const VALID_SUPPORT_TYPES: SupportType[] = ['INSTALL', 'TEST', 'TRAINING', 'MAINTENANCE', 'GENERAL'];
const VALID_SUPPORT_METHODS: SupportMethod[] = ['ONSITE', 'REMOTE', 'PHONE'];
const VALID_STATUSES = ['RECEIVED', 'IN_PROGRESS', 'COMPLETED'] as const;
const VALID_SORT_BY = ['support_date', 'title', 'status'] as const;
const VALID_PAGE_SIZES = [10, 20, 50] as const;
const MAX_DATE_RANGE_DAYS = 365;
const KEYWORD_MIN_LENGTH = 2;
const KEYWORD_MAX_LENGTH = 100;

function sanitizeHtml(input: string): string {
  return input.replace(/[<>]/g, (ch) => (ch === '<' ? '&lt;' : '&gt;'));
}

function validateCreateSupport(body: CreateSupportDto): string[] {
  const errors: string[] = [];
  if (!body.title || body.title.trim().length === 0) {
    errors.push('title is required');
  }
  if (body.title && body.title.length > 200) {
    errors.push('title must be 200 chars or less');
  }
  if (!body.customer_id || isNaN(Number(body.customer_id))) {
    errors.push('valid customer_id is required');
  }
  if (!body.support_type || !VALID_SUPPORT_TYPES.includes(body.support_type)) {
    errors.push('invalid support_type');
  }
  if (!body.support_date || isNaN(Date.parse(body.support_date))) {
    errors.push('valid support_date is required');
  }
  if (body.support_method && !VALID_SUPPORT_METHODS.includes(body.support_method)) {
    errors.push('invalid support_method');
  }
  if (body.start_time !== undefined && (body.start_time < 0 || body.start_time > 1439)) {
    errors.push('start_time must be 0~1439');
  }
  if (body.end_time !== undefined && (body.end_time < 0 || body.end_time > 1439)) {
    errors.push('end_time must be 0~1439');
  }
  if (
    body.start_time !== undefined &&
    body.end_time !== undefined &&
    body.start_time >= body.end_time
  ) {
    errors.push('start_time must be less than end_time');
  }
  return errors;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const customerId = searchParams.get('customer_id');
  const supportType = searchParams.get('support_type');
  const supportMethod = searchParams.get('support_method');
  const status = searchParams.get('status');
  const keyword = searchParams.get('keyword');
  const pageParam = searchParams.get('page');
  const pageSizeParam = searchParams.get('page_size');
  const sortByParam = searchParams.get('sort_by');
  const sortOrderParam = searchParams.get('sort_order');

  // 필수 파라미터 검증
  if (!dateFrom || !dateTo) {
    return NextResponse.json(
      { error: 'date_from and date_to are required' },
      { status: 400 }
    );
  }

  const dateFromParsed = new Date(dateFrom);
  const dateToParsed = new Date(dateTo);
  if (isNaN(dateFromParsed.getTime()) || isNaN(dateToParsed.getTime())) {
    return NextResponse.json(
      { error: 'Invalid date format. Use YYYY-MM-DD.' },
      { status: 400 }
    );
  }

  // 날짜 범위 검증 (최대 365일)
  const diffMs = dateToParsed.getTime() - dateFromParsed.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > MAX_DATE_RANGE_DAYS) {
    return NextResponse.json(
      { error: '검색 기간은 최대 1년입니다.' },
      { status: 400 }
    );
  }

  // enum 검증
  if (supportType && !VALID_SUPPORT_TYPES.includes(supportType as SupportType)) {
    return NextResponse.json(
      { error: `Invalid support_type. Must be one of: ${VALID_SUPPORT_TYPES.join(', ')}` },
      { status: 400 }
    );
  }
  if (supportMethod && !VALID_SUPPORT_METHODS.includes(supportMethod as SupportMethod)) {
    return NextResponse.json(
      { error: `Invalid support_method. Must be one of: ${VALID_SUPPORT_METHODS.join(', ')}` },
      { status: 400 }
    );
  }
  if (status && !VALID_STATUSES.includes(status as any)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  // keyword 검증
  if (keyword && keyword.length > KEYWORD_MAX_LENGTH) {
    return NextResponse.json(
      { error: `keyword must be ${KEYWORD_MAX_LENGTH} chars or less` },
      { status: 400 }
    );
  }

  // sort_by 검증
  if (sortByParam && !VALID_SORT_BY.includes(sortByParam as any)) {
    return NextResponse.json(
      { error: `Invalid sort_by. Must be one of: ${VALID_SORT_BY.join(', ')}` },
      { status: 400 }
    );
  }

  // sort_order 검증
  if (sortOrderParam && !['ASC', 'DESC'].includes(sortOrderParam.toUpperCase())) {
    return NextResponse.json(
      { error: 'Invalid sort_order. Must be ASC or DESC' },
      { status: 400 }
    );
  }

  // page / page_size 검증
  let page = 1;
  let pageSize = 20;
  if (pageParam) {
    page = Number(pageParam);
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: 'page must be a positive integer' },
        { status: 400 }
      );
    }
  }
  if (pageSizeParam) {
    pageSize = Number(pageSizeParam);
    if (!VALID_PAGE_SIZES.includes(pageSize as any)) {
      return NextResponse.json(
        { error: `Invalid page_size. Must be one of: ${VALID_PAGE_SIZES.join(', ')}` },
        { status: 400 }
      );
    }
  }

  try {
    const user = session.user as any;

    // 동적 WHERE 절 구성
    let whereClauses: string[] = ['"ts"."deleted_at" IS NULL', '"ts"."support_date" BETWEEN TO_DATE(:dateFrom, \'YYYY-MM-DD\') AND TO_DATE(:dateTo, \'YYYY-MM-DD\')'];
    const params: any = { dateFrom, dateTo };
    let paramIndex = 0;

    if (user.role !== 'ADMIN') {
      whereClauses.push(`"ts"."employee_id" = :userId${paramIndex}`);
      params[`userId${paramIndex}`] = user.id;
      paramIndex++;
    }

    if (customerId) {
      whereClauses.push(`"ts"."customer_id" = :customerId${paramIndex}`);
      params[`customerId${paramIndex}`] = Number(customerId);
      paramIndex++;
    }

    if (supportType) {
      whereClauses.push(`"ts"."support_type" = :supportType${paramIndex}`);
      params[`supportType${paramIndex}`] = supportType;
      paramIndex++;
    }

    if (supportMethod) {
      whereClauses.push(`"ts"."support_method" = :supportMethod${paramIndex}`);
      params[`supportMethod${paramIndex}`] = supportMethod;
      paramIndex++;
    }

    if (status) {
      whereClauses.push(`"ts"."status" = :status${paramIndex}`);
      params[`status${paramIndex}`] = status;
      paramIndex++;
    }

    if (keyword && keyword.length >= KEYWORD_MIN_LENGTH) {
      whereClauses.push(`"ts"."title" LIKE :keyword${paramIndex}`);
      params[`keyword${paramIndex}`] = `%${keyword}%`;
      paramIndex++;
    }

    const sortBy = (sortByParam || 'support_date') as typeof VALID_SORT_BY[number];
    const sortOrder = (sortOrderParam?.toUpperCase() || 'DESC') as 'ASC' | 'DESC';

    // Raw SQL 쿼리
    const sql = `SELECT "ts".*, "c"."name" AS customer_name
                 FROM TECH_SUPPORT "ts"
                 LEFT JOIN CUSTOMER "c" ON "c"."id" = "ts"."customer_id" AND "c"."deleted_at" IS NULL
                 WHERE ${whereClauses.join(' AND ')}
                 ORDER BY "ts"."${sortBy}" ${sortOrder}
                 OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`;

    // Total count 쿼리
    const countSql = `SELECT COUNT(*) as total
                      FROM TECH_SUPPORT "ts"
                      WHERE ${whereClauses.join(' AND ')}`;

    // Separate params for count query (no offset/pageSize) and data query
    const countParams = { ...params };
    const dataParams = { ...params, offset: (page - 1) * pageSize, pageSize };

    const [supports, countResult] = await Promise.all([
      executeQuery(sql, dataParams),
      executeQuery(countSql, countParams),
    ]);

    const total = parseInt(countResult[0]?.total || '0', 10);

    return NextResponse.json({ supports, total, page, page_size: pageSize });
  } catch (error) {
    console.error('GET /api/support error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: CreateSupportDto;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const errors = validateCreateSupport(body);
  if (errors.length > 0) {
    return NextResponse.json(
      { error: 'Validation failed', details: errors },
      { status: 400 }
    );
  }

  const sanitizedTitle = sanitizeHtml(body.title.trim());

  try {
    const user = session.user as any;
    const now = new Date();

    // 1. Customer 존재 확인
    const customerResult = await executeQuery(
      `SELECT "id" FROM CUSTOMER WHERE "id" = :customerId AND "deleted_at" IS NULL`,
      { customerId: body.customer_id }
    );

    if (customerResult.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // 2. Get next ID from sequence
    const seqResult = await executeQuery(
      `SELECT TECH_SUPPORT_ID_SEQ.NEXTVAL as "id" FROM DUAL`
    );
    const supportId = seqResult[0]?.id;

    if (!supportId) {
      return NextResponse.json(
        { error: 'Failed to generate ID' },
        { status: 500 }
      );
    }

    // 3. INSERT with explicit ID
    const insertSql = `
      INSERT INTO TECH_SUPPORT (
        "id", "title", "description", "support_date", "start_time", "end_time",
        "support_type", "support_method", "status", "employee_id", "customer_id",
        "created_at", "updated_at", "deleted_at"
      ) VALUES (
        :id, :title, :description, :supportDate, :startTime, :endTime,
        :supportType, :supportMethod, :status, :employeeId, :customerId,
        :createdAt, :updatedAt, :deletedAt
      )
    `;

    await executeUpdate(insertSql, {
      id: supportId,
      title: sanitizedTitle,
      description: body.description || null,
      supportDate: new Date(body.support_date),
      startTime: body.start_time ?? null,
      endTime: body.end_time ?? null,
      supportType: body.support_type,
      supportMethod: body.support_method ?? null,
      status: 'RECEIVED',
      employeeId: user.id,
      customerId: body.customer_id,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    return NextResponse.json(
      { message: 'Created successfully', id: supportId },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/support error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
