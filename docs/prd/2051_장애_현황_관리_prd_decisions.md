<!-- Generated: 2026-01-25 18:00:00 KST -->

# Decisions: 장애_현황_관리 (Issue Tracking)

문서번호: 2051
작성일: 2026-01-25
중재자: Claude Haiku 4.5
토론자료: 2051_장애_현황_관리_prd_discussion_topics.md

## Decision Summary

| Topic ID | Title | Decision | Rationale |
|----------|-------|----------|-----------|
| DT-01 | ON DELETE CASCADE vs RESTRICT | RESTRICT | sunjin-erp 정책 준수, 증거 보존, 감사 추적 |
| DT-02 | USER 조회 권한 범위 | 부서 기반 조회 (is_public) | 보안과 협업 균형, 부서 단위 현실적 운영 |
| DT-02-A | is_public 컬럼 추가 여부 | 추가 (Option A) | 조회 범위 제어, 민감한 정보 보호 |
| DT-02-B | is_public 기본값 | FALSE (비공개) | 보안 우선, "default secure" 원칙 |
| DT-03 | Rollback 허용 범위 | COMPLETED → IN_PROGRESS만 | 상태 흐름 명확, 완료 실수 수정용 |
| DT-04 | 처리 시간 입력 | 분 단위 단일 입력 | 구현 단순, 데이터 단일화, UI 포맷팅 |
| DT-05 | MANAGER 부서 제약 | 부서 제약 (Option A) | RBAC 철학, 부서 책임 명확화 |
| DT-06 | IN_PROGRESS 담당자 변경 | MANAGER도 가능 (재결정) | 부서 내 유연성, 이력 기록으로 추적 |
| DT-07 | Severity 변경 허용 | MANAGER/ADMIN만 변경 | 조사 후 조정 현실적 필요, 이력 추적 |
| DT-08 | 배지 필터링 동작 | AND 조합 | 직관적, 정제된 조회 |
| DT-09 | 파일 검증 시점 | 프론트엔드 + 서버 이중 | UX + 보안 균형 |
| DT-10 | TypeScript 타입 위치 | 단일 src/types/issue.ts | 단순성 (테이블 구조 단순함) |
| DT-11 | API 응답 포맷 | 성공/실패 포맷 분리 | 구조적, 명확함 |

---

## HIGH Priority Decisions (Blocking)

### DT-01: ON DELETE CASCADE vs ON DELETE RESTRICT

**Decision:** Option A - Use ON DELETE RESTRICT

**Rationale:**
- sunjin-erp 아키텍처 정책: "모든 외래키는 ON DELETE RESTRICT 필수" (CLAUDE.md 명시)
- 증거 보존: 고객 클레임/분쟁 시 첨부파일 필수 (법적 가치)
- 감사 추적: 장애 처리 이력 완전 보존
- 기존 ProjectAttachment 패턴과 일치
- 운영 비용 (한 단계 추가) < 법적 위험 및 규정 준수 이점

**Implementation:**

**1. 마이그레이션 수정:**
```sql
ALTER TABLE "ISSUE_ATTACHMENT"
  ADD CONSTRAINT fk_issue_attachment_issue
  FOREIGN KEY ("issue_id") REFERENCES "ISSUE"("id")
  ON DELETE RESTRICT;
```

**2. API DELETE /api/issues/[id] 검증 로직:**
```typescript
// DELETE /api/issues/[id]
const attachmentCount = await issueAttachmentRepo.count({
  where: { issue_id: issueId, deleted_at: IsNull() }
});

if (attachmentCount > 0) {
  return res.status(409).json({
    error: "Cannot delete issue with attachments",
    message: `Please remove ${attachmentCount} attachment(s) before deleting this issue`,
    attachmentCount
  });
}

// 이어서 soft delete 처리
await issueRepo.update(issueId, { deleted_at: new Date() });
```

**3. UI/UX 개선:**
- 삭제 다이얼로그에서 첨부파일 존재 시: "이 Issue에 2개 파일이 있습니다. 먼저 삭제하시겠습니까?"
- 자동 제안: 첨부파일 삭제 버튼 제시
- 혹은 다중 선택: 첨부파일과 Issue 동시 삭제 액션 제공 (but 순서 중요: 파일 삭제 → Issue 삭제)

**4. IssueHistory 기록:**
- 첨부파일 삭제 시: change_type="ATTACHMENT_DELETED", old_value="{file_name}"
- Issue 삭제 시: change_type="ISSUE_DELETED"

