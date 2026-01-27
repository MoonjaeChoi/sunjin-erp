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
        c.id, c.name, c.code, c.classification, c.address, c.phone, c.email, c.memo,
        c.created_by_id as managerId, e.name as managerName,
        cb.name as createdByName, ub.name as updatedByName,
        c.created_at as createdAt, c.updated_at as updatedAt
      FROM CUSTOMER c
      LEFT JOIN EMPLOYEE e ON c.created_by_id = e.id
      LEFT JOIN EMPLOYEE cb ON c.created_by_id = cb.id
      LEFT JOIN EMPLOYEE ub ON c.updated_by_id = ub.id
      WHERE c.id = :id AND c.deleted_at IS NULL
    `;

    const result = await executeQuery(sql, { id });

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customer = result.rows[0];

    const response: CustomerDetailResponse = {
      id: customer.id,
      name: customer.name,
      code: customer.code,
      classification: customer.classification,
      address: customer.address,
      phone: customer.phone,
      email: customer.email,
      memo: customer.memo,
      managerId: customer.managerId || null,
      managerName: customer.managerName || 'Unknown',
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      createdByName: customer.createdByName || 'Unknown',
      updatedByName: customer.updatedByName || 'Unknown',
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
        c.id, c.name, c.code, c.classification, c.address, c.phone, c.email, c.memo,
        c.created_by_id as managerId, e.name as managerName,
        cb.name as createdByName, ub.name as updatedByName,
        c.created_at as createdAt, c.updated_at as updatedAt
      FROM CUSTOMER c
      LEFT JOIN EMPLOYEE e ON c.created_by_id = e.id
      LEFT JOIN EMPLOYEE cb ON c.created_by_id = cb.id
      LEFT JOIN EMPLOYEE ub ON c.updated_by_id = ub.id
      WHERE c.id = :id AND c.deleted_at IS NULL
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
      const response: CustomerDetailResponse = {
        id: currentCustomer.id,
        name: currentCustomer.name,
        code: currentCustomer.code,
        classification: currentCustomer.classification,
        address: currentCustomer.address,
        phone: currentCustomer.phone,
        email: currentCustomer.email,
        memo: currentCustomer.memo,
        managerId: currentCustomer.managerId,
        managerName: currentCustomer.managerName,
        createdAt: currentCustomer.createdAt,
        updatedAt: currentCustomer.updatedAt,
        createdByName: currentCustomer.createdByName,
        updatedByName: currentCustomer.updatedByName,
      };

      return NextResponse.json(
        { data: response, message: '업데이트할 내용이 없습니다.' },
        { status: 200 }
      );
    }

    updateColumns.push(`updated_by_id = :userId`);
    updateColumns.push(`updated_at = :now`);

    const updateSql = `
      UPDATE CUSTOMER
      SET ${updateColumns.join(', ')}
      WHERE id = :id
    `;

    await executeUpdate(updateSql, params);

    const changedFieldsJson: { [key: string]: any } = {};

    if (updateFields.address !== undefined) {
      changedFieldsJson.address = {
        before: currentCustomer.address,
        after: updateFields.address,
      };
    }

    if (updateFields.phone !== undefined) {
      changedFieldsJson.phone = {
        before: currentCustomer.phone,
        after: updateFields.phone,
      };
    }

    if (updateFields.email !== undefined) {
      changedFieldsJson.email = {
        before: currentCustomer.email,
        after: updateFields.email,
      };
    }

    if (updateFields.memo !== undefined) {
      changedFieldsJson.memo = {
        before: currentCustomer.memo,
        after: updateFields.memo,
      };
    }

    if (updateFields.classification !== undefined) {
      changedFieldsJson.classification = {
        before: currentCustomer.classification,
        after: updateFields.classification,
      };
    }

    if (Object.keys(changedFieldsJson).length > 0) {
      const historyInsertSql = `
        INSERT INTO CUSTOMER_HISTORY (
          customer_id, change_type, changed_fields, changed_by_id, changed_at
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

    const response: CustomerDetailResponse = {
      id: updatedCustomer.id,
      name: updatedCustomer.name,
      code: updatedCustomer.code,
      classification: updatedCustomer.classification,
      address: updatedCustomer.address,
      phone: updatedCustomer.phone,
      email: updatedCustomer.email,
      memo: updatedCustomer.memo,
      managerId: updatedCustomer.managerId,
      managerName: updatedCustomer.managerName,
      createdAt: updatedCustomer.createdAt,
      updatedAt: updatedCustomer.updatedAt,
      createdByName: updatedCustomer.createdByName,
      updatedByName: updatedCustomer.updatedByName,
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
      SELECT c.id, c.name, c.deleted_at
      FROM CUSTOMER c
      WHERE c.id = :id
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
    if (customer.deleted_at !== null) {
      return NextResponse.json(
        { error: 'This customer is already deleted' },
        { status: 400 }
      );
    }

    // 6. 의존성 검증 (프로젝트, 기술지원, 유지보수 계약)
    const projectCountSql = `
      SELECT COUNT(*) as count
      FROM PROJECT
      WHERE customer_id = :customerId AND deleted_at IS NULL
    `;
    const projectCountResult = await executeQuery(projectCountSql, {
      customerId: id,
    });
    const projects = parseInt((projectCountResult.rows[0]?.count) as any || '0', 10);

    const techSupportCountSql = `
      SELECT COUNT(*) as count
      FROM TECH_SUPPORT
      WHERE customer_id = :customerId AND deleted_at IS NULL
    `;
    const techSupportCountResult = await executeQuery(techSupportCountSql, {
      customerId: id,
    });
    const techSupports = parseInt((techSupportCountResult.rows[0]?.count) as any || '0', 10);

    const maintenanceCountSql = `
      SELECT COUNT(*) as count
      FROM MAINTENANCE_CONTRACT
      WHERE customer_id = :customerId AND deleted_at IS NULL
    `;
    const maintenanceCountResult = await executeQuery(maintenanceCountSql, {
      customerId: id,
    });
    const maintenanceContracts = parseInt((maintenanceCountResult.rows[0]?.count) as any || '0', 10);

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
      SET deleted_at = :now, updated_by_id = :userId, updated_at = :now
      WHERE id = :id
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
        customer_id, change_type, changed_fields, changed_by_id, changed_at
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
    return NextResponse.json(
      {
        message: '고객이 삭제되었습니다.',
        data: {
          id: customer.id,
          name: customer.name,
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
