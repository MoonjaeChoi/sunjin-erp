// Generated: 2026-01-24 23:30:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { IsNull } from 'typeorm';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';
import { Task } from '../../../../entities/Task';
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
    const ds = await getDataSource();
    const taskRepository = ds.getRepository(Task);

    const task = await taskRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });

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
    const ds = await getDataSource();
    const taskRepository = ds.getRepository(Task);

    const task = await taskRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // 권한: 본인 또는 ADMIN
    const user = session.user as any;
    if (user.role !== 'ADMIN' && task.employee_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // completed_at 자동 처리
    if (body.status === TaskStatus.DONE && task.status !== TaskStatus.DONE) {
      task.completed_at = new Date();
    } else if (body.status && body.status !== TaskStatus.DONE) {
      task.completed_at = null;
    }

    // 업데이트 필드 적용 (completed_at은 위에서 처리됨)
    const { ...updateFields } = body;
    if (updateFields.title) {
      updateFields.title = sanitizeHtml(updateFields.title.trim());
    }
    if (updateFields.task_date) {
      (task as any).task_date = new Date(updateFields.task_date);
      delete updateFields.task_date;
    }
    Object.assign(task, updateFields, { completed_at: task.completed_at });

    const updated = await taskRepository.save(task);
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
    const ds = await getDataSource();
    const taskRepository = ds.getRepository(Task);

    const task = await taskRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // 권한: 본인 또는 ADMIN
    const user = session.user as any;
    if (user.role !== 'ADMIN' && task.employee_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete
    await taskRepository.softDelete(task.id);
    return NextResponse.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('DELETE /api/tasks/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
