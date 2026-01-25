<!-- Generated: 2026-01-25 18:05:00 KST -->

# GET /api/issues/[id] — 상세 조회 API

**문서 번호**: 2051_05
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md ('US-7')
**구현 범위**: 특정 Issue 상세 정보 조회, 권한 검증, 관계 데이터 포함
**복잡도**: M (Medium)
**의존성**: 2051_02 (Migration)

---

## 구현 목표

`GET /api/issues/[id]` 엔드포인트로 특정 장애의 전체 정보를 조회한다. 핵심 특성:
- **권한 검증**: 조회 권한이 있는 경우만 데이터 반환
- **관계 데이터 포함**: 첨부파일, 이력, 담당자/등록자 정보
- **RBAC 준수**: 같은 권한 필터링 규칙 적용
- **404 처리**: Issue 없거나 권한 없으면 404

---

## 구현 내용

### 파일 구조

생성할 파일:
```
src/app/api/issues/[id]/route.ts  # GET 메서드 (다른 메서드는 다른 문서에서)
```

### 구현 상세

```typescript
// Generated: 2026-01-25 18:05:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getRepository } from 'typeorm';
import { Issue } from '@/entities/Issue';
import { IssueAttachment } from '@/entities/IssueAttachment';
import { IssueHistory } from '@/entities/IssueHistory';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
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
      relations: ['customer', 'created_by', 'assigned_to'],
    });

    if (!issue) {
      return NextResponse.json(
        { message: 'Issue not found' },
        { status: 404 }
      );
    }

    // 3. 권한 검증 (RLS)
    let hasAccess = false;

    if (userRole === 'ADMIN') {
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
        (issue.is_public === 1 && issue.assigned_to?.department_id === userDepartmentId)
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

    // 4. 첨부파일 조회
    const attachmentRepo = getRepository(IssueAttachment);
    const attachments = await attachmentRepo.find({
      where: { issue_id: issueId, deleted_at: null },
      relations: ['uploaded_by'],
    });

    // 5. 이력 조회
    const historyRepo = getRepository(IssueHistory);
    const histories = await historyRepo.find({
      where: { issue_id: issueId },
      relations: ['changed_by'],
      order: { changed_at: 'DESC' },
    });

    // 6. 응답 생성
    return NextResponse.json({
      data: {
        id: issue.id,
        customer_id: issue.customer_id,
        customer: issue.customer,
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        status: issue.status,
        is_public: issue.is_public,
        created_by_id: issue.created_by_id,
        created_by: issue.created_by,
        assigned_to_id: issue.assigned_to_id,
        assigned_to: issue.assigned_to,
        treatment_method: issue.treatment_method,
        treatment_time_minutes: issue.treatment_time_minutes,
        treatment_result: issue.treatment_result,
        created_at: issue.created_at,
        completed_at: issue.completed_at,
        updated_at: issue.updated_at,
        attachments: attachments.map(a => ({
          id: a.id,
          file_name: a.file_name,
          file_path: a.file_path,
          file_size: a.file_size,
          uploaded_by_id: a.uploaded_by_id,
          uploaded_by_name: a.uploaded_by?.name,
          created_at: a.created_at,
        })),
        histories: histories.map(h => ({
          id: h.id,
          change_type: h.change_type,
          old_value: h.old_value,
          new_value: h.new_value,
          changed_by_id: h.changed_by_id,
          changed_by_name: h.changed_by?.name,
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
```

---

## 핵심 인터페이스

### 응답 (200 OK)

```typescript
interface IssueDetailResponse {
  data: {
    id: number;
    customer_id: number;
    customer: {
      id: number;
      name: string;
    };
    title: string;
    description: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    status: 'INTAKE' | 'IN_PROGRESS' | 'COMPLETED';
    is_public: number;
    created_by_id: number;
    created_by: {
      id: number;
      name: string;
    };
    assigned_to_id: number | null;
    assigned_to: {
      id: number;
      name: string;
      department_id: number;
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
      uploaded_by_name: string;
      created_at: Date;
    }>;
    histories: Array<{
      id: number;
      change_type: string;
      old_value: string | null;
      new_value: string | null;
      changed_by_id: number;
      changed_by_name: string;
      changed_at: Date;
      remark: string | null;
    }>;
  };
}
```

---

## Acceptance Criteria

- [ ] GET /api/issues/[id] 엔드포인트 정상 응답 (200 OK)
- [ ] 잘못된 ID 형식 시 400 응답
- [ ] Issue 없으면 404 응답
- [ ] ADMIN: 모든 Issue 조회 가능
- [ ] MANAGER: 같은 부서 담당자 Issue만 조회
- [ ] USER: 자신 생성/담당 + 부서 공개 Issue만 조회
- [ ] 권한 없으면 403 Forbidden
- [ ] 미인증 시 401 Unauthorized
- [ ] 첨부파일 정보 포함
- [ ] 이력 정보 포함 (최신순 정렬)
- [ ] 담당자/등록자 정보 포함

---

## 완료 체크리스트

- [ ] src/app/api/issues/[id]/route.ts 생성
- [ ] GET 메서드 구현
- [ ] Issue 존재 여부 검증
- [ ] 권한 검증 (RBAC)
- [ ] 첨부파일 조회
- [ ] 이력 조회 (DESC 정렬)
- [ ] 관계 데이터 포함
- [ ] TypeScript 빌드 성공
- [ ] ESLint 통과

---

**다음 문서**: 2051_06_PUT_issues_id_수정_API.md
