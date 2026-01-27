// Generated: 2026-01-27 23:50:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeUpdate, executeQuerySingle } from '@/lib/db-direct';
import { unlink } from 'fs/promises';
import path from 'path';

type SupportType = 'INSTALL' | 'TEST' | 'TRAINING' | 'MAINTENANCE' | 'GENERAL';
type SupportMethod = 'ONSITE' | 'REMOTE' | 'PHONE';
type SupportStatus = 'RECEIVED' | 'IN_PROGRESS' | 'COMPLETED';

export const dynamic = 'force-dynamic';

interface UpdateSupportDto {
  title?: string;
  description?: string;
  support_date?: string;
  start_time?: number | null;
  end_time?: number | null;
  support_type?: SupportType;
  support_method?: SupportMethod | null;
  status?: SupportStatus;
  customer_id?: number;
  employee_id?: number;
}

const VALID_SUPPORT_TYPES: SupportType[] = ['INSTALL', 'TEST', 'TRAINING', 'MAINTENANCE', 'GENERAL'];
const VALID_SUPPORT_METHODS: SupportMethod[] = ['ONSITE', 'REMOTE', 'PHONE'];
const VALID_STATUSES: SupportStatus[] = ['RECEIVED', 'IN_PROGRESS', 'COMPLETED'];

const STATUS_TRANSITIONS: Record<SupportStatus, SupportStatus[]> = {
  RECEIVED: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: ['IN_PROGRESS'],
};

