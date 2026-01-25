// Generated: 2026-01-25 18:55:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';
import { Issue } from '@/entities/Issue';
import { IssueAttachment } from '@/entities/IssueAttachment';
import { IssueHistory } from '@/entities/IssueHistory';
import { Employee } from '@/entities/Employee';
import { IsNull } from 'typeorm';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

interface IssueDetailResponse {
  data: {
    id: number;
    customer_id: number;
    customer: {
      id: number;
      name: string;
    } | null;
    title: string;
    description: string;
    severity: string;
    status: string;
    is_public: number;
    created_by_id: number;
    created_by: {
      id: number;
      name: string;
    } | null;
    assigned_to_id: number | null;
    assigned_to: {
      id: number;
      name: string;
      department_id: number | null;
    } | null;
    treatment_method: string | null;
    treatment_time_minutes: number | null;
    treatment_result: string | null;
    created_at: Date;
    completed_at: Date | null;
    updated_at: Date;
    attachments: Array<{
      id: number;
      file_name: string;
      file_path: string;
      file_size: number;
      uploaded_by_id: number;
      uploaded_by_name: string | null;
      created_at: Date;
    }>;
    histories: Array<{
      id: number;
      change_type: string;
      old_value: string | null;
      new_value: string | null;
      changed_by_id: number;
      changed_by_name: string | null;
      changed_at: Date;
      remark: string | null;
    }>;
  };
}