---

### DT-02: USER 권한 범위 명확화 - 조회 권한 정의

**Decision:** Option B - 부서 기반 조회 (with is_public flag)

**Rationale:**
- 보안(Option A 최소권한)과 협업(Option C 전사조회) 균형
- 부서 단위 팀 협업 현실적 필요 (예: 개발팀은 서로의 Issue 조회 가능)
- is_public 플래그로 민감한 정보 분리 가능
- sunjin-erp RBAC 철학 유지: 역할별 차등 접근

**구현:**
```typescript
// GET /api/issues - RBAC 기반 WHERE 절 동적 구성

if (user.role === 'ADMIN') {
  // ADMIN: 모든 장애 조회 가능
  whereConditions = [];
} else if (user.role === 'MANAGER') {
  // MANAGER: 같은 부서 장애만 조회 가능
  whereConditions.push(`"ISSUE"."assigned_to_id" IN (
    SELECT "id" FROM "EMPLOYEE" WHERE "department_id" = $1
  )`);
  params.push(user.department_id);
} else if (user.role === 'USER') {
  // USER: 자신이 생성/담당 또는 부서 내 공개 Issue만 조회
  whereConditions.push(`(
    "ISSUE"."created_by_id" = $1
    OR "ISSUE"."assigned_to_id" = $2
    OR ("ISSUE"."is_public" = 1 AND "ISSUE"."assigned_to_id" IN (
      SELECT "id" FROM "EMPLOYEE" WHERE "department_id" = $3
    ))
  )`);
  params.push(user.id, user.id, user.department_id);
}

const result = await queryBuilder
  .where(whereConditions.join(' AND '))
  .setParameters(params)
  .getMany();
```

---

### DT-02-A: is_public 컬럼 추가 여부

**Decision:** 추가 (Option A)

**Rationale:**
- DT-02 결정사항 구현 필수 조건
- 조회 범위 명확한 제어 가능
- 민감한 정보(특정 고객사 클레임, 기술적 취약점 등)는 비공개 설정 가능
- 향후 다양한 공개 정책 확장 가능 (예: "MANAGER만 공개", "전사 공개" 등)

**마이그레이션:**
```sql
ALTER TABLE "ISSUE" ADD "is_public" NUMBER(1) DEFAULT 0;
-- 0: 비공개 (자신과 담당자만 조회 가능)
-- 1: 공개 (같은 부서원 조회 가능)
```

---

### DT-02-B: is_public 기본값 결정

**Decision:** FALSE (0) - 비공개

**Rationale:**
- "보안 by default" 원칙 (sunjin-erp 보안 정책)
- 민감한 정보 실수로 노출 방지
- 정보 공개는 의도적 의사결정 후 진행
- 사용자가 필요 시 명시적으로 공개로 변경

**구현:**
```typescript
// Issue 생성 시
const newIssue = issueRepo.create({
  customer_id,
  title,
  description,
  severity,
  created_by_id: user.id,
  is_public: false, // 기본값: 비공개
  status: 'INTAKE'
});
await issueRepo.save(newIssue);
```

**UI 표시:**
- 상세 페이지: `공개 여부: [ ] 공개 (부서원 조회 가능)`
- 토글 기본값: OFF
- Tooltip: "체크 시 같은 부서원이 이 Issue를 조회할 수 있습니다"

---

### DT-03: 상태 되돌리기(Rollback) 허용 범위

**Decision:** Option A - COMPLETED → IN_PROGRESS만 허용

**Rationale:**
- 상태 흐름 명확화: INTAKE → IN_PROGRESS → COMPLETED (일방향)
- 되돌리기 목적 명확: "완료 실수" 수정 용도
- IN_PROGRESS는 재처리로 해결 (별도 담당자 할당 후 다시 처리)
- 상태 왕복으로 인한 책임 추적 복잡화 방지

**Implementation:**

**1. API PUT /api/issues/[id]/rollback 추가:**
```typescript
// PUT /api/issues/[id]/rollback (ADMIN 전용)
if (user.role !== 'ADMIN') {
  return res.status(403).json({ error: 'Forbidden' });
}

const issue = await issueRepo.findOne({ where: { id: issueId } });
if (issue.status !== 'COMPLETED') {
  return res.status(400).json({
    error: 'Invalid rollback',
    message: 'Only COMPLETED issues can be rolled back'
  });
}

// 상태 변경
issue.status = 'IN_PROGRESS';
await issueRepo.save(issue);

// 히스토리 기록
await issueHistoryRepo.save({
  issue_id: issueId,
  change_type: 'STATUS_ROLLBACK',
  old_value: 'COMPLETED',
  new_value: 'IN_PROGRESS',
  changed_by_id: user.id,
  changed_at: new Date(),
  remark: 'Rolled back by admin'
});
```

