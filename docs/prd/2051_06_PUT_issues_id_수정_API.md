<!-- Generated: 2026-01-25 18:05:00 KST -->

# PUT /api/issues/[id] — 수정 API

**문서 번호**: 2051_06
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md ('US-2, US-3, US-8')
**구현 범위**: 상태 변경, 담당자 변경, 심각도 변경, is_public 토글, 처리 정보 입력, 이력 기록
**복잡도**: L (Large)
**의존성**: 2051_02 (Migration)

---

## 구현 목표

`PUT /api/issues/[id]` 엔드포인트로 기존 장애를 수정한다. 핵심 특성:
- **권한 기반 필드 수정**: 역할별로 수정 가능한 필드 제한
- **상태 변경**: INTAKE → IN_PROGRESS → COMPLETED (단방향)
- **담당자 변경**: MANAGER는 같은 부서만, IN_PROGRESS에서도 가능
- **심각도 변경**: MANAGER/ADMIN만, COMPLETED 제외
- **is_public 토글**: MANAGER/ADMIN만
- **완료일 자동 기록**: 상태 COMPLETED 시 completed_at 자동 설정
- **이력 기록**: 모든 변경사항 IssueHistory에 기록

---

## 구현 내용

### 파일 구조

생성/수정할 파일:
```
src/app/api/issues/[id]/route.ts  # PUT 메서드 추가 (GET과 동일 파일)
```

### 요청 본문 (Request Body)

```typescript
interface UpdateIssueRequest {
  status?: 'INTAKE' | 'IN_PROGRESS' | 'COMPLETED';
  assigned_to_id?: number | null;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  is_public?: number;
  treatment_method?: string;
  treatment_time_minutes?: number;
  treatment_result?: string;
}
```

### 구현 상세

```typescript
// Generated: 2026-01-25 18:05:00 KST

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    // 1. 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    const userDepartmentId = session.user.department_id;
    const issueId = parseInt(params.id);

    if (isNaN(issueId)) {
      return NextResponse.json(
        { message: 'Invalid issue ID' },
        { status: 400 }
      );
    }

    // 2. Issue 조회
    const issueRepo = getRepository(Issue);
    const issue = await issueRepo.findOne({
      where: { id: issueId, deleted_at: null },
      relations: ['assigned_to'],
    });

    if (!issue) {
      return NextResponse.json(
        { message: 'Issue not found' },
        { status: 404 }
      );
    }

    // 3. 수정 권한 검증
    let canModify = false;

    if (userRole === 'ADMIN') {
      canModify = true;
    } else if (userRole === 'MANAGER') {
      // MANAGER: 같은 부서 담당자의 Issue만
      if (issue.assigned_to?.department_id === userDepartmentId) {
        canModify = true;
      }
    } else if (userRole === 'USER') {
      // USER: 자신 담당 Issue만 수정 가능 (생성자는 수정 불가)
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

    // 4. 요청 본문 파싱
    const body = await req.json();
    const {
      status,
      assigned_to_id,
      severity,
      is_public,
      treatment_method,
      treatment_time_minutes,
      treatment_result,
    } = body;

    // 5. 이력 기록용 변경사항 추적
    const historyRepo = getRepository(IssueHistory);
    const changes: Array<{
      change_type: string;
      old_value: string;
      new_value: string;
    }> = [];

    // 6. 필드별 수정 및 권한 검증

    // 6.1 상태 변경 (MANAGER/ADMIN만)
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

      if (!validTransitions[issue.status]?.includes(status)) {
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

      issue.status = status;

      // 완료일 자동 기록
      if (status === 'COMPLETED') {
        issue.completed_at = new Date();
      }
    }

    // 6.2 담당자 변경 (MANAGER/ADMIN만, 부서 제약)
    if (assigned_to_id !== undefined && assigned_to_id !== issue.assigned_to_id) {
      if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
        return NextResponse.json(
          { message: 'Only ADMIN/MANAGER can change assignee' },
          { status: 403 }
        );
      }

      if (assigned_to_id !== null) {
        const employeeRepo = getRepository(Employee);
        const newAssignee = await employeeRepo.findOne({
          where: { id: assigned_to_id },
        });

        if (!newAssignee) {
          return NextResponse.json(
            { message: 'Employee not found' },
            { status: 404 }
          );
        }

        // MANAGER 부서 제약
        if (userRole === 'MANAGER' && newAssignee.department_id !== userDepartmentId) {
          return NextResponse.json(
            { message: 'MANAGER can only assign to same department employees' },
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

    // 6.3 심각도 변경 (MANAGER/ADMIN만, COMPLETED 제외)
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

      issue.severity = severity;
    }

    // 6.4 공개 여부 토글 (MANAGER/ADMIN만)
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

      // is_public 변경은 이력에 기록하지 않음 (토글 기능이므로)
      issue.is_public = is_public;
    }

    // 6.5 처리 정보 입력 (USER도 담당 시 가능)
    if (treatment_method !== undefined && treatment_method !== issue.treatment_method) {
      if (!['REMOTE', 'PHONE', 'ONSITE'].includes(treatment_method)) {
        return NextResponse.json(
          { message: 'Invalid treatment_method' },
          { status: 400 }
        );
      }

      issue.treatment_method = treatment_method;
    }

    if (treatment_time_minutes !== undefined && treatment_time_minutes !== issue.treatment_time_minutes) {
      if (treatment_time_minutes !== null && (treatment_time_minutes < 1 || treatment_time_minutes > 1440)) {
        return NextResponse.json(
          { message: 'treatment_time_minutes must be 1-1440' },
          { status: 400 }
        );
      }

      issue.treatment_time_minutes = treatment_time_minutes;
    }

    if (treatment_result !== undefined && treatment_result !== issue.treatment_result) {
      issue.treatment_result = treatment_result;
    }

    // 7. Issue 저장
    const updatedIssue = await issueRepo.save(issue);

    // 8. 이력 기록
    for (const change of changes) {
      const history = new IssueHistory();
      history.issue_id = issueId;
      history.change_type = change.change_type;
      history.old_value = change.old_value;
      history.new_value = change.new_value;
      history.changed_by_id = userId;

      await historyRepo.save(history);
    }

    // 9. 응답 반환
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
```

