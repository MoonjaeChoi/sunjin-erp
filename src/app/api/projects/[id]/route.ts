// Generated: 2026-01-28 00:00:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeUpdate, executeQuerySingle } from '@/lib/db-direct';

export const dynamic = 'force-dynamic';

interface UpdateProjectRequest {
  project_name?: string;
  project_code?: string;
  customer_id?: number;
  employee_id?: number;
  status?: string;
  start_date?: string | null;
  end_date?: string | null;
  contract_amount?: number | null;
  description?: string | null;
}

interface ProjectChecklistToggleRequest {
  stage: string;
  completed: boolean;
}

interface ProjectChecklistToggleResponse {
  stage: string;
  completed_at: string | null;
}

// ProjectStage to Database column name mapping
const STAGE_COLUMN_MAP: Record<string, string> = {
  MEETING: 'stage_meeting_at',
  PROPOSAL: 'stage_proposal_at',
  QUOTATION: 'stage_quotation_at',
  CONTRACT: 'stage_contract_at',
  KICKOFF: 'stage_kickoff_at',
  DEVELOPMENT: 'stage_development_at',
  DELIVERY: 'stage_delivery_at',
  HANDOVER: 'stage_handover_at',
};

interface ProjectDetailResponse {
  id: number;
  project_code: string | null;
  project_name: string;
  customer_id: number;
  customer_name: string;
  employee_id: number;
  employee_name: string;
  department_name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  contract_amount: number | null;
  description: string | null;
  stage_meeting_at: string | null;
  stage_proposal_at: string | null;
  stage_quotation_at: string | null;
  stage_contract_at: string | null;
  stage_kickoff_at: string | null;
  stage_development_at: string | null;
  stage_delivery_at: string | null;
  stage_handover_at: string | null;
  attachments: Array<{
    id: number;
    file_name: string;
    file_size: number;
    category: string;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  PREPARING: ['IN_PROGRESS', 'ON_HOLD'],
  IN_PROGRESS: ['PREPARING', 'COMPLETED', 'ON_HOLD'],
  COMPLETED: ['IN_PROGRESS', 'ON_HOLD'],
  ON_HOLD: ['PREPARING', 'IN_PROGRESS', 'COMPLETED'],
};

/**
 * GET /api/projects/[id]
 * 프로젝트 상세 조회 (체크리스트 + 첨부파일)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ProjectDetailResponse | { error: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = parseInt(params.id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // 프로젝트 조회
    const projectSql = `
      SELECT
        p.id, p.project_code, p.project_name, p.customer_id,
        c.name AS customer_name, p.employee_id, e.name AS employee_name,
        e.department_id, p.status, p.start_date, p.end_date,
        p.contract_amount, p.description,
        p.stage_meeting_at, p.stage_proposal_at, p.stage_quotation_at,
        p.stage_contract_at, p.stage_kickoff_at, p.stage_development_at,
        p.stage_delivery_at, p.stage_handover_at,
        p.created_at, p.updated_at
      FROM PROJECT p
      LEFT JOIN CUSTOMER c ON c.id = p.customer_id AND c.deleted_at IS NULL
      LEFT JOIN EMPLOYEE e ON e.id = p.employee_id AND e.deleted_at IS NULL
      WHERE p.id = :id AND p.deleted_at IS NULL
    `;

    const projectResult = await executeQuerySingle(projectSql, { id: projectId });

    if (!projectResult) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projectResult;

    // RBAC 권한 확인
    const user = session.user as any;
    if (user.role === 'MANAGER') {
      if (project.department_id !== user.department) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (user.role === 'USER') {
      if (project.employee_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    // ADMIN은 모든 프로젝트 접근 가능

    // 첨부파일 조회
    const attachmentsSql = `
      SELECT id, file_name, file_size, category, created_at
      FROM PROJECT_ATTACHMENT
      WHERE project_id = :projectId
      ORDER BY created_at DESC
    `;

    const attachmentsResult = await executeQuery(attachmentsSql, { projectId });

    // Helper to format dates consistently
    const formatDate = (date: any) => {
      if (!date) return null;
      if (typeof date === 'string') return date.split('T')[0];
      if (date instanceof Date) return date.toISOString().split('T')[0];
      return null;
    };

    const formatDateTime = (date: any) => {
      if (!date) return null;
      if (typeof date === 'string') return date;
      if (date instanceof Date) return date.toISOString();
      return null;
    };

    // 응답 포맷팅
    const response: ProjectDetailResponse = {
      id: project.id,
      project_code: project.project_code,
      project_name: project.project_name,
      customer_id: project.customer_id,
      customer_name: project.customer_name,
      employee_id: project.employee_id,
      employee_name: project.employee_name,
      department_name: project.department_id ? `DEPT_${project.department_id}` : 'Unknown',
      status: project.status,
      start_date: formatDate(project.start_date),
      end_date: formatDate(project.end_date),
      contract_amount: project.contract_amount,
      description: project.description,
      stage_meeting_at: formatDateTime(project.stage_meeting_at),
      stage_proposal_at: formatDateTime(project.stage_proposal_at),
      stage_quotation_at: formatDateTime(project.stage_quotation_at),
      stage_contract_at: formatDateTime(project.stage_contract_at),
      stage_kickoff_at: formatDateTime(project.stage_kickoff_at),
      stage_development_at: formatDateTime(project.stage_development_at),
      stage_delivery_at: formatDateTime(project.stage_delivery_at),
      stage_handover_at: formatDateTime(project.stage_handover_at),
      attachments: attachmentsResult.rows.map((att: any) => ({
        id: att.id,
        file_name: att.file_name,
        file_size: att.file_size,
        category: att.category,
        created_at: typeof att.created_at === 'string' ? att.created_at : att.created_at?.toISOString?.() || new Date().toISOString(),
      })),
      created_at: formatDateTime(project.created_at) || new Date().toISOString(),
      updated_at: formatDateTime(project.updated_at) || new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/projects/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/projects/[id]
 * 프로젝트 수정
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<{ success: boolean } | { error: string; details?: Record<string, string> }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = parseInt(params.id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const body: UpdateProjectRequest = await request.json();

    // 프로젝트 존재 확인
    const projectResult = await executeQuerySingle(
      'SELECT id, employee_id FROM PROJECT WHERE id = :id AND deleted_at IS NULL',
      { id: projectId }
    );

    if (!projectResult) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // RBAC 권한 확인
    const user = session.user as any;
    if (user.role === 'MANAGER') {
      const employeeResult = await executeQuerySingle(
        'SELECT department_id FROM EMPLOYEE WHERE id = :id',
        { id: projectResult.employee_id }
      );
      if (employeeResult?.department_id !== user.department) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (user.role === 'USER') {
      if (projectResult.employee_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // 프로젝트 현재 상태 조회 (검증에 필요)
    const currentProjectResult = await executeQuerySingle(
      'SELECT project_name, project_code, customer_id, employee_id, status, start_date, end_date, contract_amount FROM PROJECT WHERE id = :id',
      { id: projectId }
    );

    if (!currentProjectResult) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 필드별 검증
    const errors: Record<string, string> = {};

    if (body.project_name !== undefined) {
      if (!body.project_name || body.project_name.trim().length === 0) {
        errors.project_name = 'Project name cannot be empty';
      } else if (body.project_name.length > 200) {
        errors.project_name = 'Project name must not exceed 200 characters';
      }
    }

    if (body.project_code !== undefined && body.project_code) {
      const existingCode = await executeQuerySingle(
        'SELECT id FROM PROJECT WHERE project_code = :code AND id != :id',
        { code: body.project_code, id: projectId }
      );
      if (existingCode) {
        errors.project_code = 'Project code already exists';
      }
    }

    if (body.customer_id !== undefined) {
      const customerResult = await executeQuerySingle(
        'SELECT id FROM CUSTOMER WHERE id = :id AND deleted_at IS NULL',
        { id: body.customer_id }
      );
      if (!customerResult) {
        errors.customer_id = 'Customer not found';
      }
    }

    if (body.employee_id !== undefined) {
      if (user.role === 'USER') {
        errors.employee_id = 'USER role cannot change employee';
      } else {
        const employeeResult = await executeQuerySingle(
          'SELECT id, department_id FROM EMPLOYEE WHERE id = :id AND deleted_at IS NULL',
          { id: body.employee_id }
        );
        if (!employeeResult) {
          errors.employee_id = 'Employee not found';
        } else if (user.role === 'MANAGER') {
          if (employeeResult.department_id !== user.department) {
            errors.employee_id = 'Can only assign employees from your department';
          }
        }
      }
    }

    // 날짜 순서 검증
    const startDate = body.start_date !== undefined ? body.start_date : currentProjectResult.start_date;
    const endDate = body.end_date !== undefined ? body.end_date : currentProjectResult.end_date;
    if (startDate && endDate && startDate > endDate) {
      errors.end_date = 'End date must be after start date';
    }

    if (body.contract_amount !== undefined && body.contract_amount !== null && body.contract_amount < 0) {
      errors.contract_amount = 'Contract amount must be non-negative';
    }

    // 상태 전이 검증
    if (body.status !== undefined && body.status !== currentProjectResult.status) {
      if (user.role !== 'ADMIN') {
        const allowedStatuses = STATUS_TRANSITIONS[currentProjectResult.status];
        if (!allowedStatuses || !allowedStatuses.includes(body.status)) {
          errors.status = `Invalid status transition from ${currentProjectResult.status} to ${body.status}`;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: 'Validation error', details: errors },
        { status: 400 }
      );
    }

    // 업데이트 준비
    const updateColumns: string[] = [];
    const updateParams: any = { id: projectId };
    const now = new Date();
    updateParams.now = now;

    if (body.project_name !== undefined) {
      updateColumns.push('project_name = :projectName');
      updateParams.projectName = body.project_name.trim();
    }
    if (body.project_code !== undefined) {
      updateColumns.push('project_code = :projectCode');
      updateParams.projectCode = body.project_code || null;
    }
    if (body.customer_id !== undefined) {
      updateColumns.push('customer_id = :customerId');
      updateParams.customerId = body.customer_id;
    }
    if (body.employee_id !== undefined) {
      updateColumns.push('employee_id = :employeeId');
      updateParams.employeeId = body.employee_id;
    }
    if (body.status !== undefined) {
      updateColumns.push('status = :status');
      updateParams.status = body.status;
    }
    if (body.start_date !== undefined) {
      updateColumns.push('start_date = :startDate');
      updateParams.startDate = body.start_date ? new Date(body.start_date) : null;
    }
    if (body.end_date !== undefined) {
      updateColumns.push('end_date = :endDate');
      updateParams.endDate = body.end_date ? new Date(body.end_date) : null;
    }
    if (body.contract_amount !== undefined) {
      updateColumns.push('contract_amount = :contractAmount');
      updateParams.contractAmount = body.contract_amount;
    }
    if (body.description !== undefined) {
      updateColumns.push('description = :description');
      updateParams.description = body.description;
    }

    if (updateColumns.length > 0) {
      updateColumns.push('updated_at = :now');
      const updateSql = `UPDATE PROJECT SET ${updateColumns.join(', ')} WHERE id = :id`;
      await executeUpdate(updateSql, updateParams);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/projects/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/projects/[id]
 * 프로젝트 소프트 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<{ success: boolean } | { error: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = parseInt(params.id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // 프로젝트 존재 확인
    const projectResult = await executeQuerySingle(
      'SELECT id, employee_id FROM PROJECT WHERE id = :id AND deleted_at IS NULL',
      { id: projectId }
    );

    if (!projectResult) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // RBAC 권한 확인
    const user = session.user as any;
    if (user.role === 'MANAGER') {
      const employeeResult = await executeQuerySingle(
        'SELECT department_id FROM EMPLOYEE WHERE id = :id',
        { id: projectResult.employee_id }
      );
      if (employeeResult?.department_id !== user.department) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (user.role === 'USER') {
      if (projectResult.employee_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // 소프트 삭제
    const now = new Date();
    await executeUpdate(
      'UPDATE PROJECT SET deleted_at = :now WHERE id = :id',
      { id: projectId, now }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/projects/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/projects/[id]/checklist
 * 체크리스트 단계 토글 (stage_*_at 업데이트)
 * completed=true → stage_*_at = NOW()
 * completed=false → stage_*_at = NULL
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ProjectChecklistToggleResponse | { error: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = parseInt(params.id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const body: ProjectChecklistToggleRequest = await request.json();

    // stage 검증
    if (!body.stage || !STAGE_COLUMN_MAP[body.stage]) {
      return NextResponse.json({ error: 'Invalid stage' }, { status: 400 });
    }

    if (typeof body.completed !== 'boolean') {
      return NextResponse.json({ error: 'Invalid completed parameter' }, { status: 400 });
    }

    // 프로젝트 존재 확인
    const projectResult = await executeQuerySingle(
      'SELECT id, employee_id FROM PROJECT WHERE id = :id AND deleted_at IS NULL',
      { id: projectId }
    );

    if (!projectResult) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // RBAC 권한 확인 (edit 권한 필요)
    const user = session.user as any;
    if (user.role === 'MANAGER') {
      const employeeResult = await executeQuerySingle(
        'SELECT department_id FROM EMPLOYEE WHERE id = :id',
        { id: projectResult.employee_id }
      );
      if (employeeResult?.department_id !== user.department) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (user.role === 'USER') {
      if (projectResult.employee_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // 체크리스트 항목 업데이트
    const columnName = STAGE_COLUMN_MAP[body.stage];
    const newValue = body.completed ? new Date() : null;
    const now = new Date();

    const updateSql = `UPDATE PROJECT SET ${columnName} = :newValue, updated_at = :now WHERE id = :id`;
    await executeUpdate(updateSql, { newValue, now, id: projectId });

    return NextResponse.json({
      stage: body.stage,
      completed_at: newValue ? newValue.toISOString() : null,
    });
  } catch (error) {
    console.error('PATCH /api/projects/[id]/checklist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