**2. UI 변경:**
- 상세 페이지: 상태가 COMPLETED인 경우 [상태 되돌리기] 버튼 표시 (ADMIN만)
- 클릭 시 확인 다이얼로그: "이 Issue를 진행중 상태로 되돌리시겠습니까?"
- 성공 시: "Issue 상태가 진행중으로 변경되었습니다" 토스트 알림

**3. IssueHistory 변경:**
- change_type 추가: `STATUS_ROLLBACK`

---

### DT-04: 처리 시간 입력 방식

**Decision:** Option A - 분 단위 단일 입력

**Rationale:**
- 구현 단순성: 두 필드 검증 로직 불필요
- 데이터 무결성: 단일 단위(분)로 저장
- UI 포맷팅으로 사용자 경험 개선: "2시간 30분"으로 표시
- 실시간 포맷팅으로 사용자 편의성 확보

**Implementation:**

**1. DB 유지:**
```sql
"treatment_time_minutes" NUMBER(5) -- 최대 99999분 (약 69일)
-- 검증: 1 <= value <= 1440 (1분 ~ 24시간)
```

**2. API 검증:**
```typescript
if (!treatment_time_minutes ||
    treatment_time_minutes < 1 ||
    treatment_time_minutes > 1440) {
  return res.status(400).json({
    error: 'Invalid treatment time',
    message: 'Treatment time must be between 1 and 1440 minutes'
  });
}
```

**3. UI 입력 필드:**
```tsx
// IssueDetailDialog.tsx
<Input
  type="number"
  min="1"
  max="1440"
  placeholder="입력 (분 단위)"
  value={treatmentMinutes}
  onChange={(e) => setTreatmentMinutes(parseInt(e.target.value) || 0)}
  helperText="1~1440분 입력 (예: 150분 = 2시간 30분)"
/>

// 실시간 포맷팅
{treatmentMinutes > 0 && (
  <span className="text-sm text-gray-500">
    약 {Math.floor(treatmentMinutes / 60)}시간 {treatmentMinutes % 60}분
  </span>
)}
```

**4. 표시 포맷:**
```typescript
// 목록 테이블, 상세 페이지에서
const formatTreatmentTime = (minutes: number): string => {
  if (!minutes) return '—';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}분`;
  if (mins === 0) return `${hours}시간`;
  return `${hours}시간 ${mins}분`;
};

// 사용 예
<span>{formatTreatmentTime(150)}</span> // "2시간 30분"
```

---

### DT-05: MANAGER의 담당자 할당 권한 - 부서 제약

**Decision:** Option A - 부서 제약 (엄격한 경계)

**Rationale:**
- sunjin-erp RBAC 철학: 부서별 권한 분리
- 부서장 권한 강화: 자신의 부서 인력 관리만
- 권한 남용 방지: 다른 부서 직원 간섭 불가
- 부서 간 협업이 필요한 경우 ADMIN이 직접 할당

**Implementation:**

**1. API PUT /api/issues/[id] - 담당자 할당 검증:**
```typescript
if (assigneeId) {
  const assignee = await employeeRepo.findOne({
    where: { id: assigneeId },
    relations: ['department']
  });

  if (!assignee) {
    return res.status(400).json({ error: 'Employee not found' });
  }

  if (user.role === 'MANAGER' && assignee.department_id !== user.department_id) {
    return res.status(400).json({
      error: 'Cannot assign employee from another department',
      message: `Manager can only assign employees in department "${userDept.name}"`
    });
  }

  // ADMIN은 제약 없음
}
```

**2. 담당자 선택 드롭다운 필터:**
```typescript
// IssueDetailDialog.tsx - MANAGER가 담당자 드롭다운 클릭 시
const availableAssignees = user.role === 'ADMIN'
  ? await getAllEmployees()
  : await getEmployeesByDepartment(user.department_id);

// UI에 현재 부서 직원만 표시
<Select
  items={availableAssignees}
  label="담당자"
  disabled={user.role === 'USER'} // USER는 선택 불가
