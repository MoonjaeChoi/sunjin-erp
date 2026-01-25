// Generated: 2026-01-25 18:05:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';
import { Issue } from '@/entities/Issue';
import { IssueAttachment } from '@/entities/IssueAttachment';
import { IssueHistory } from '@/entities/IssueHistory';
import { IsNull } from 'typeorm';

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
