// Generated: 2026-01-25 06:00:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { IsNull } from 'typeorm';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';
import { TechSupport, SupportType, SupportMethod, SupportStatus } from '../../../../entities/TechSupport';
import { unlink } from 'fs/promises';
import path from 'path';

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
    const ds = await getDataSource();
    const repo = ds.getRepository(TechSupport);

    const queryBuilder = repo
      .createQueryBuilder('ts')
      .leftJoin('CUSTOMER', 'c', 'c.id = ts.customer_id AND c.deleted_at IS NULL')
      .addSelect(['c.name', 'c.category'])
      .where('ts.id = :id', { id })
      .andWhere('ts.deleted_at IS NULL');

    const raw = await queryBuilder.getRawAndEntities();
    const entity = raw.entities[0];

    if (!entity) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // RBAC: 본인 건 또는 ADMIN
    const user = session.user as any;
    if (user.role !== 'ADMIN' && entity.employee_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = {
      ...entity,
      customer_name: raw.raw[0]?.c_name || null,
      customer_category: raw.raw[0]?.c_category || null,
    };

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
    const ds = await getDataSource();
    const repo = ds.getRepository(TechSupport);

    const support = await repo.findOne({
      where: { id, deleted_at: IsNull() },
    });

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

    // completed_at 자동 처리
    if (body.status === 'COMPLETED' && support.status !== 'COMPLETED') {
      support.completed_at = new Date();
    } else if (body.status && body.status !== 'COMPLETED' && support.status === 'COMPLETED') {
      support.completed_at = null;
    }

    // 필드 업데이트
    if (body.title !== undefined) {
      support.title = sanitizeHtml(body.title.trim());
    }
    if (body.description !== undefined) {
      support.description = body.description || null;
    }
    if (body.support_date !== undefined) {
      support.support_date = new Date(body.support_date);
    }
    if (body.start_time !== undefined) {
      support.start_time = body.start_time;
    }
    if (body.end_time !== undefined) {
      support.end_time = body.end_time;
    }
    if (body.support_type !== undefined) {
      support.support_type = body.support_type;
    }
    if (body.support_method !== undefined) {
      support.support_method = body.support_method;
    }
    if (body.status !== undefined) {
      support.status = body.status;
    }
    if (body.customer_id !== undefined) {
      support.customer_id = body.customer_id;
    }
    // ADMIN만 담당자 변경 가능
    if (body.employee_id !== undefined && user.role === 'ADMIN') {
      support.employee_id = body.employee_id;
    }

    const updated = await repo.save(support);
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
    const ds = await getDataSource();
    const repo = ds.getRepository(TechSupport);

    const support = await repo.findOne({
      where: { id, deleted_at: IsNull() },
    });

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
    await repo.softDelete(support.id);
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('DELETE /api/support/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
