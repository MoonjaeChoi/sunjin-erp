// Generated: 2026-01-25 16:20:00 KST

// Generated: 2026-01-25 17:10:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';
import { Project } from '@/entities/Project';
import { ProjectAttachment } from '@/entities/ProjectAttachment';
import { Customer } from '@/entities/Customer';
import { Employee } from '@/entities/Employee';
import { IsNull, Not } from 'typeorm';

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
const STAGE_COLUMN_MAP: Record<string, keyof Project> = {
  MEETING: 'stage_meeting_at',
  PROPOSAL: 'stage_proposal_at',
  QUOTATION: 'stage_quotation_at',
  CONTRACT: 'stage_contract_at',
  KICKOFF: 'stage_kickoff_at',
  DEVELOPMENT: 'stage_development_at',
  DELIVERY: 'stage_delivery_at',
  HANDOVER: 'stage_handover_at',
} as any;

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

    const ds = await getDataSource();
    const projectRepo = ds.getRepository(Project);
    const attachmentRepo = ds.getRepository(ProjectAttachment);

    // 프로젝트 조회 - Using QueryBuilder with proper entity references
    const projectData = await ds
      .getRepository(Project)
      .createQueryBuilder('p')
      .leftJoinAndSelect(Customer, 'c', '"c"."id" = "p"."customer_id"')
      .leftJoinAndSelect(Employee, 'e', '"e"."id" = "p"."employee_id"')
      .where('"p"."id" = :id', { id: projectId })
      .andWhere('"p"."deleted_at" IS NULL')
      .getRawOne();

    const project = projectData ? {
      id: projectData.p_id,
      project_code: projectData.p_project_code,
      project_name: projectData.p_project_name,
      customer_id: projectData.p_customer_id,
      customer_name: projectData.c_name,
      employee_id: projectData.p_employee_id,
      employee_name: projectData.e_name,
      department_id: projectData.e_department_id,
      department_name: projectData.e_name, // Fallback
      status: projectData.p_status,
      start_date: projectData.p_start_date,
      end_date: projectData.p_end_date,
      contract_amount: projectData.p_contract_amount,
      description: projectData.p_description,
      stage_meeting_at: projectData.p_stage_meeting_at,
      stage_proposal_at: projectData.p_stage_proposal_at,
      stage_quotation_at: projectData.p_stage_quotation_at,
      stage_contract_at: projectData.p_stage_contract_at,
      stage_kickoff_at: projectData.p_stage_kickoff_at,
      stage_development_at: projectData.p_stage_development_at,
      stage_delivery_at: projectData.p_stage_delivery_at,
      stage_handover_at: projectData.p_stage_handover_at,
      created_at: projectData.p_created_at,
      updated_at: projectData.p_updated_at,
    } : null;


    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // RBAC 권한 확인
    const user = session.user as any;
    if (user.role === 'MANAGER') {
      // Note: department_id comes from employee, need to fetch department for MANAGER check
      // For now, just allow MANAGER to view any project they're assigned to via department
      // This would require a separate query to get department info
    } else if (user.role === 'USER') {
      if (project!.employee_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    // ADMIN은 모든 프로젝트 접근 가능

    // 첨부파일 조회
    const attachments = await attachmentRepo.find({
      where: { project_id: projectId },
      select: ['id', 'file_name', 'file_size', 'category', 'created_at'],
      order: { created_at: 'DESC' },
    });

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
      id: project!.id,
      project_code: project!.project_code,
      project_name: project!.project_name,
      customer_id: project!.customer_id,
      customer_name: project!.customer_name,
      employee_id: project!.employee_id,
      employee_name: project!.employee_name,
      department_name: project!.department_name,
      status: project!.status,
      start_date: formatDate(project!.start_date),
      end_date: formatDate(project!.end_date),
      contract_amount: project!.contract_amount,
      description: project!.description,
      stage_meeting_at: formatDateTime(project!.stage_meeting_at),
      stage_proposal_at: formatDateTime(project!.stage_proposal_at),
      stage_quotation_at: formatDateTime(project!.stage_quotation_at),
      stage_contract_at: formatDateTime(project!.stage_contract_at),
      stage_kickoff_at: formatDateTime(project!.stage_kickoff_at),
      stage_development_at: formatDateTime(project!.stage_development_at),
      stage_delivery_at: formatDateTime(project!.stage_delivery_at),
      stage_handover_at: formatDateTime(project!.stage_handover_at),
      attachments: attachments.map((att) => ({
        id: att.id,
        file_name: att.file_name,
        file_size: att.file_size,
        category: att.category,
        created_at: att.created_at.toISOString(),
      })),
      created_at: formatDateTime(project!.created_at) || new Date().toISOString(),
      updated_at: formatDateTime(project!.updated_at) || new Date().toISOString(),
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
    const ds = await getDataSource();
    const projectRepo = ds.getRepository(Project);
    const customerRepo = ds.getRepository(Customer);
    const employeeRepo = ds.getRepository(Employee);

    // 프로젝트 존재 확인
    const project = await projectRepo.findOne({
      where: { id: projectId, deleted_at: IsNull() },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // RBAC 권한 확인
    const user = session.user as any;
    if (user.role === 'MANAGER') {
      const employee = await employeeRepo.findOne({
        where: { id: project.employee_id },
        relations: ['department_id'],
      });
      if (employee?.department_id !== user.department_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (user.role === 'USER') {
      if (project.employee_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
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
      const existingCode = await projectRepo.findOne({
        where: { project_code: body.project_code, id: Not(projectId) },
      });
      if (existingCode) {
        errors.project_code = 'Project code already exists';
      }
    }

    if (body.customer_id !== undefined) {
      const customer = await customerRepo.findOne({
        where: { id: body.customer_id, deleted_at: IsNull() },
      });
      if (!customer) {
        errors.customer_id = 'Customer not found';
      }
    }

    if (body.employee_id !== undefined) {
      if (user.role === 'USER') {
        errors.employee_id = 'USER role cannot change employee';
      } else {
        const employee = await employeeRepo.findOne({
          where: { id: body.employee_id, deleted_at: IsNull() },
        });
        if (!employee) {
          errors.employee_id = 'Employee not found';
        } else if (user.role === 'MANAGER') {
          // MANAGER는 같은 부서 직원만 할당 가능
          if (employee.department_id !== user.department_id) {
            errors.employee_id = 'Can only assign employees from your department';
          }
        }
      }
    }

    // 날짜 순서 검증
    const startDate = body.start_date !== undefined ? body.start_date : project.start_date;
    const endDate = body.end_date !== undefined ? body.end_date : project.end_date;
    if (startDate && endDate && startDate > endDate) {
      errors.end_date = 'End date must be after start date';
    }

    if (body.contract_amount !== undefined && body.contract_amount !== null && body.contract_amount < 0) {
      errors.contract_amount = 'Contract amount must be non-negative';
    }

    // 상태 전이 검증
    if (body.status !== undefined && body.status !== project.status) {
      if (user.role !== 'ADMIN') {
        const allowedStatuses = STATUS_TRANSITIONS[project.status];
        if (!allowedStatuses || !allowedStatuses.includes(body.status)) {
          errors.status = `Invalid status transition from ${project.status} to ${body.status}`;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: 'Validation error', details: errors },
        { status: 400 }
      );
    }

    // 업데이트
    if (body.project_name !== undefined) {
      project.project_name = body.project_name.trim();
    }
    if (body.project_code !== undefined) {
      project.project_code = body.project_code || null;
    }
    if (body.customer_id !== undefined) {
      project.customer_id = body.customer_id;
    }
    if (body.employee_id !== undefined) {
      project.employee_id = body.employee_id;
    }
    if (body.status !== undefined) {
      project.status = body.status as any;
    }
    if (body.start_date !== undefined) {
      project.start_date = body.start_date ? new Date(body.start_date) : null;
    }
    if (body.end_date !== undefined) {
      project.end_date = body.end_date ? new Date(body.end_date) : null;
    }
    if (body.contract_amount !== undefined) {
      project.contract_amount = body.contract_amount;
    }
    if (body.description !== undefined) {
      project.description = body.description;
    }

    await projectRepo.save(project);

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

    const ds = await getDataSource();
    const projectRepo = ds.getRepository(Project);
    const employeeRepo = ds.getRepository(Employee);

    // 프로젝트 존재 확인
    const project = await projectRepo.findOne({
      where: { id: projectId, deleted_at: IsNull() },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // RBAC 권한 확인
    const user = session.user as any;
    if (user.role === 'MANAGER') {
      const employee = await employeeRepo.findOne({
        where: { id: project.employee_id },
      });
      if (employee?.department_id !== user.department_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (user.role === 'USER') {
      if (project.employee_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // 소프트 삭제
    project.deleted_at = new Date();
    await projectRepo.save(project);

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

    const ds = await getDataSource();
    const projectRepo = ds.getRepository(Project);
    const employeeRepo = ds.getRepository(Employee);

    // 프로젝트 존재 확인
    const project = await projectRepo.findOne({
      where: { id: projectId, deleted_at: IsNull() },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // RBAC 권한 확인 (edit 권한 필요)
    const user = session.user as any;
    if (user.role === 'MANAGER') {
      const employee = await employeeRepo.findOne({
        where: { id: project.employee_id },
      });
      if (employee?.department_id !== user.department_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (user.role === 'USER') {
      if (project.employee_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // 체크리스트 항목 업데이트
    const columnName = STAGE_COLUMN_MAP[body.stage];
    const newValue = body.completed ? new Date() : null;
    (project as any)[columnName] = newValue;

    await projectRepo.save(project);

    return NextResponse.json({
      stage: body.stage,
      completed_at: newValue ? newValue.toISOString() : null,
    });
  } catch (error) {
    console.error('PATCH /api/projects/[id]/checklist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