function isValidTransition(from: SupportStatus, to: SupportStatus, role: string): boolean {
  if (role === 'ADMIN') return true;
  if (from === to) return true;
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

function sanitizeHtml(input: string): string {
  return input.replace(/[<>]/g, (ch) => (ch === '<' ? '&lt;' : '&gt;'));
}

function validateUpdateSupport(body: UpdateSupportDto): string[] {
  const errors: string[] = [];
  if (body.title !== undefined) {
    if (body.title.trim().length === 0) errors.push('title cannot be empty');
    if (body.title.length > 200) errors.push('title must be 200 chars or less');
  }
  if (body.support_date !== undefined && isNaN(Date.parse(body.support_date))) {
    errors.push('invalid support_date format');
  }
  if (body.support_type !== undefined && !VALID_SUPPORT_TYPES.includes(body.support_type)) {
    errors.push('invalid support_type');
  }
  if (body.support_method !== undefined && body.support_method !== null && !VALID_SUPPORT_METHODS.includes(body.support_method)) {
    errors.push('invalid support_method');
  }
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    errors.push('invalid status');
  }
  if (body.start_time !== undefined && body.start_time !== null) {
    if (body.start_time < 0 || body.start_time > 1439) {
      errors.push('start_time must be 0~1439');
    }
  }
  if (body.end_time !== undefined && body.end_time !== null) {
    if (body.end_time < 0 || body.end_time > 1439) {
      errors.push('end_time must be 0~1439');
    }
  }
  if (
    body.start_time !== undefined &&
    body.start_time !== null &&
    body.end_time !== undefined &&
    body.end_time !== null &&
    body.start_time >= body.end_time
  ) {
    errors.push('start_time must be less than end_time');
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
        ts.id, ts.title, ts.description, ts.support_date, ts.start_time, ts.end_time,
        ts.support_type, ts.support_method, ts.status, ts.completed_at,
        ts.customer_id, ts.employee_id, ts.attachment_path,
        ts.created_by_id, ts.updated_by_id, ts.created_at, ts.updated_at, ts.deleted_at,
        c.name as customer_name, c.classification as customer_category
      FROM TECH_SUPPORT ts
      LEFT JOIN CUSTOMER c ON c.id = ts.customer_id AND c.deleted_at IS NULL
      WHERE ts.id = :id AND ts.deleted_at IS NULL
    `;

    const result = await executeQuerySingle(sql, { id });

    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // RBAC: 본인 건 또는 ADMIN
    const user = session.user as any;
    if (user.role !== 'ADMIN' && result.employee_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/support/[id] error:', error);
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

  const id = Number(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  let body: UpdateSupportDto;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const errors = validateUpdateSupport(body);
  if (errors.length > 0) {
    return NextResponse.json(
      { error: 'Validation failed', details: errors },
      { status: 400 }
    );
  }

  try {
    const getSql = `
      SELECT
        id, title, description, support_date, start_time, end_time,
        support_type, support_method, status, completed_at,
        customer_id, employee_id, attachment_path,
        created_by_id, updated_by_id, created_at, updated_at, deleted_at
      FROM TECH_SUPPORT
      WHERE id = :id AND deleted_at IS NULL
    `;

    const support = await executeQuerySingle(getSql, { id });

    if (!support) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const user = session.user as any;

    // RBAC: 본인 건만 수정 (ADMIN은 담당자 변경도 가능)
    if (user.role !== 'ADMIN' && support.employee_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 상태 전이 검증
    if (body.status && body.status !== support.status) {
      if (!isValidTransition(support.status, body.status, user.role)) {
        return NextResponse.json(
          { error: 'Invalid status transition' },
          { status: 400 }
        );
      }
    }

    // Build update parameters
    const updateColumns: string[] = [];
    const params: any = { id };
    const now = new Date();
    params.updatedAt = now;
    params.updatedById = user.id;

    updateColumns.push('updated_at = :updatedAt');
    updateColumns.push('updated_by_id = :updatedById');

    if (body.title !== undefined) {
      params.title = sanitizeHtml(body.title.trim());
      updateColumns.push('title = :title');
    }

    if (body.description !== undefined) {
      params.description = body.description || null;
      updateColumns.push('description = :description');
    }

    if (body.support_date !== undefined) {
      params.supportDate = new Date(body.support_date);
      updateColumns.push('support_date = :supportDate');
    }

    if (body.start_time !== undefined) {
      params.startTime = body.start_time;
      updateColumns.push('start_time = :startTime');
    }

    if (body.end_time !== undefined) {
      params.endTime = body.end_time;
      updateColumns.push('end_time = :endTime');
    }

    if (body.support_type !== undefined) {
      params.supportType = body.support_type;
      updateColumns.push('support_type = :supportType');
    }

    if (body.support_method !== undefined) {
      params.supportMethod = body.support_method;
      updateColumns.push('support_method = :supportMethod');
    }

    if (body.status !== undefined) {
      params.status = body.status;
      updateColumns.push('status = :status');

      // completed_at 자동 처리
      if (body.status === 'COMPLETED' && support.status !== 'COMPLETED') {
        params.completedAt = now;
        updateColumns.push('completed_at = :completedAt');
      } else if (body.status !== 'COMPLETED' && support.status === 'COMPLETED') {
        updateColumns.push('completed_at = NULL');
      }
    }

    if (body.customer_id !== undefined) {
      params.customerId = body.customer_id;
      updateColumns.push('customer_id = :customerId');
    }

    // ADMIN만 담당자 변경 가능
    if (body.employee_id !== undefined && user.role === 'ADMIN') {
      params.employeeId = body.employee_id;
      updateColumns.push('employee_id = :employeeId');
    }

    if (updateColumns.length > 2) {
      const updateSql = `
        UPDATE TECH_SUPPORT
        SET ${updateColumns.join(', ')}
        WHERE id = :id
      `;

      await executeUpdate(updateSql, params);
    }

    // Fetch updated record
    const updated = await executeQuerySingle(getSql, { id });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/support/[id] error:', error);
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
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = Number(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    const getSql = `
      SELECT
        id, title, description, support_date, start_time, end_time,
        support_type, support_method, status, completed_at,
        customer_id, employee_id, attachment_path,
        created_by_id, updated_by_id, created_at, updated_at, deleted_at
      FROM TECH_SUPPORT
      WHERE id = :id AND deleted_at IS NULL
    `;

    const support = await executeQuerySingle(getSql, { id });

    if (!support) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // RBAC: 본인 건 또는 ADMIN
    const user = session.user as any;
    if (user.role !== 'ADMIN' && support.employee_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 첨부 파일 물리 삭제
    if (support.attachment_path) {
      try {
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        const filePath = path.resolve(uploadDir, support.attachment_path);
        await unlink(filePath);
      } catch {
        // 파일이 이미 없는 경우 무시
      }
    }

    // Soft delete
    const now = new Date();
    const deleteSql = `
      UPDATE TECH_SUPPORT
      SET deleted_at = :now, updated_by_id = :userId, updated_at = :now
      WHERE id = :id
    `;

    await executeUpdate(deleteSql, {
      id,
      now,
      userId: user.id,
    });

    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('DELETE /api/support/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