---

## 수정 권한 매트릭스

| 필드 | ADMIN | MANAGER | USER |
|------|-------|---------|------|
| status | O | O | X |
| assigned_to_id | O | O (같은 부서만) | X |
| severity | O | O (COMPLETED 제외) | X |
| is_public | O | O | X |
| treatment_method | O | O | O (담당자일 때) |
| treatment_time_minutes | O | O | O (담당자일 때) |
| treatment_result | O | O | O (담당자일 때) |

---

## Acceptance Criteria

- [ ] PUT /api/issues/[id] 엔드포인트 정상 응답 (200 OK)
- [ ] 상태 전이 검증 (단방향만 허용)
- [ ] 담당자 변경 시 RBAC 검증
- [ ] MANAGER 부서 제약 검증
- [ ] 심각도 변경 시 역할 검증 (COMPLETED 제외)
- [ ] is_public 토글 시 역할 검증
- [ ] 완료 상태 시 completed_at 자동 설정
- [ ] 모든 변경사항 IssueHistory에 기록
- [ ] 권한 없으면 403 응답
- [ ] 잘못된 전이 시 400 응답
- [ ] Issue 없으면 404 응답
- [ ] 미인증 시 401 응답

---

## 완료 체크리스트

- [ ] PUT 메서드 구현 (src/app/api/issues/[id]/route.ts)
- [ ] Issue 조회 및 존재 검증
- [ ] 권한 검증 (수정 가능 여부)
- [ ] 상태 전이 검증
- [ ] 담당자 변경 권한 검증 (부서 제약)
- [ ] 심각도 변경 권한 검증
- [ ] is_public 토글 권한 검증
- [ ] 완료일 자동 기록
- [ ] IssueHistory 이력 기록
- [ ] TypeScript 빌드 성공
- [ ] ESLint 통과

---

**다음 문서**: 2051_07_DELETE_issues_id_소프트_삭제_API.md