/>
```

**3. 운영 가이드:**
- MANAGER: 자신의 부서 내 인력 관리만
- 부서 간 협업 필요 시: ADMIN 또는 상위 부서장 권한으로 할당
- 긴급 상황: ADMIN에 요청

---

### DT-06: IN_PROGRESS 상태에서 담당자 변경 권한

**Decision:** Option B - MANAGER도 가능 (부서 내 인력만)

**Rationale (재결정):**
- 원본 Decision: Option A (ADMIN만)
- 재검토: 부서 내 인력 재조정 유연성 필요
- 이력 기록으로 변경 추적 가능
- DT-05 (부서 제약)와 조합하면 보안 유지

**실제 권한 매트릭스:**
- ADMIN: IN_PROGRESS 상태에서도 담당자 변경 가능 (모든 직원)
- MANAGER: IN_PROGRESS 상태에서 담당자 변경 가능 (같은 부서 직원만)
- USER: IN_PROGRESS 상태에서 담당자 변경 불가

**Implementation:**

**1. API 검증 로직:**
```typescript
// PUT /api/issues/[id]
if (newAssigneeId && newAssigneeId !== issue.assigned_to_id) {
  if (issue.status === 'IN_PROGRESS') {
    if (user.role === 'USER') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'USER cannot change assignee for in-progress issues'
      });
    }

    if (user.role === 'MANAGER') {
      // MANAGER: 같은 부서 직원만 할당 가능
      const newAssignee = await employeeRepo.findOne({
        where: { id: newAssigneeId }
      });
      if (newAssignee.department_id !== user.department_id) {
        return res.status(400).json({
          error: 'Cannot assign employee from another department'
        });
      }
    }
  }

  // 변경 허용
  const oldAssignee = await employeeRepo.findOne({ where: { id: issue.assigned_to_id } });
  issue.assigned_to_id = newAssigneeId;
  await issueRepo.save(issue);

  // 히스토리 기록
  await issueHistoryRepo.save({
    issue_id: issueId,
    change_type: 'ASSIGNEE_CHANGE',
    old_value: oldAssignee?.name,
    new_value: newAssignee?.name,
    changed_by_id: user.id,
    changed_at: new Date()
  });
}
```

**2. UI 제어:**
```tsx
// 담당자 변경 드롭다운 활성화 조건
const canChangeAssignee = user.role === 'ADMIN' ||
  (user.role === 'MANAGER' && issue.status !== 'IN_PROGRESS') ||
  (user.role === 'MANAGER' && issue.status === 'IN_PROGRESS');

// 마찬가지로 USER는 항상 선택 불가
<Select
  disabled={user.role === 'USER' || !canChangeAssignee}
/>
```

---

## MEDIUM Priority Decisions (Non-Blocking)

### DT-07: 심각도(Severity) 변경 허용 범위

**Decision:** Option B - MANAGER/ADMIN만 변경 가능 (완료 전까지)

**Rationale:**
- 조사 후 심각도 조정 현실적 필요 (초기 평가 오류 수정)
- MANAGER/ADMIN 승인 하에 제한적 변경
- 이력 기록(SEVERITY_CHANGE)으로 변경 추적 가능
- USER는 변경 불가 (조회만)

**Implementation:**

**1. API 검증:**
```typescript
// PUT /api/issues/[id]
if (newSeverity && newSeverity !== issue.severity) {
  if (user.role === 'USER') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'USER cannot change severity'
    });
  }

  if (issue.status === 'COMPLETED') {
    return res.status(400).json({
      error: 'Cannot change severity for completed issues'
    });
  }

  // MANAGER/ADMIN: 변경 허용
  const oldSeverity = issue.severity;
  issue.severity = newSeverity;
  await issueRepo.save(issue);

  // 히스토리 기록
  await issueHistoryRepo.save({
    issue_id: issueId,
    change_type: 'SEVERITY_CHANGE',
    old_value: oldSeverity,
    new_value: newSeverity,
    changed_by_id: user.id,
    changed_at: new Date()
  });
}
```

**2. UI 제어:**
```tsx
// 심각도 선택 드롭다운
<Select
  disabled={user.role === 'USER' || issue.status === 'COMPLETED'}
  label="심각도"