export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    // 1. 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = session.user as any;
    const userId = user.id;
    const userRole = user.role;
    const userDepartmentId = user.department_id;

    // 2. ID 검증
    const issueId = parseInt(params.id, 10);
    if (isNaN(issueId)) {
      return NextResponse.json(
        { message: 'Invalid issue ID' },
        { status: 400 }
      );
    }

    // 3. 데이터베이스 연결
    const ds = await getDataSource();
    const issueRepo = ds.getRepository(Issue);
    const attachmentRepo = ds.getRepository(IssueAttachment);
    const historyRepo = ds.getRepository(IssueHistory);

    // 4. Issue 조회 (관계 포함)
    const issue = await issueRepo.findOne({
      where: { id: issueId, deleted_at: IsNull() },
      relations: ['customer', 'created_by', 'assigned_to'],
    });

    if (!issue) {
      return NextResponse.json(
        { message: 'Issue not found' },
        { status: 404 }
      );
    }

    // 5. 권한 검증 (RLS)
    let hasAccess = false;

    if (userRole === 'ADMIN') {
      // ADMIN: 모든 Issue 조회 가능
      hasAccess = true;
    } else if (userRole === 'MANAGER') {
      // MANAGER: 같은 부서 담당자의 Issue만
      if (issue.assigned_to?.department_id === userDepartmentId) {
        hasAccess = true;
      }
    } else if (userRole === 'USER') {
      // USER: 자신 생성 + 자신 담당 + 같은 부서 공개
      if (
        issue.created_by_id === userId ||
        issue.assigned_to_id === userId ||
        (issue.is_public === 1 &&
          issue.assigned_to?.department_id === userDepartmentId)
      ) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    // 6. 첨부파일 조회
    const attachments = await attachmentRepo.find({
      where: { issue_id: issueId, deleted_at: IsNull() },
      relations: ['uploaded_by'],
    });

    // 7. 이력 조회 (최신순 정렬)
    const histories = await historyRepo.find({
      where: { issue_id: issueId },
      relations: ['changed_by'],
      order: { changed_at: 'DESC' },
    });

    // 8. 응답 생성
    return NextResponse.json<IssueDetailResponse>({
      data: {
        id: issue.id,
        customer_id: issue.customer_id,
        customer: issue.customer
          ? {
              id: issue.customer.id,
              name: issue.customer.name,
            }
          : null,
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        status: issue.status,
        is_public: issue.is_public,
        created_by_id: issue.created_by_id,
        created_by: issue.created_by
          ? {
              id: issue.created_by.id,
              name: issue.created_by.name,
            }
          : null,
        assigned_to_id: issue.assigned_to_id,
        assigned_to: issue.assigned_to
          ? {
              id: issue.assigned_to.id,
              name: issue.assigned_to.name,
              department_id: issue.assigned_to.department_id,
            }
          : null,
        treatment_method: issue.treatment_method,
        treatment_time_minutes: issue.treatment_time_minutes,
        treatment_result: issue.treatment_result,
        created_at: issue.created_at,
        completed_at: issue.completed_at,
        updated_at: issue.updated_at,
        attachments: attachments.map((a) => ({
          id: a.id,
          file_name: a.file_name,
          file_path: a.file_path,
          file_size: a.file_size,
          uploaded_by_id: a.uploaded_by_id,
          uploaded_by_name: a.uploaded_by?.name || null,
          created_at: a.created_at,
        })),
        histories: histories.map((h) => ({
          id: h.id,
          change_type: h.change_type,
          old_value: h.old_value,
          new_value: h.new_value,
          changed_by_id: h.changed_by_id,
          changed_by_name: h.changed_by?.name || null,
          changed_at: h.changed_at,
          remark: h.remark,
        })),
      },
    });
  } catch (error) {
    console.error('GET /api/issues/[id] error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    // 1. 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = session.user as any;
    const userId = user.id;
    const userRole = user.role;
    const userDepartmentId = user.department_id;

    // 2. ID 검증
    const issueId = parseInt(params.id, 10);
    if (isNaN(issueId)) {
      return NextResponse.json(
        { message: 'Invalid issue ID' },
        { status: 400 }
      );
    }

    // 3. 데이터베이스 연결
    const ds = await getDataSource();
    const issueRepo = ds.getRepository(Issue);
    const employeeRepo = ds.getRepository(Employee);
    const historyRepo = ds.getRepository(IssueHistory);

    // 4. Issue 조회
    const issue = await issueRepo.findOne({
      where: { id: issueId, deleted_at: IsNull() },
      relations: ['assigned_to'],
    });

    if (!issue) {
      return NextResponse.json(
        { message: 'Issue not found' },
        { status: 404 }
      );
    }

    // 5. 수정 권한 검증
    let canModify = false;

    if (userRole === 'ADMIN') {
      canModify = true;
    } else if (userRole === 'MANAGER') {
      // MANAGER: 같은 부서 담당자의 Issue만
      if (issue.assigned_to?.department_id === userDepartmentId) {
        canModify = true;
      }
    } else if (userRole === 'USER') {
      // USER: 자신 담당 Issue만 (처리 정보 수정만 가능)
      if (issue.assigned_to_id === userId) {
        canModify = true;
      }
    }

    if (!canModify) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    // 6. 요청 본문 파싱
    const body = (await req.json()) as Record<string, any>;
    const {
      status,
      assigned_to_id,
      severity,
      is_public,
      treatment_method,
      treatment_time_minutes,
      treatment_result,
    } = body;

    // 7. 이력 기록용 변경사항 추적
    const changes: Array<{
      change_type: string;
      old_value: string;
      new_value: string;
    }> = [];

    // 8. 필드별 수정 및 권한 검증

    // 8.1 상태 변경 (MANAGER/ADMIN만)
    if (status !== undefined && status !== issue.status) {
      if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
        return NextResponse.json(
          { message: 'Only ADMIN/MANAGER can change status' },
          { status: 403 }
        );
      }

      // 상태 전이 검증 (단방향)
      const validTransitions: Record<string, string[]> = {
        INTAKE: ['IN_PROGRESS'],
        IN_PROGRESS: ['COMPLETED'],
        COMPLETED: [],
      };

      if (!validTransitions[issue.status as string]?.includes(status)) {
        return NextResponse.json(
          { message: `Cannot change from ${issue.status} to ${status}` },
          { status: 400 }
        );
      }

      changes.push({
        change_type: 'STATUS_CHANGE',
        old_value: issue.status,
        new_value: status,
      });

      issue.status = status as any;

      // 완료일 자동 기록
      if (status === 'COMPLETED') {
        issue.completed_at = new Date();
      }
    }

    // 8.2 담당자 변경 (MANAGER/ADMIN만, 부서 제약)
    if (
      assigned_to_id !== undefined &&
      assigned_to_id !== issue.assigned_to_id
    ) {
      if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
        return NextResponse.json(
          { message: 'Only ADMIN/MANAGER can change assignee' },
          { status: 403 }
        );
      }

      if (assigned_to_id !== null) {
        const newAssignee = await employeeRepo.findOne({
          where: { id: assigned_to_id, deleted_at: IsNull() },
        });

        if (!newAssignee) {
          return NextResponse.json(
            { message: 'Employee not found' },
            { status: 404 }
          );
        }

        // MANAGER 부서 제약
        if (
          userRole === 'MANAGER' &&
          newAssignee.department_id !== userDepartmentId
        ) {
          return NextResponse.json(
            {
              message:
                'MANAGER can only assign to employees in same department',
            },
            { status: 400 }
          );
        }
      }

      const oldAssigneeId = issue.assigned_to_id ?? 'null';
      changes.push({
        change_type: 'ASSIGNEE_CHANGE',
        old_value: oldAssigneeId.toString(),
        new_value: (assigned_to_id ?? 'null').toString(),
      });

      issue.assigned_to_id = assigned_to_id;
    }

    // 8.3 심각도 변경 (MANAGER/ADMIN만, COMPLETED 제외)
    if (severity !== undefined && severity !== issue.severity) {
      if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
        return NextResponse.json(
          { message: 'Only ADMIN/MANAGER can change severity' },
          { status: 403 }
        );
      }

      if (issue.status === 'COMPLETED') {
        return NextResponse.json(
          { message: 'Cannot change severity for COMPLETED issues' },
          { status: 400 }
        );
      }

      if (!['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(severity)) {
        return NextResponse.json(
          { message: 'Invalid severity value' },
          { status: 400 }
        );
      }

      changes.push({
        change_type: 'SEVERITY_CHANGE',
        old_value: issue.severity,
        new_value: severity,
      });

      issue.severity = severity as any;
    }

    // 8.4 공개 여부 토글 (MANAGER/ADMIN만)
    if (is_public !== undefined && is_public !== issue.is_public) {
      if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
        return NextResponse.json(
          { message: 'Only ADMIN/MANAGER can change is_public' },
          { status: 403 }
        );
      }

      if (is_public !== 0 && is_public !== 1) {
        return NextResponse.json(
          { message: 'is_public must be 0 or 1' },
          { status: 400 }
        );
      }

      issue.is_public = is_public;
    }

    // 8.5 처리 정보 입력 (USER도 담당 시 가능)
    if (
      treatment_method !== undefined &&
      treatment_method !== issue.treatment_method
    ) {
      if (treatment_method && !['REMOTE', 'PHONE', 'ONSITE'].includes(treatment_method)) {
        return NextResponse.json(
          { message: 'Invalid treatment_method' },
          { status: 400 }
        );
      }

      issue.treatment_method = treatment_method;
    }

    if (
      treatment_time_minutes !== undefined &&
      treatment_time_minutes !== issue.treatment_time_minutes
    ) {
      if (
        treatment_time_minutes !== null &&
        (typeof treatment_time_minutes !== 'number' ||
          treatment_time_minutes < 1 ||
          treatment_time_minutes > 1440)
      ) {
        return NextResponse.json(
          { message: 'treatment_time_minutes must be 1-1440' },
          { status: 400 }
        );
      }

      issue.treatment_time_minutes = treatment_time_minutes;
    }

    if (
      treatment_result !== undefined &&
      treatment_result !== issue.treatment_result
    ) {
      issue.treatment_result = treatment_result;
    }

    // 9. Issue 저장
    const updatedIssue = await issueRepo.save(issue);

    // 10. 이력 기록
    for (const change of changes) {
      const history = new IssueHistory();
      history.issue_id = issueId;
      history.change_type = change.change_type as any;
      history.old_value = change.old_value;
      history.new_value = change.new_value;
      history.changed_by_id = userId;

      await historyRepo.save(history);
    }

    // 11. 응답 반환
    return NextResponse.json({
      message: 'Issue updated successfully',
      data: {
        id: updatedIssue.id,
        status: updatedIssue.status,
        assigned_to_id: updatedIssue.assigned_to_id,
        severity: updatedIssue.severity,
        is_public: updatedIssue.is_public,
        treatment_method: updatedIssue.treatment_method,
        treatment_time_minutes: updatedIssue.treatment_time_minutes,
        treatment_result: updatedIssue.treatment_result,
        completed_at: updatedIssue.completed_at,
        updated_at: updatedIssue.updated_at,
      },
    });
  } catch (error) {
    console.error('PUT /api/issues/[id] error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    // 1. 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = session.user as any;
    const userId = user.id;
    const userRole = user.role;

    // 2. ID 검증
    const issueId = parseInt(params.id, 10);
    if (isNaN(issueId)) {
      return NextResponse.json(
        { message: 'Invalid issue ID' },
        { status: 400 }
      );
    }

    // 3. ADMIN만 삭제 가능
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Only ADMIN can delete issues' },
        { status: 403 }
      );
    }

    // 4. 데이터베이스 연결
    const ds = await getDataSource();
    const issueRepo = ds.getRepository(Issue);
    const attachmentRepo = ds.getRepository(IssueAttachment);
    const historyRepo = ds.getRepository(IssueHistory);

    // 5. Issue 조회
    const issue = await issueRepo.findOne({
      where: { id: issueId, deleted_at: IsNull() },
    });

    if (!issue) {
      return NextResponse.json(
        { message: 'Issue not found' },
        { status: 404 }
      );
    }

    // 6. 첨부파일 존재 여부 확인 (ON DELETE RESTRICT)
    const attachmentCount = await attachmentRepo.count({
      where: { issue_id: issueId, deleted_at: IsNull() },
    });

    if (attachmentCount > 0) {
      return NextResponse.json(
        {
          message: 'Cannot delete issue with attachments',
          error_code: 'ATTACHMENTS_EXIST',
          attachments_count: attachmentCount,
        },
        { status: 409 }
      );
    }

    // 7. 소프트 삭제 (deleted_at 설정)
    issue.deleted_at = new Date();
    await issueRepo.save(issue);

    // 8. 선택: 삭제 이력 기록
    const history = new IssueHistory();
    history.issue_id = issueId;
    history.change_type = 'STATUS_CHANGE' as any; // Deletion marker
    history.old_value = 'ACTIVE';
    history.new_value = 'DELETED';
    history.changed_by_id = userId;
    history.remark = `Soft deleted at ${issue.deleted_at.toISOString()}`;

    await historyRepo.save(history);

    // 9. 응답 반환
    return NextResponse.json({
      message: 'Issue deleted successfully',
      data: {
        id: issue.id,
        deleted_at: issue.deleted_at,
      },
    });
  } catch (error) {
    console.error('DELETE /api/issues/[id] error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
