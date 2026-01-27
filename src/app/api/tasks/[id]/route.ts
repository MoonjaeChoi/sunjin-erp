// Generated: 2026-01-27 23:55:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeUpdate, executeQuerySingle } from '@/lib/db-direct';
import { TaskType, WorkType, TaskStatus } from '@/types/task';

export const dynamic = 'force-dynamic';

interface UpdateTaskDto {
  title?: string;
  description?: string;
  task_date?: string;
  start_time?: number | null;
  end_time?: number | null;
  task_type?: TaskType;
  work_type?: WorkType;
  status?: TaskStatus;
  customer_id?: number | null;
}

function sanitizeHtml(input: string): string {
  return input.replace(/[<>]/g, (ch) => (ch === '<' ? '&lt;' : '&gt;'));
}

function validateUpdateTask(body: UpdateTaskDto): string[] {
  const errors: string[] = [];
  if (body.title !== undefined) {
    if (body.title.trim().length === 0) errors.push('title cannot be empty');
    if (body.title.length > 200) errors.push('title must be 200 chars or less');
  }
  if (body.task_date !== undefined && isNaN(Date.parse(body.task_date))) {
    errors.push('invalid task_date format');
  }
  if (body.task_type !== undefined && !Object.values(TaskType).includes(body.task_type)) {
    errors.push('invalid task_type');
  }
  if (body.work_type !== undefined && !Object.values(WorkType).includes(body.work_type)) {
    errors.push('invalid work_type');
  }
  if (body.status !== undefined && !Object.values(TaskStatus).includes(body.status)) {
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
        id, title, description, task_date, start_time, end_time,
        task_type, work_type, status, completed_at,
        customer_id, employee_id,
        created_by_id, updated_by_id, created_at, updated_at, deleted_at
      FROM TASK
      WHERE id = :id AND deleted_at IS NULL
    `;

    const task = await executeQuerySingle(sql, { id });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // 권한 확인: USER는 본인 업무만
    const user = session.user as any;
    if (user.role === 'USER' && task.employee_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('GET /api/tasks/[id] error:', error);
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

  let body: UpdateTaskDto;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // 검증
  const errors = validateUpdateTask(body);
  if (errors.length > 0) {
    return NextResponse.json(
      { error: 'Validation failed', details: errors },
      { status: 400 }
    );
  }

  try {
    const getSql = `
      SELECT
        id, title, description, task_date, start_time, end_time,
        task_type, work_type, status, completed_at,
        customer_id, employee_id,
        created_by_id, updated_by_id, created_at, updated_at, deleted_at
      FROM TASK
      WHERE id = :id AND deleted_at IS NULL
    `;

    const task = await executeQuerySingle(getSql, { id });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // 권한: 본인 또는 ADMIN
    const user = session.user as any;
    if (user.role !== 'ADMIN' && task.employee_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    if (body.task_date !== undefined) {
      params.taskDate = new Date(body.task_date);
      updateColumns.push('task_date = :taskDate');
    }

    if (body.start_time !== undefined) {
      params.startTime = body.start_time;
      updateColumns.push('start_time = :startTime');
    }

    if (body.end_time !== undefined) {
      params.endTime = body.end_time;
      updateColumns.push('end_time = :endTime');
    }

    if (body.task_type !== undefined) {
      params.taskType = body.task_type;
      updateColumns.push('task_type = :taskType');
    }

    if (body.work_type !== undefined) {
      params.workType = body.work_type;
      updateColumns.push('work_type = :workType');
    }

    if (body.status !== undefined) {
      params.status = body.status;
      updateColumns.push('status = :status');

      // completed_at 자동 처리
      if (body.status === TaskStatus.DONE && task.status !== TaskStatus.DONE) {
        params.completedAt = now;
        updateColumns.push('completed_at = :completedAt');
      } else if (body.status !== TaskStatus.DONE && task.status === TaskStatus.DONE) {
        updateColumns.push('completed_at = NULL');
      }
    }

    if (body.customer_id !== undefined) {
      params.customerId = body.customer_id;
      updateColumns.push('customer_id = :customerId');
    }

    if (updateColumns.length > 2) {
      const updateSql = `
        UPDATE TASK
        SET ${updateColumns.join(', ')}
        WHERE id = :id
      `;

      await executeUpdate(updateSql, params);
    }

    // Fetch updated record
    const updated = await executeQuerySingle(getSql, { id });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/tasks/[id] error:', error);
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
        id, title, description, task_date, start_time, end_time,
        task_type, work_type, status, completed_at,
        customer_id, employee_id,
        created_by_id, updated_by_id, created_at, updated_at, deleted_at
      FROM TASK
      WHERE id = :id AND deleted_at IS NULL
    `;

    const task = await executeQuerySingle(getSql, { id });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // 권한: 본인 또는 ADMIN
    const user = session.user as any;
    if (user.role !== 'ADMIN' && task.employee_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete
    const now = new Date();
    const deleteSql = `
      UPDATE TASK
      SET deleted_at = :now, updated_by_id = :userId, updated_at = :now
      WHERE id = :id
    `;

    await executeUpdate(deleteSql, {
      id,
      now,
      userId: user.id,
    });

    return NextResponse.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('DELETE /api/tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
