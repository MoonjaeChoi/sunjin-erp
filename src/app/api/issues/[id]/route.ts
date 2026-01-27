// Generated: 2026-01-27 23:45:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeQuerySingle, executeUpdate } from '@/lib/db-direct';

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
    const userDepartmentId = user.department;

    // 2. ID 검증
    const issueId = parseInt(params.id, 10);
    if (isNaN(issueId)) {
      return NextResponse.json(
        { message: 'Invalid issue ID' },
        { status: 400 }
      );
    }

    // 3. Issue 조회
    const issue = await executeQuerySingle<any>(
      `SELECT
        i.ID,
        i.CUSTOMER_ID,
        i.TITLE,
        i.DESCRIPTION,
        i.SEVERITY,
        i.STATUS,
        i.IS_PUBLIC,
        i.CREATED_BY_ID,
        i.ASSIGNED_TO_ID,
        i.TREATMENT_METHOD,
        i.TREATMENT_TIME_MINUTES,
        i.TREATMENT_RESULT,
        i.CREATED_AT,
        i.COMPLETED_AT,
        i.UPDATED_AT,
        c."id" AS customer_id,
        c."name" AS customer_name,
        ec."id" AS created_by_id,
        ec."name" AS created_by_name,
        ea."id" AS assigned_to_id,
        ea."name" AS assigned_to_name,
        ea."department_id" AS assigned_to_department_id
       FROM ISSUE i
       LEFT JOIN CUSTOMER c ON c."id" = i.CUSTOMER_ID AND c."deleted_at" IS NULL
       LEFT JOIN EMPLOYEE ec ON ec."id" = i.CREATED_BY_ID AND ec."deleted_at" IS NULL
       LEFT JOIN EMPLOYEE ea ON ea."id" = i.ASSIGNED_TO_ID AND ea."deleted_at" IS NULL
       WHERE i.ID = :issueId AND i.DELETED_AT IS NULL`,
      { issueId }
    );

    if (!issue) {
      return NextResponse.json(
        { message: 'Issue not found' },
        { status: 404 }
      );
    }

    // 4. 권한 검증 (RLS)
    let hasAccess = false;

    if (userRole === 'ADMIN') {
      // ADMIN: 모든 Issue 조회 가능
      hasAccess = true;
    } else if (userRole === 'MANAGER') {
      // MANAGER: 같은 부서 담당자의 Issue만
      if (issue.assigned_to_department_id === userDepartmentId) {
        hasAccess = true;
      }
    } else if (userRole === 'USER') {
      // USER: 자신 생성 + 자신 담당 + 같은 부서 공개
      if (
        issue.CREATED_BY_ID === userId ||
        issue.ASSIGNED_TO_ID === userId ||
        (issue.IS_PUBLIC === 1 &&
          issue.assigned_to_department_id === userDepartmentId)
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

    // 5. 첨부파일 조회
    const attachmentsResult = await executeQuery<any>(
      `SELECT
        ia.ID,
        ia.FILE_NAME,
        ia.FILE_PATH,
        ia.FILE_SIZE,
        ia.UPLOADED_BY_ID,
        e."name" AS uploaded_by_name,
        ia.CREATED_AT
       FROM ISSUE_ATTACHMENT ia
       LEFT JOIN EMPLOYEE e ON e."id" = ia.UPLOADED_BY_ID AND e."deleted_at" IS NULL
       WHERE ia.ISSUE_ID = :issueId AND ia.DELETED_AT IS NULL`,
      { issueId }
    );

    // 6. 이력 조회 (최신순 정렬)
    const historiesResult = await executeQuery<any>(
      `SELECT
        ID,
        ISSUE_ID,
        CHANGE_TYPE,
        OLD_VALUE,
        NEW_VALUE,
        CHANGED_BY_ID,
        CHANGED_AT,
        REMARK
       FROM ISSUE_HISTORY
       WHERE ISSUE_ID = :issueId
       ORDER BY CHANGED_AT DESC`,
      { issueId }
    );

    // 7. 변경 기록자의 이름 조회
    const historyWithNames = await Promise.all(
      historiesResult.rows.map(async (h: any) => {
        const changerResult = await executeQuerySingle<any>(
          `SELECT "name" FROM EMPLOYEE WHERE "id" = :id AND "deleted_at" IS NULL`,
          { id: h.CHANGED_BY_ID }
        );
        return {
          id: h.ID,
          change_type: h.CHANGE_TYPE,
          old_value: h.OLD_VALUE,
          new_value: h.NEW_VALUE,
          changed_by_id: h.CHANGED_BY_ID,
          changed_by_name: changerResult?.name || null,
          changed_at: h.CHANGED_AT,
          remark: h.REMARK,
        };
      })
    );

    // 8. 응답 생성
    return NextResponse.json<IssueDetailResponse>({
      data: {
        id: issue.ID,
        customer_id: issue.CUSTOMER_ID,
        customer: issue.customer_id
          ? {
              id: issue.customer_id,
              name: issue.customer_name,
            }
          : null,
        title: issue.TITLE,
        description: issue.DESCRIPTION,
        severity: issue.SEVERITY,
        status: issue.STATUS,
        is_public: issue.IS_PUBLIC,
        created_by_id: issue.CREATED_BY_ID,
        created_by: issue.created_by_id
          ? {
              id: issue.created_by_id,
              name: issue.created_by_name,
            }
          : null,
        assigned_to_id: issue.ASSIGNED_TO_ID,
        assigned_to: issue.ASSIGNED_TO_ID
          ? {
              id: issue.ASSIGNED_TO_ID,
              name: issue.assigned_to_name,
              department_id: issue.assigned_to_department_id,
            }
          : null,
        treatment_method: issue.TREATMENT_METHOD,
        treatment_time_minutes: issue.TREATMENT_TIME_MINUTES,
        treatment_result: issue.TREATMENT_RESULT,
        created_at: issue.CREATED_AT,
        completed_at: issue.COMPLETED_AT,
        updated_at: issue.UPDATED_AT,
        attachments: attachmentsResult.rows.map((a: any) => ({
          id: a.ID,
          file_name: a.FILE_NAME,
          file_path: a.FILE_PATH,
          file_size: a.FILE_SIZE,
          uploaded_by_id: a.UPLOADED_BY_ID,
          uploaded_by_name: a.uploaded_by_name || null,
          created_at: a.CREATED_AT,
        })),
        histories: historyWithNames,
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
    const userDepartmentId = user.department;

    // 2. ID 검증
    const issueId = parseInt(params.id, 10);
    if (isNaN(issueId)) {
      return NextResponse.json(
        { message: 'Invalid issue ID' },
        { status: 400 }
      );
    }

    // 3. Issue 조회
    const issue = await executeQuerySingle<any>(
      `SELECT
        ID,
        CUSTOMER_ID,
        TITLE,
        DESCRIPTION,
        SEVERITY,
        STATUS,
        IS_PUBLIC,
        CREATED_BY_ID,
        ASSIGNED_TO_ID,
        TREATMENT_METHOD,
        TREATMENT_TIME_MINUTES,
        TREATMENT_RESULT,
        CREATED_AT,
        COMPLETED_AT,
        UPDATED_AT,
        DELETED_AT
       FROM ISSUE
       WHERE ID = :issueId AND DELETED_AT IS NULL`,
      { issueId }
    );

    if (!issue) {
      return NextResponse.json(
        { message: 'Issue not found' },
        { status: 404 }
      );
    }

    // 4. Get assigned employee's department
    let assignedToDepartmentId = null;
    if (issue.ASSIGNED_TO_ID) {
      const assignedEmp = await executeQuerySingle<any>(
        `SELECT "department_id" FROM EMPLOYEE WHERE "id" = :id AND "deleted_at" IS NULL`,
        { id: issue.ASSIGNED_TO_ID }
      );
      assignedToDepartmentId = assignedEmp?.department_id;
    }

    // 5. 수정 권한 검증
    let canModify = false;

    if (userRole === 'ADMIN') {
      canModify = true;
    } else if (userRole === 'MANAGER') {
      // MANAGER: 같은 부서 담당자의 Issue만
      if (assignedToDepartmentId === userDepartmentId) {
        canModify = true;
      }
    } else if (userRole === 'USER') {
      // USER: 자신 담당 Issue만 (처리 정보 수정만 가능)
      if (issue.ASSIGNED_TO_ID === userId) {
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

    // 8. Track current values for update
    let updateSql = 'UPDATE ISSUE SET ';
    const updateParams: any = { issueId };
    const updateFields: string[] = [];
    let currentStatus = issue.STATUS;
    let currentCompletedAt = issue.COMPLETED_AT;

    // 8.1 상태 변경 (MANAGER/ADMIN만)
    if (status !== undefined && status !== issue.STATUS) {
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

      if (!validTransitions[issue.STATUS as string]?.includes(status)) {
        return NextResponse.json(
          { message: `Cannot change from ${issue.STATUS} to ${status}` },
          { status: 400 }
        );
      }

      changes.push({
        change_type: 'STATUS_CHANGE',
        old_value: issue.STATUS,
        new_value: status,
      });

      currentStatus = status;
      updateFields.push('STATUS = :status');
      updateParams.status = status;

      // 완료일 자동 기록
      if (status === 'COMPLETED') {
        currentCompletedAt = new Date();
        updateFields.push('COMPLETED_AT = :completedAt');
        updateParams.completedAt = currentCompletedAt;
      }
    }

    // 8.2 담당자 변경 (MANAGER/ADMIN만, 부서 제약)
    if (
      assigned_to_id !== undefined &&
      assigned_to_id !== issue.ASSIGNED_TO_ID
    ) {
      if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
        return NextResponse.json(
          { message: 'Only ADMIN/MANAGER can change assignee' },
          { status: 403 }
        );
      }

      if (assigned_to_id !== null) {
        const newAssignee = await executeQuerySingle<any>(
          `SELECT "id", "department_id" FROM EMPLOYEE WHERE "id" = :assigneeId AND "deleted_at" IS NULL`,
          { assigneeId: assigned_to_id }
        );

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

      const oldAssigneeId = issue.ASSIGNED_TO_ID ?? 'null';
      changes.push({
        change_type: 'ASSIGNEE_CHANGE',
        old_value: oldAssigneeId.toString(),
        new_value: (assigned_to_id ?? 'null').toString(),
      });

      updateFields.push('ASSIGNED_TO_ID = :assignedToId');
      updateParams.assignedToId = assigned_to_id;
    }

    // 8.3 심각도 변경 (MANAGER/ADMIN만, COMPLETED 제외)
    if (severity !== undefined && severity !== issue.SEVERITY) {
      if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
        return NextResponse.json(
          { message: 'Only ADMIN/MANAGER can change severity' },
          { status: 403 }
        );
      }

      if (issue.STATUS === 'COMPLETED') {
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
        old_value: issue.SEVERITY,
        new_value: severity,
      });

      updateFields.push('SEVERITY = :severity');
      updateParams.severity = severity;
    }

    // 8.4 공개 여부 토글 (MANAGER/ADMIN만)
    if (is_public !== undefined && is_public !== issue.IS_PUBLIC) {
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

      updateFields.push('IS_PUBLIC = :isPublic');
      updateParams.isPublic = is_public;
    }

    // 8.5 처리 정보 입력 (USER도 담당 시 가능)
    if (
      treatment_method !== undefined &&
      treatment_method !== issue.TREATMENT_METHOD
    ) {
      if (treatment_method && !['REMOTE', 'PHONE', 'ONSITE'].includes(treatment_method)) {
        return NextResponse.json(
          { message: 'Invalid treatment_method' },
          { status: 400 }
        );
      }

      updateFields.push('TREATMENT_METHOD = :treatmentMethod');
      updateParams.treatmentMethod = treatment_method;
    }

    if (
      treatment_time_minutes !== undefined &&
      treatment_time_minutes !== issue.TREATMENT_TIME_MINUTES
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

      updateFields.push('TREATMENT_TIME_MINUTES = :treatmentTimeMinutes');
      updateParams.treatmentTimeMinutes = treatment_time_minutes;
    }

    if (
      treatment_result !== undefined &&
      treatment_result !== issue.TREATMENT_RESULT
    ) {
      updateFields.push('TREATMENT_RESULT = :treatmentResult');
      updateParams.treatmentResult = treatment_result;
    }

    // 9. Issue 저장 (if there are updates)
    if (updateFields.length > 0) {
      updateFields.push('UPDATED_AT = :now');
      updateParams.now = new Date();

      const finalUpdateSql = updateSql + updateFields.join(', ') + ' WHERE ID = :issueId';
      await executeUpdate(finalUpdateSql, updateParams);
    }

    // 10. 이력 기록
    for (const change of changes) {
      // Get next history ID from sequence
      const historySeqResult = await executeQuerySingle<any>(
        `SELECT ISSUE_HISTORY_SEQ.NEXTVAL as ID FROM DUAL`
      );
      const historyId = historySeqResult?.ID;

      if (historyId) {
        await executeUpdate(
          `INSERT INTO ISSUE_HISTORY (
            ID, ISSUE_ID, CHANGE_TYPE, OLD_VALUE, NEW_VALUE, CHANGED_BY_ID, CHANGED_AT, REMARK
          ) VALUES (
            :id, :issueId, :changeType, :oldValue, :newValue, :changedById, :changedAt, :remark
          )`,
          {
            id: historyId,
            issueId,
            changeType: change.change_type,
            oldValue: change.old_value,
            newValue: change.new_value,
            changedById: userId,
            changedAt: new Date(),
            remark: null,
          }
        );
      }
    }

    // 11. 응답 반환
    return NextResponse.json({
      message: 'Issue updated successfully',
      data: {
        id: issueId,
        status: currentStatus,
        assigned_to_id: updateParams.assignedToId !== undefined ? updateParams.assignedToId : issue.ASSIGNED_TO_ID,
        severity: updateParams.severity !== undefined ? updateParams.severity : issue.SEVERITY,
        is_public: updateParams.isPublic !== undefined ? updateParams.isPublic : issue.IS_PUBLIC,
        treatment_method: updateParams.treatmentMethod !== undefined ? updateParams.treatmentMethod : issue.TREATMENT_METHOD,
        treatment_time_minutes: updateParams.treatmentTimeMinutes !== undefined ? updateParams.treatmentTimeMinutes : issue.TREATMENT_TIME_MINUTES,
        treatment_result: updateParams.treatmentResult !== undefined ? updateParams.treatmentResult : issue.TREATMENT_RESULT,
        completed_at: currentCompletedAt,
        updated_at: updateParams.now || issue.UPDATED_AT,
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

    // 4. Issue 조회
    const issue = await executeQuerySingle<any>(
      `SELECT ID, DELETED_AT FROM ISSUE WHERE ID = :issueId AND DELETED_AT IS NULL`,
      { issueId }
    );

    if (!issue) {
      return NextResponse.json(
        { message: 'Issue not found' },
        { status: 404 }
      );
    }

    // 5. 첨부파일 존재 여부 확인 (ON DELETE RESTRICT)
    const attachmentCountResult = await executeQuerySingle<any>(
      `SELECT COUNT(*) as cnt FROM ISSUE_ATTACHMENT WHERE ISSUE_ID = :issueId AND DELETED_AT IS NULL`,
      { issueId }
    );
    const attachmentCount = parseInt(attachmentCountResult?.CNT || '0', 10);

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

    // 6. 소프트 삭제 (deleted_at 설정)
    const now = new Date();
    await executeUpdate(
      `UPDATE ISSUE SET DELETED_AT = :deletedAt WHERE ID = :issueId`,
      { deletedAt: now, issueId }
    );

    // 7. 삭제 이력 기록
    try {
      const historySeqResult = await executeQuerySingle<any>(
        `SELECT ISSUE_HISTORY_SEQ.NEXTVAL as ID FROM DUAL`
      );
      const historyId = historySeqResult?.ID;

      if (historyId) {
        await executeUpdate(
          `INSERT INTO ISSUE_HISTORY (
            ID, ISSUE_ID, CHANGE_TYPE, OLD_VALUE, NEW_VALUE, CHANGED_BY_ID, CHANGED_AT, REMARK
          ) VALUES (
            :id, :issueId, :changeType, :oldValue, :newValue, :changedById, :changedAt, :remark
          )`,
          {
            id: historyId,
            issueId,
            changeType: 'STATUS_CHANGE',
            oldValue: 'ACTIVE',
            newValue: 'DELETED',
            changedById: userId,
            changedAt: now,
            remark: `Soft deleted at ${now.toISOString()}`,
          }
        );
      }
    } catch (historyError) {
      console.warn('Failed to record deletion history:', historyError);
    }

    // 8. 응답 반환
    return NextResponse.json({
      message: 'Issue deleted successfully',
      data: {
        id: issueId,
        deleted_at: now,
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
