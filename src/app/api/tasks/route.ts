// Generated: 2026-01-27 23:45:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeUpdate } from '@/lib/db-direct';
import { TaskType, WorkType, TaskStatus } from '@/types/task';

export const dynamic = 'force-dynamic';

interface CreateTaskDto {
  title: string;
  description?: string;
  task_date: string;
  start_time?: number;
  end_time?: number;
  task_type: TaskType;
  work_type: WorkType;
  status?: TaskStatus;
  customer_id?: number;
}

function sanitizeHtml(input: string): string {
  return input.replace(/[<>]/g, (ch) => (ch === '<' ? '&lt;' : '&gt;'));
}

function validateCreateTask(body: CreateTaskDto): string[] {
  const errors: string[] = [];
  if (!body.title || body.title.trim().length === 0) {
    errors.push('title is required');
  }
  if (body.title && body.title.length > 200) {
    errors.push('title must be 200 chars or less');
  }
  if (!body.task_date || isNaN(Date.parse(body.task_date))) {
    errors.push('valid task_date is required');
  }
  if (!body.task_type || !Object.values(TaskType).includes(body.task_type)) {
    errors.push('invalid task_type');
  }
  if (!body.work_type || !Object.values(WorkType).includes(body.work_type)) {
    errors.push('invalid work_type');
  }
  if (body.status && !Object.values(TaskStatus).includes(body.status)) {
    errors.push('invalid status');
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

const VALID_SORT_BY = ['task_date', 'title', 'status'] as const;
const VALID_PAGE_SIZES = [10, 20, 50] as const;
const MAX_DATE_RANGE_DAYS = 365;
const KEYWORD_MIN_LENGTH = 2;
const KEYWORD_MAX_LENGTH = 100;

export async function GET(request: NextRequest) {
  // 1. 인증 체크
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Query params 추출
  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const employeeId = searchParams.get('employee_id');
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const workType = searchParams.get('work_type');
  const keyword = searchParams.get('keyword');
  const pageParam = searchParams.get('page');
  const pageSizeParam = searchParams.get('page_size');
  const sortByParam = searchParams.get('sort_by');
  const sortOrderParam = searchParams.get('sort_order');

  // 페이지네이션 모드 여부
  const isPaginationMode = pageParam !== null;

  // 3. 필수 파라미터 검증
  if (!dateFrom || !dateTo) {
    return NextResponse.json(
      { error: 'date_from and date_to are required' },
      { status: 400 }
    );
  }

  // 날짜 형식 검증
  const dateFromParsed = new Date(dateFrom);
  const dateToParsed = new Date(dateTo);
  if (isNaN(dateFromParsed.getTime()) || isNaN(dateToParsed.getTime())) {
    return NextResponse.json(
      { error: 'Invalid date format. Use ISO date string.' },
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

  // type enum 검증
  if (type && !Object.values(TaskType).includes(type as TaskType)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${Object.values(TaskType).join(', ')}` },
      { status: 400 }
    );
  }

  // status enum 검증
  if (status && !Object.values(TaskStatus).includes(status as TaskStatus)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${Object.values(TaskStatus).join(', ')}` },
      { status: 400 }
    );
  }

  // work_type enum 검증
  if (workType && !Object.values(WorkType).includes(workType as WorkType)) {
    return NextResponse.json(
      { error: `Invalid work_type. Must be one of: ${Object.values(WorkType).join(', ')}` },
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
  if (isPaginationMode) {
    page = Number(pageParam);
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: 'page must be a positive integer' },
        { status: 400 }
      );
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
  }

  try {
    // 4. RBAC 필터링을 위한 사용자 정보
    const user = session.user as any;

    // 5. 동적 쿼리 빌드
    let whereClauses: string[] = ['"deleted_at" IS NULL'];
    whereClauses.push(`"task_date" BETWEEN TO_DATE(:dateFrom, 'YYYY-MM-DD') AND TO_DATE(:dateTo, 'YYYY-MM-DD')`);

    // RBAC 필터링
    if (user.role === 'USER' || user.role === 'MANAGER') {
      whereClauses.push(`"employee_id" = :userId`);
    }
    // ADMIN: no additional filtering

    // 선택 필터
    if (employeeId) {
      whereClauses.push(`"employee_id" = :employeeId`);
    }
    if (type) {
      whereClauses.push(`"task_type" = :type`);
    }
    if (status) {
      whereClauses.push(`"status" = :status`);
    }
    if (workType) {
      whereClauses.push(`"work_type" = :workType`);
    }
    if (keyword && keyword.length >= KEYWORD_MIN_LENGTH) {
      whereClauses.push(`"title" LIKE :keyword`);
    }

    const whereClause = whereClauses.join(' AND ');

    // 정렬
    let orderClause = '';
    if (isPaginationMode) {
      const sortBy = (sortByParam || 'task_date') as typeof VALID_SORT_BY[number];
      const sortOrder = (sortOrderParam?.toUpperCase() || 'DESC') as 'ASC' | 'DESC';
      orderClause = ` ORDER BY "${sortBy}" ${sortOrder}`;
    } else {
      orderClause = ' ORDER BY "task_date" ASC, "start_time" ASC';
    }

    // 쿼리 매개변수
    const params: any = {
      dateFrom,
      dateTo,
    };

    if (user.role === 'USER' || user.role === 'MANAGER') {
      params.userId = user.id;
    }
    if (employeeId) {
      params.employeeId = Number(employeeId);
    }
    if (type) {
      params.type = type;
    }
    if (status) {
      params.status = status;
    }
    if (workType) {
      params.workType = workType;
    }
    if (keyword && keyword.length >= KEYWORD_MIN_LENGTH) {
      params.keyword = `%${keyword}%`;
    }

    // 전체 개수 쿼리
    const countSql = `SELECT COUNT(*) as "total" FROM TASK WHERE ${whereClause}`;
    const countResult = await executeQuery(countSql, params);
    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    // 데이터 쿼리
    let dataSql = `SELECT * FROM TASK WHERE ${whereClause}${orderClause}`;

    if (isPaginationMode) {
      const offset = (page - 1) * pageSize;
      dataSql += ` OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
    }

    const tasksResult = await executeQuery(dataSql, params);
    const tasks = tasksResult.rows;

    // 응답 분기
    if (isPaginationMode) {
      return NextResponse.json({ tasks, total, page, page_size: pageSize });
    }
    return NextResponse.json({ tasks, total });
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // 1. 인증 체크
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: CreateTaskDto;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  // 2. 검증
  const errors = validateCreateTask(body);
  if (errors.length > 0) {
    return NextResponse.json(
      { error: 'Validation failed', details: errors },
      { status: 400 }
    );
  }

  // 3. XSS sanitize
  const sanitizedTitle = sanitizeHtml(body.title.trim());

  try {
    // 4. DB 저장 (Raw SQL)
    const user = session.user as any;
    const taskDate = new Date(body.task_date);
    const completedAt = body.status === TaskStatus.DONE ? new Date() : null;
    const now = new Date();

    const sql = `
      INSERT INTO TASK (
        "title", "description", "task_date", "start_time", "end_time",
        "task_type", "work_type", "status", "employee_id", "customer_id",
        "completed_at", "created_at", "updated_at"
      ) VALUES (
        :title, :description, :taskDate, :startTime, :endTime,
        :taskType, :workType, :status, :employeeId, :customerId,
        :completedAt, :createdAt, :updatedAt
      )
    `;

    await executeUpdate(sql, {
      title: sanitizedTitle,
      description: body.description || null,
      taskDate,
      startTime: body.start_time ?? null,
      endTime: body.end_time ?? null,
      taskType: body.task_type,
      workType: body.work_type,
      status: body.status || TaskStatus.READY,
      employeeId: user.id,
      customerId: body.customer_id ?? null,
      completedAt,
      createdAt: now,
      updatedAt: now,
    });

    // Return created task data (just the input data)
    const saved = {
      title: sanitizedTitle,
      description: body.description || null,
      task_date: taskDate,
      start_time: body.start_time ?? null,
      end_time: body.end_time ?? null,
      task_type: body.task_type,
      work_type: body.work_type,
      status: body.status || TaskStatus.READY,
      employee_id: user.id,
      customer_id: body.customer_id ?? null,
      completed_at: completedAt,
      created_at: now,
      updated_at: now,
    };

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