/>
```

---

### DT-08: 배지 필터링 동작

**Decision:** Option A - AND 조합

**Rationale:**
- 직관적: 배지는 현재 필터 범위 내 상태 분류
- 정제된 조회: A사의 HIGH 심각도 중 완료된 것 (좀 더 정확한 조회)
- 사용자 기대치: "이 조건에서 완료된 것만 보고 싶어" → 배지 클릭

**Implementation:**

**1. 필터 상태 업데이트:**
```typescript
// IssueFilters.tsx (Zustand store)
const handleBadgeClick = (status: string) => {
  // 현재 필터 유지, status만 추가
  setFilters({
    ...filters,
    status: [status]
  });
};

// 쿼리 파라미터
const params = {
  customer_id: filters.customer_id,
  severity: filters.severity?.join(','),
  status: filters.status?.join(','),
  assignee_id: filters.assignee_id,
  ...
};
```

**2. URL 반영:**
```
기존: ?customer_id=123&severity=HIGH
배지 클릭 (완료): ?customer_id=123&severity=HIGH&status=COMPLETED
```

---

### DT-09: 파일 검증 시점

**Decision:** Option A + B - 프론트엔드 + 서버 이중 검증

**Rationale:**
- 프론트엔드: 사용자 피드백 즉시화, 불필요한 업로드 방지
- 서버: 보안 검증, 클라이언트 우회 방지
- "믿지 말되 확인하라" 보안 원칙

**Implementation:**

**1. 프론트엔드 검증 (파일 선택 시):**
```typescript
// FileUpload.tsx
const handleFileSelect = (files: FileList) => {
  const validFiles: File[] = [];
  const errors: string[] = [];

  Array.from(files).forEach((file) => {
    // MIME type 검증
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      errors.push(`${file.name}: 지원하지 않는 파일 형식`);
      return;
    }

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      errors.push(`${file.name}: 파일 크기 초과 (최대 10MB)`);
      return;
    }

    validFiles.push(file);
  });

  if (errors.length > 0) {
    errors.forEach(err => toast.error(err));
  }

  setSelectedFiles(validFiles);
};
```

**2. 서버 검증 (업로드 시):**
```typescript
// POST /api/issues/[id]/attachments
const file = req.file;

// MIME type 재검증
const allowedMimeTypes = ['application/pdf', ...];
if (!allowedMimeTypes.includes(file.mimetype)) {
  return res.status(400).json({
    error: 'Invalid MIME type',
    message: `Allowed types: ${allowedMimeTypes.join(', ')}`
  });
}

// 파일 크기 재검증
if (file.size > 10 * 1024 * 1024) {
  return res.status(400).json({
    error: 'File size exceeds limit',
    message: 'Maximum file size is 10MB'
  });
}

// 확장자 화이트리스트 검증
const allowedExtensions = ['pdf', 'docx', 'xlsx', 'pptx', 'jpg', 'png', 'gif'];
const ext = file.originalname.split('.').pop()?.toLowerCase();
if (!allowedExtensions.includes(ext || '')) {
  return res.status(400).json({
    error: 'Invalid file extension'
  });
}

// 파일 저장
const filename = `${issueId}_${Date.now()}_${file.originalname}`;
const filepath = path.join(process.env.UPLOAD_DIR, 'issues', filename);
fs.writeFileSync(filepath, file.buffer);

// DB 저장
await issueAttachmentRepo.save({
  issue_id: issueId,
  file_name: file.originalname,
  file_path: filepath,
  file_size: file.size,
  uploaded_by_id: user.id
});
```

---

## LOW Priority Decisions (Refinements)

### DT-10: TypeScript 타입 정의 위치

**Decision:** 단일 src/types/issue.ts

**Rationale:**
- Issue 도메인 구조 단순 (테이블 3개: Issue, IssueAttachment, IssueHistory)
- 파일 하나에서 관리 용이
- 파일 크기 작음 (estimated ~200 lines)
- 향후 필요 시 분리 (evolution)

**File Structure:**
```
src/types/issue.ts
├── interface Issue
├── interface IssueAttachment
├── interface IssueHistory
├── type Severity
├── type IssueStatus
├── enum SEVERITY_OPTIONS
└── enum STATUS_OPTIONS
```

---

### DT-11: API 응답 포맷 표준화

**Decision:** 성공/실패 포맷 분리 (Option A)

**Rationale:**
- 구조적, 명확함
- 클라이언트에서 타입 분리 용이
- 성공/실패 핸들링 직관적

**Format:**

**성공 응답:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "title": "DB 연결 오류",
    ...
  }
}
```

