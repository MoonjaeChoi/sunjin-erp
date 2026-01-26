// Generated: 2026-01-27 23:15:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface CreateCustomerRequest {
  name: string;
  classification: 'RESELLER' | 'END_USER' | 'MAINTENANCE' | 'GENERAL';
  address?: string;
  phone?: string;
  email?: string;
  memo?: string;
}

interface CustomerResponse {
  id: number;
  name: string;
  code: string;
  classification: string;
  address?: string;
  phone?: string;
  email?: string;
  memo?: string;
  managerId: number;
  managerName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

interface CustomersListResponse {
  data: CustomerResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function sanitizeHtml(input: string): string {
  return input.replace(/[<>]/g, (ch) => (ch === '<' ? '&lt;' : '&gt;'));
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone: string): boolean {
  // 숫자, 하이픈, 괄호만 허용
  const phoneRegex = /^[0-9\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/[^\d]/g, '').length >= 10;
}

function validateCreateCustomer(body: CreateCustomerRequest): string[] {
  const errors: string[] = [];

  if (!body.name || body.name.trim().length === 0) {
    errors.push('name is required');
  }
  if (body.name && body.name.length > 200) {
    errors.push('name must be 200 chars or less');
  }

  const validClassifications = ['RESELLER', 'END_USER', 'MAINTENANCE', 'GENERAL'];
  if (!body.classification || !validClassifications.includes(body.classification)) {
    errors.push(`classification must be one of: ${validClassifications.join(', ')}`);
  }

  if (body.address && body.address.length > 500) {
    errors.push('address must be 500 chars or less');
  }

  if (body.phone && !validatePhone(body.phone)) {
    errors.push('phone format is invalid (required at least 10 digits)');
  }

  if (body.email && !validateEmail(body.email)) {
    errors.push('email format is invalid');
  }

  if (body.memo && body.memo.length > 4000) {
    errors.push('memo must be 4000 chars or less');
  }

  return errors;
}

export async function GET(request: NextRequest) {
  // 1. 인증 체크 (USER+)
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Query params 추출
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  const search = searchParams.get('search') || '';
  const classification = searchParams.getAll('classification');
  const managerId = searchParams.get('managerId');
  const includeDeleted = searchParams.get('includeDeleted') === 'true';
  const sortBy = searchParams.get('sortBy') || 'name';
  const sortOrder = (searchParams.get('sortOrder') || 'ASC').toUpperCase();

  // 3. Pagination 파라미터 검증
  let page = 1;
  let limit = 20;

  if (pageParam) {
    page = Math.max(1, parseInt(pageParam, 10) || 1);
  }
  if (limitParam) {
    limit = Math.min(100, Math.max(1, parseInt(limitParam, 10) || 20));
  }

  // 4. ADMIN만 deletedAt 포함 조회 가능
  const user = session.user as any;
  const showDeleted = includeDeleted && user.role === 'ADMIN';

  try {
    const ds = await getDataSource();
    const queryRunner = ds.createQueryRunner();

    try {
      // WHERE 조건 구성
      const whereClauses: string[] = [];

      // 삭제된 항목 필터링
      if (!showDeleted) {
        whereClauses.push('c.deleted_at IS NULL');
      }

      // 검색: name 또는 code
      if (search && search.trim().length > 0) {
        const searchTerm = `%${search.trim().toUpperCase()}%`;
        whereClauses.push(`(UPPER(c.name) LIKE :search OR UPPER(c.code) LIKE :search)`);
      }

      // 분류 필터
      if (classification && classification.length > 0) {
        const classificationPlaceholders = classification
          .map((_, idx) => `:classification${idx}`)
          .join(',');
        whereClauses.push(`c.classification IN (${classificationPlaceholders})`);
      }

      // 담당자 필터
      if (managerId) {
        const managerIdNum = parseInt(managerId, 10);
        if (!isNaN(managerIdNum)) {
          whereClauses.push('c.created_by_id = :managerId');
        }
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // 정렬 (보안: VALID_SORT_BY 검증)
      const VALID_SORT_BY = ['name', 'code', 'createdAt', 'updatedAt'];
      const validSortBy = VALID_SORT_BY.includes(sortBy) ? sortBy : 'name';
      const sortColumnMap: { [key: string]: string } = {
        name: 'c.name',
        code: 'c.code',
        createdAt: 'c.created_at',
        updatedAt: 'c.updated_at',
      };
      const sortColumn = sortColumnMap[validSortBy];
      const validSortOrder = ['ASC', 'DESC'].includes(sortOrder) ? sortOrder : 'ASC';

      const orderClause = `ORDER BY ${sortColumn} ${validSortOrder}`;

      // 쿼리 파라미터
      const params: any = {};
      if (search && search.trim().length > 0) {
        params.search = `%${search.trim().toUpperCase()}%`;
      }

      if (classification && classification.length > 0) {
        classification.forEach((cls, idx) => {
          params[`classification${idx}`] = cls;
        });
      }

      if (managerId) {
        const managerIdNum = parseInt(managerId, 10);
        if (!isNaN(managerIdNum)) {
          params.managerId = managerIdNum;
        }
      }

      // 총 개수 조회
      const countSql = `SELECT COUNT(*) as total FROM CUSTOMER c ${whereClause}`;
      const countResult = await queryRunner.query(countSql, params);
      const total = parseInt(countResult[0].total || '0', 10);
      const totalPages = Math.ceil(total / limit);

      // 목록 조회
      const offset = (page - 1) * limit;
      const dataSql = `
        SELECT
          c.id, c.name, c.code, c.classification, c.address, c.phone, c.email, c.memo,
          c.created_by_id as managerId, e.name as managerName,
          c.created_at as createdAt, c.updated_at as updatedAt, c.deleted_at as deletedAt
        FROM CUSTOMER c
        LEFT JOIN EMPLOYEE e ON c.created_by_id = e.id
        ${whereClause}
        ${orderClause}
        OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
      `;

      const customers = await queryRunner.query(dataSql, params);

      const response: CustomersListResponse = {
        data: customers.map((customer: any) => ({
          ...customer,
          managerId: customer.managerId || null,
          managerName: customer.managerName || 'Unknown',
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };

      return NextResponse.json(response, { status: 200 });
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('GET /api/customers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // 1. 인증 체크 (MANAGER+)
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as any;
  if (!['MANAGER', 'ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. 요청 본문 파싱
  let body: CreateCustomerRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  // 3. 검증
  const errors = validateCreateCustomer(body);
  if (errors.length > 0) {
    return NextResponse.json(
      { error: 'Validation failed', details: errors },
      { status: 400 }
    );
  }

  // 4. XSS 방지
  const sanitizedName = sanitizeHtml(body.name.trim());
  const sanitizedAddress = body.address ? sanitizeHtml(body.address.trim()) : null;
  const sanitizedPhone = body.phone ? body.phone.trim() : null;
  const sanitizedEmail = body.email ? body.email.trim() : null;
  const sanitizedMemo = body.memo ? sanitizeHtml(body.memo.trim()) : null;

  try {
    const ds = await getDataSource();
    const queryRunner = ds.createQueryRunner();

    try {
      // 5. 고유성 검증 (name 중복 체크, soft delete 제외)
      const existingSql = `
        SELECT id FROM CUSTOMER
        WHERE name = :name AND deleted_at IS NULL
      `;
      const existing = await queryRunner.query(existingSql, {
        name: sanitizedName,
      });

      if (existing && existing.length > 0) {
        return NextResponse.json(
          { error: 'Customer name already exists' },
          { status: 400 }
        );
      }

      // 6. 고객 코드 생성 (Sequence)
      const codeResult = await queryRunner.query(
        `SELECT 'CUST-' || LPAD(CUST_CODE_SEQ.NEXTVAL, 5, '0') as code FROM DUAL`
      );
      const customerCode = codeResult[0]?.code || 'CUST-00001';

      // 7. 고객 등록
      const now = new Date();
      const insertSql = `
        INSERT INTO CUSTOMER (
          name, code, classification, address, phone, email, memo,
          created_by_id, updated_by_id, created_at, updated_at
        ) VALUES (
          :name, :code, :classification, :address, :phone, :email, :memo,
          :userId, :userId, :now, :now
        )
        RETURNING id, name, code, classification, address, phone, email, memo,
                  created_by_id as managerId, created_at as createdAt, updated_at as updatedAt
      `;

      const result = await queryRunner.query(insertSql, {
        name: sanitizedName,
        code: customerCode,
        classification: body.classification,
        address: sanitizedAddress,
        phone: sanitizedPhone,
        email: sanitizedEmail,
        memo: sanitizedMemo,
        userId: user.id,
        now,
      });

      const newCustomer = result[0] || result;

      // 8. 이력 기록 (CREATE)
      const changedFieldsJson = {
        name: { before: null, after: sanitizedName },
        classification: { before: null, after: body.classification },
        ...(sanitizedAddress && { address: { before: null, after: sanitizedAddress } }),
        ...(sanitizedPhone && { phone: { before: null, after: sanitizedPhone } }),
        ...(sanitizedEmail && { email: { before: null, after: sanitizedEmail } }),
        ...(sanitizedMemo && { memo: { before: null, after: sanitizedMemo } }),
      };

      const historyInsertSql = `
        INSERT INTO CUSTOMER_HISTORY (
          customer_id, change_type, changed_fields, changed_by_id, changed_at
        ) VALUES (
          :customerId, :changeType, :changedFields, :userId, :now
        )
      `;

      await queryRunner.query(historyInsertSql, {
        customerId: newCustomer.id,
        changeType: 'CREATE',
        changedFields: JSON.stringify(changedFieldsJson),
        userId: user.id,
        now,
      });

      // 9. 응답 반환 (201 Created)
      return NextResponse.json(
        {
          data: {
            id: newCustomer.id,
            name: newCustomer.name,
            code: newCustomer.code,
            classification: newCustomer.classification,
            address: newCustomer.address,
            phone: newCustomer.phone,
            email: newCustomer.email,
            memo: newCustomer.memo,
            managerId: newCustomer.managerId,
            createdAt: newCustomer.createdAt,
            updatedAt: newCustomer.updatedAt,
          },
          message: '고객이 등록되었습니다.',
        },
        { status: 201 }
      );
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('POST /api/customers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
