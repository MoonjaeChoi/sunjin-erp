// Generated: 2026-01-27 23:45:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeUpdate, executeQuerySingle } from '@/lib/db-direct';

export const dynamic = 'force-dynamic';

interface UpdateCustomerRequest {
  address?: string;
  phone?: string;
  email?: string;
  memo?: string;
  classification?: 'RESELLER' | 'END_USER' | 'MAINTENANCE' | 'GENERAL';
}

interface CustomerDetailResponse {
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
  createdByName?: string;
  updatedByName?: string;
}

function sanitizeHtml(input: string): string {
  return input.replace(/[<>]/g, (ch) => (ch === '<' ? '&lt;' : '&gt;'));
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone: string): boolean {
  const phoneRegex = /^[0-9\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/[^\d]/g, '').length >= 10;
}

function validateUpdateCustomer(body: UpdateCustomerRequest): string[] {
  const errors: string[] = [];

  if (body.classification !== undefined) {
    const validClassifications = ['RESELLER', 'END_USER', 'MAINTENANCE', 'GENERAL'];
    if (!validClassifications.includes(body.classification)) {
      errors.push(`classification must be one of: ${validClassifications.join(', ')}`);
    }
  }

  if (body.address !== undefined && body.address.length > 500) {
    errors.push('address must be 500 chars or less');
  }

  if (body.phone !== undefined && body.phone && !validatePhone(body.phone)) {
    errors.push('phone format is invalid (required at least 10 digits)');
  }

  if (body.email !== undefined && body.email && !validateEmail(body.email)) {
    errors.push('email format is invalid');
  }

  if (body.memo !== undefined && body.memo && body.memo.length > 4000) {
    errors.push('memo must be 4000 chars or less');
  }

  return errors;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = Number(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    const sql = `
      SELECT
        c."id" as ID, c."name" as NAME, c.CODE, c.CLASSIFICATION, c.ADDRESS, c.PHONE, c.EMAIL, c.MEMO,
        c.CREATED_BY_ID as MANAGERID, e."name" as MANAGERNAME,
        cb."name" as CREATEDBYNAME, ub."name" as UPDATEDBYNAME,
        c."created_at" as CREATEDAT, c."updated_at" as UPDATEDAT
      FROM CUSTOMER c
      LEFT JOIN EMPLOYEE e ON c.CREATED_BY_ID = e."id"
      LEFT JOIN EMPLOYEE cb ON c.CREATED_BY_ID = cb."id"
      LEFT JOIN EMPLOYEE ub ON c.UPDATED_BY_ID = ub."id"
      WHERE c."id" = :id AND c."deleted_at" IS NULL
    `;

    const result = await executeQuery(sql, { id });

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customer = result.rows[0];

    // Oracle returns UPPERCASE column names for unquoted columns/aliases
    const response: CustomerDetailResponse = {
      id: customer.ID,
      name: customer.NAME,
      code: customer.CODE,
      classification: customer.CLASSIFICATION,
      address: customer.ADDRESS,
      phone: customer.PHONE,
      email: customer.EMAIL,
      memo: customer.MEMO,
      managerId: customer.MANAGERID || null,
      managerName: customer.MANAGERNAME || 'Unknown',
      createdAt: customer.CREATEDAT,
      updatedAt: customer.UPDATEDAT,
      createdByName: customer.CREATEDBYNAME || 'Unknown',
      updatedByName: customer.UPDATEDBYNAME || 'Unknown',
    };

    return NextResponse.json({ data: response }, { status: 200 });
  } catch (error) {
    console.error(`GET /api/customers/${id} error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as any;
  if (!['MANAGER', 'ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = Number(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  let body: UpdateCustomerRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const errors = validateUpdateCustomer(body);
  if (errors.length > 0) {
    return NextResponse.json(
      { error: 'Validation failed', details: errors },
      { status: 400 }
    );
  }

  try {
    const existingSql = `
      SELECT
        c."id" as ID, c."name" as NAME, c.CODE, c.CLASSIFICATION, c.ADDRESS, c.PHONE, c.EMAIL, c.MEMO,
        c.CREATED_BY_ID as MANAGERID, e."name" as MANAGERNAME,
        cb."name" as CREATEDBYNAME, ub."name" as UPDATEDBYNAME,
        c."created_at" as CREATEDAT, c."updated_at" as UPDATEDAT
      FROM CUSTOMER c
      LEFT JOIN EMPLOYEE e ON c.CREATED_BY_ID = e."id"
      LEFT JOIN EMPLOYEE cb ON c.CREATED_BY_ID = cb."id"
      LEFT JOIN EMPLOYEE ub ON c.UPDATED_BY_ID = ub."id"
      WHERE c."id" = :id AND c."deleted_at" IS NULL
    `;

    const customerResult = await executeQuery(existingSql, { id });

    if (!customerResult.rows || customerResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const currentCustomer = customerResult.rows[0];

    const updateFields: { [key: string]: any } = {};
    const updateColumns: string[] = [];
    const params: any = { id, userId: user.id };
    const now = new Date();
    params.now = now;

    if (body.address !== undefined) {
      const sanitized = body.address ? sanitizeHtml(body.address.trim()) : null;
      updateFields.address = sanitized;
      updateColumns.push(`address = :address`);
      params.address = sanitized;
    }

    if (body.phone !== undefined) {
      const sanitized = body.phone ? body.phone.trim() : null;
      updateFields.phone = sanitized;
      updateColumns.push(`phone = :phone`);
      params.phone = sanitized;
    }

    if (body.email !== undefined) {
      const sanitized = body.email ? body.email.trim() : null;
      updateFields.email = sanitized;
      updateColumns.push(`email = :email`);
      params.email = sanitized;
    }

    if (body.memo !== undefined) {
      const sanitized = body.memo ? sanitizeHtml(body.memo.trim()) : null;
      updateFields.memo = sanitized;
      updateColumns.push(`memo = :memo`);
      params.memo = sanitized;
    }

    if (body.classification !== undefined) {
      updateFields.classification = body.classification;
      updateColumns.push(`classification = :classification`);
      params.classification = body.classification;
    }

    if (updateColumns.length === 0) {
      // Oracle returns UPPERCASE column names for unquoted columns/aliases
      const response: CustomerDetailResponse = {
        id: currentCustomer.ID,
        name: currentCustomer.NAME,
        code: currentCustomer.CODE,
        classification: currentCustomer.CLASSIFICATION,
        address: currentCustomer.ADDRESS,
        phone: currentCustomer.PHONE,
        email: currentCustomer.EMAIL,
        memo: currentCustomer.MEMO,
        managerId: currentCustomer.MANAGERID,
        managerName: currentCustomer.MANAGERNAME,
        createdAt: currentCustomer.CREATEDAT,
        updatedAt: currentCustomer.UPDATEDAT,
        createdByName: currentCustomer.CREATEDBYNAME,
        updatedByName: currentCustomer.UPDATEDBYNAME,
      };

      return NextResponse.json(
        { data: response, message: '업데이트할 내용이 없습니다.' },
        { status: 200 }
      );
    }

    updateColumns.push(`UPDATED_BY_ID = :userId`);
    updateColumns.push(`"updated_at" = :now`);

    const updateSql = `
      UPDATE CUSTOMER
      SET ${updateColumns.join(', ')}
      WHERE "id" = :id
    `;

    await executeUpdate(updateSql, params);

    // Oracle returns UPPERCASE column names
    const changedFieldsJson: { [key: string]: any } = {};

    if (updateFields.address !== undefined) {
      changedFieldsJson.address = {
        before: currentCustomer.ADDRESS,
        after: updateFields.address,
      };
    }

    if (updateFields.phone !== undefined) {
      changedFieldsJson.phone = {
        before: currentCustomer.PHONE,
        after: updateFields.phone,
      };
    }

    if (updateFields.email !== undefined) {
      changedFieldsJson.email = {
        before: currentCustomer.EMAIL,
        after: updateFields.email,
      };
    }

    if (updateFields.memo !== undefined) {
      changedFieldsJson.memo = {
        before: currentCustomer.MEMO,
        after: updateFields.memo,
      };
    }

    if (updateFields.classification !== undefined) {
      changedFieldsJson.classification = {
        before: currentCustomer.CLASSIFICATION,
        after: updateFields.classification,
      };
    }

    if (Object.keys(changedFieldsJson).length > 0) {
      const historyInsertSql = `
        INSERT INTO CUSTOMER_HISTORY (
          CUSTOMER_ID, CHANGE_TYPE, CHANGED_FIELDS, CHANGED_BY_ID, CHANGED_AT
        ) VALUES (
          :customerId, :changeType, :changedFields, :userId, :now
        )
      `;

      await executeUpdate(historyInsertSql, {
        customerId: id,
        changeType: 'UPDATE',
        changedFields: JSON.stringify(changedFieldsJson),
        userId: user.id,
        now,
      });
    }

    const updatedCustomerResult = await executeQuery(existingSql, { id });
    const updatedCustomer = updatedCustomerResult.rows[0];

    // Oracle returns UPPERCASE column names for unquoted columns/aliases
    const response: CustomerDetailResponse = {
      id: updatedCustomer.ID,
      name: updatedCustomer.NAME,
      code: updatedCustomer.CODE,
      classification: updatedCustomer.CLASSIFICATION,
      address: updatedCustomer.ADDRESS,
      phone: updatedCustomer.PHONE,
      email: updatedCustomer.EMAIL,
      memo: updatedCustomer.MEMO,
      managerId: updatedCustomer.MANAGERID,
      managerName: updatedCustomer.MANAGERNAME,
      createdAt: updatedCustomer.CREATEDAT,
      updatedAt: updatedCustomer.UPDATEDAT,
      createdByName: updatedCustomer.CREATEDBYNAME,
      updatedByName: updatedCustomer.UPDATEDBYNAME,
    };

    return NextResponse.json(
      { data: response, message: '고객이 수정되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    console.error(`PUT /api/customers/${id} error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. 인증 체크 (ADMIN only)
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as any;
  if (user.role !== 'ADMIN') {
    return NextResponse.json(
      {
        error: 'Forbidden',
        details: 'Only ADMIN can delete customers',
      },
      { status: 403 }
    );
  }

  // 2. ID 파라미터 검증
  const id = Number(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  // 3. 요청 본문 파싱 (reason 옵션)
  let reason: string | undefined;
  try {
    const body = await request.json();
    reason = body.reason?.trim() || undefined;
  } catch {
    // JSON 파싱 실패는 무시 (reason은 선택사항)
  }

  try {
    // 4. 기존 고객 조회
    const existingSql = `
      SELECT c."id" as ID, c."name" as NAME, c."deleted_at" as DELETED_AT
      FROM CUSTOMER c
      WHERE c."id" = :id
    `;

    const customerResult = await executeQuery(existingSql, { id });

    if (!customerResult.rows || customerResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customer = customerResult.rows[0];

    // 5. 이미 삭제된 고객 확인
    // Oracle returns UPPERCASE column names for unquoted columns
    if (customer.DELETED_AT !== null) {
      return NextResponse.json(
        { error: 'This customer is already deleted' },
        { status: 400 }
      );
    }

    // 6. 의존성 검증 (프로젝트, 기술지원, 유지보수 계약)
    // Oracle returns UPPERCASE column names for unquoted aliases
    const projectCountSql = `
      SELECT COUNT(*) as COUNT
      FROM PROJECT
      WHERE CUSTOMER_ID = :customerId AND "deleted_at" IS NULL
    `;
    const projectCountResult = await executeQuery(projectCountSql, {
      customerId: id,
    });
    const projects = parseInt((projectCountResult.rows[0]?.COUNT) as any || '0', 10);

    const techSupportCountSql = `
      SELECT COUNT(*) as COUNT
      FROM TECH_SUPPORT
      WHERE CUSTOMER_ID = :customerId AND "deleted_at" IS NULL
    `;
    const techSupportCountResult = await executeQuery(techSupportCountSql, {
      customerId: id,
    });
    const techSupports = parseInt((techSupportCountResult.rows[0]?.COUNT) as any || '0', 10);

    const maintenanceCountSql = `
      SELECT COUNT(*) as COUNT
      FROM MAINTENANCE_CONTRACT
      WHERE CUSTOMER_ID = :customerId AND "deleted_at" IS NULL
    `;
    const maintenanceCountResult = await executeQuery(maintenanceCountSql, {
      customerId: id,
    });
    const maintenanceContracts = parseInt((maintenanceCountResult.rows[0]?.COUNT) as any || '0', 10);

    // 의존성이 하나라도 존재하면 삭제 불가
    if (projects > 0 || techSupports > 0 || maintenanceContracts > 0) {
      const details: { projects?: number; techSupports?: number; maintenanceContracts?: number } = {};
      if (projects > 0) details.projects = projects;
      if (techSupports > 0) details.techSupports = techSupports;
      if (maintenanceContracts > 0) details.maintenanceContracts = maintenanceContracts;

      return NextResponse.json(
        {
          error: 'Dependency Error',
          message: '이 고객과 관련된 업무가 존재하여 삭제할 수 없습니다.',
          details,
        },
        { status: 400 }
      );
    }

    // 7. 소프트 삭제 실행
    const now = new Date();
    const deleteSql = `
      UPDATE CUSTOMER
      SET "deleted_at" = :now, UPDATED_BY_ID = :userId, "updated_at" = :now
      WHERE "id" = :id
    `;

    await executeUpdate(deleteSql, {
      id,
      userId: user.id,
      now,
    });

    // 8. 이력 기록 (DELETE)
    const changedFieldsJson = {
      deleted_at: {
        before: null,
        after: now.toISOString(),
      },
      ...(reason && { reason: { before: null, after: reason } }),
    };

    const historyInsertSql = `
      INSERT INTO CUSTOMER_HISTORY (
        CUSTOMER_ID, CHANGE_TYPE, CHANGED_FIELDS, CHANGED_BY_ID, CHANGED_AT
      ) VALUES (
        :customerId, :changeType, :changedFields, :userId, :now
      )
    `;

    await executeUpdate(historyInsertSql, {
      customerId: id,
      changeType: 'DELETE',
      changedFields: JSON.stringify(changedFieldsJson),
      userId: user.id,
      now,
    });

    // 9. 응답 반환
    // Oracle returns UPPERCASE column names for unquoted columns
    return NextResponse.json(
      {
        message: '고객이 삭제되었습니다.',
        data: {
          id: customer.ID,
          name: customer.NAME,
          deletedAt: now.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`DELETE /api/customers/${id} error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