**실패 응답:**
```json
{
  "success": false,
  "error": "INVALID_INPUT",
  "message": "Customer not found",
  "statusCode": 400
}
```

---

## IssueHistory 변경 타입 확장

기존 문서에서 정의한 change_type:
- STATUS_CHANGE
- ASSIGNEE_CHANGE
- COMMENT_ADDED

추가 정의 (결정사항 반영):
- **STATUS_ROLLBACK**: COMPLETED → IN_PROGRESS 롤백
- **SEVERITY_CHANGE**: 심각도 변경
- **ATTACHMENT_DELETED**: 첨부파일 삭제
- **ATTACHMENT_UPLOADED**: 첨부파일 업로드

---

## Summary of Changes to PRD

### Section 5.3 (Database Design)

**추가 사항:**
1. ISSUE 테이블에 `is_public` 컬럼 추가 (NUMBER(1) DEFAULT 0)
2. ISSUE_ATTACHMENT FK 변경: ON DELETE RESTRICT
3. ISSUE_HISTORY.change_type 확장: STATUS_ROLLBACK, SEVERITY_CHANGE, ATTACHMENT_DELETED, ATTACHMENT_UPLOADED

### Section 5.5 (Authentication & Authorization)

**구체화 사항:**
1. USER 조회 권한: is_public 플래그 기반 부서 조회
2. ADMIN 롤백 권한: COMPLETED → IN_PROGRESS만
3. MANAGER 제약: 부서 내 담당자 할당만, IN_PROGRESS 상태에서도 담당자 변경 가능 (같은 부서만)
4. USER: IN_PROGRESS 상태 담당자 변경 불가

### Section 6 (UI/UX Considerations)

**추가 사항:**
1. 상세 페이지: is_public 토글 추가
2. 상세 페이지: 상태가 COMPLETED인 경우 [상태 되돌리기] 버튼 (ADMIN만)
3. 처리 시간 입력: 분 단위 단일 입력, 실시간 포맷팅 "2시간 30분"
4. 첨부파일 업로드: 프론트엔드 + 서버 이중 검증

### Section 3 (User Stories)

**변경/추가:**
- US-1 수정: is_public 기본값 FALSE 명시
- US-2 수정: MANAGER는 부서 내 직원에게만 할당
- US-3 수정: 처리 시간은 분 단위 단일 입력
- US-6 추가: DT-08 (AND 필터링) 명시
- US-8 수정: 상태 되돌리기 ADMIN만 가능, COMPLETED → IN_PROGRESS만
- US-9 수정: USER 조회 권한 명확화 (is_public 플래그 로직)
- 추가 US-11: ADMIN이 Issue 상태를 되돌릴 수 있다 (감시 감사 기록)

---

## Implementation Priority & Phasing

### Phase 1 (Blocking for development start)
- ✅ DT-01: ON DELETE RESTRICT 마이그레이션
- ✅ DT-02 & DT-02-A & DT-02-B: is_public 컬럼 추가 및 권한 로직
- ✅ DT-05: MANAGER 부서 제약 API 검증

### Phase 2 (Can develop in parallel)
- ✅ DT-03: 상태 롤백 API (PUT /api/issues/[id]/rollback)
- ✅ DT-04: 처리 시간 입력 포맷 (분 단위)
- ✅ DT-06: IN_PROGRESS 담당자 변경 권한 검증

### Phase 3 (Can develop after Phase 1/2)
- ✅ DT-07: 심각도 변경 권한 (MANAGER/ADMIN만)
- ✅ DT-08: 배지 필터링 (AND 조합)
- ✅ DT-09: 파일 검증 (프론트엔드 + 서버)
- ✅ DT-10: TypeScript 타입 (단일 파일)
- ✅ DT-11: API 응답 포맷 (성공/실패 분리)

---

## Conclusion

**모든 HIGH Priority 결정사항 확정:**
- 아키텍처 정책(ON DELETE RESTRICT, RBAC) 준수
- 데이터 무결성 및 감사 추적 보장
- 보안과 협업의 균형
- 구현 가능한 명확한 요구사항

**PRD는 개발 착수 준비 완료**
- 모든 결정사항 IssueHistory 변경 타입 추가로 구현 가능
- 권한 검증 로직 명확
- UI/UX 개선사항 정의

작성자: Claude Haiku 4.5
작성일: 2026-01-25
상태: 개발 착수 준비 완료
