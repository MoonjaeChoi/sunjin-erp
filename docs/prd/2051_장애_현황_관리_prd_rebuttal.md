<!-- Generated: 2026-01-25 17:00:00 KST -->

# Rebuttal: 장애 현황 관리 (Issue Tracking)

문서번호: 2051
작성일: 2026-01-25
회신자: Claude Haiku 4.5
원본문서: 2051_장애_현황_관리_prd.md
검토문서: 2051_장애_현황_관리_prd_critical_review.md

---

## 1. Overview

본 회신 문서는 Critical Review에서 제기된 4개의 HIGH Priority 이슈, 6개의 MEDIUM Priority 이슈, 4개의 LOW Priority 이슈에 대한 재검토 및 입장을 정리한다.

**핵심 입장:**
- **HIGH Priority 4개 이슈는 모두 정당한 지적이며, 전면 수정에 동의함**
- **MEDIUM Priority 이슈 중 3개(3.1, 3.2, 3.3)는 추가 상세화 필요, 3개(3.4, 3.5, 3.6)는 명확화 필요**
- **LOW Priority 이슈는 구현 시 가이드 문서로 포함하는 것이 적절**

---

## 2. HIGH Priority Issue Responses

### Response to Issue 2.1: ON DELETE CASCADE 위반

**검토자 지적사항:** ISSUE_ATTACHMENT의 ON DELETE CASCADE가 sunjin-erp 아키텍처 규칙 위반

**재검토 결과:** ✅ **검토자의 지적이 정당함. 전면 수정 동의**

**상세 분석:**

원래 설계 의도는 "Issue 삭제 시 관련 첨부파일도 자동 정리"였으나, 실제 운영 환경을 고려하면 다음 문제가 발생한다:

1. **감사 추적(Audit Trail) 손실:** Issue 관련 증거 자료(첨부파일)가 자동 삭제되면, 사후 분쟁(클레임) 발생 시 증거 부족
2. **규정 준수:** sunjin-erp 정책의 "모든 외래키는 ON DELETE RESTRICT" 규칙 위반
3. **소프트 삭제 원칙 위반:** Issue는 soft delete인데, 첨부파일만 물리 삭제되는 불일치

**변경사항:**

```sql
-- 변경 전
ISSUE_ATTACHMENT.issue_id → ISSUE.id (ON DELETE CASCADE)

-- 변경 후
ISSUE_ATTACHMENT.issue_id → ISSUE.id (ON DELETE RESTRICT)
```

**구현 영향:**

- DELETE /api/issues/[id] route에서 사전 검증 추가:
  ```typescript
  // Issue 삭제 전 첨부파일 확인
  const attachmentCount = await issueAttachmentRepository.count({
    where: { issueId: id, deletedAt: IsNull() }
  });

  if (attachmentCount > 0) {
    return res.status(409).json({
      error: "Cannot delete issue with attachments. Remove files first.",
      code: "ATTACHMENTS_EXIST"
    });
  }
  ```

**이력 기록:** IssueHistory에 삭제 시도 기록 필요

---

### Response to Issue 2.2: RBAC 정의 모호성 (USER 권한)

**검토자 지적사항:** US-9와 섹션 5.5의 USER 권한 정의가 모순. "공개 데이터" 정의 모호.

**재검토 결과:** ✅ **검토자의 지적이 정당함. 명확한 재정의 필요**

**문제 진단:**

원본 PRD의 모호한 부분:
- US-9: "USER: 조회, 신규 등록만 가능 (수정은 담당자 또는 MANAGER만)"
- 섹션 5.5: "USER: 공개 데이터 (자신이 등록한 또는 할당된 경우)"

이 두 문장이 "할당된 Issue를 수정할 수 있는가?"에 대해 상충한다.

**변경사항 - USER 권한의 명확한 재정의:**

```
조회 권한:
  1) 자신이 생성한 Issue (created_by_id = current_user.id)
  2) 자신에게 할당된 Issue (assigned_to_id = current_user.id)
  3) 동일 부서 공개 Issue (is_public = true AND department_id = current_dept)
     → 단, is_public 플래그가 schema에 필요 (신규 추가)

생성 권한:
  - 제한 없음 (모든 고객사의 Issue 생성 가능)
  - 단, 자신의 부서로만 생성 가능 (created_by_id의 부서)

수정 권한:
  - 제목/설명: 자신이 생성한 Issue만 수정 가능
  - 처리 정보(방법, 시간, 결과): 할당받은 경우만 수정 가능
  - 상태 변경: INTAKE → IN_PROGRESS는 할당자 가능
            IN_PROGRESS → COMPLETED는 MANAGER 이상
  - 담당자 할당: 불가 (MANAGER/ADMIN만)
```

**Schema 변경 필요:**
```sql
-- Issue 테이블에 추가 컬럼
ALTER TABLE "ISSUE" ADD "is_public" NUMBER(1) DEFAULT 0;
-- 기본값: 0 (비공개), 1 (공개)
```

**구현 시 고려:**
- 비공개 Issue는 자신과 담당자만 조회 가능
- 부서 내 공개 설정으로 정보 공유 확대

---

### Response to Issue 2.3: 상태 되돌리기(Rollback) 정책 미정의

**검토자 지적사항:** "상태 되돌리기 가능 (ADMIN만)"이라고만 명시되고, 구체적인 상태 전이 규칙과 데이터 처리 방식 미정의

**재검토 결과:** ✅ **검토자의 지적이 정당함. 상세 정책 명시 필요**

**원본 의도:** 실수로 "완료"로 표시된 Issue를 "진행중"으로 되돌릴 수 있도록 함

**변경사항 - 상태 되돌리기 정책 명확화:**

```
상태 되돌리기(Rollback) 정책:

1) 실행 권한: ADMIN만 가능
   - API: PUT /api/issues/[id]/rollback
   - 또는: PUT /api/issues/[id] with { action: "rollback" }

2) 허용 상태 전이:
   - COMPLETED → IN_PROGRESS (만 가능)
   - IN_PROGRESS → INTAKE (조건부: 담당자 미지정 또는 다시 할당 시)
   - 다른 전이는 불가 (예: COMPLETED → INTAKE 불가, 순차 필수)

3) Rollback 시 데이터 처리:
   - completed_at → NULL (완료 시간 초기화)
   - treatment_result 유지 (기록 보존 목적)
   - treatment_time_minutes 유지 (기록 보존 목적)
   - treatment_method 유지 (기록 보존 목적)
   - updated_at → SYSTIMESTAMP (업데이트 시간만 변경)

4) IssueHistory 기록:
   - change_type: "ROLLBACK"
   - old_value: "COMPLETED"
   - new_value: "IN_PROGRESS"
   - remark: "Admin rollback - Issue reopened for further investigation"

5) 제약사항:
   - INTAKE 상태의 Issue는 rollback 불가
   - 30일 이상 완료된 Issue의 rollback은 신중히 검토 필요
     (수정이력 조회로 완료 후 변경 내역 확인 권장)
```

**API 응답 예시:**
```json
// PUT /api/issues/123/rollback
// 성공 (200 OK)
{
  "success": true,
  "data": {
    "id": 123,
    "status": "IN_PROGRESS",
    "completedAt": null,
    "updatedAt": "2026-01-25T17:00:00Z"
  }
}

// 실패 (400 Bad Request)
{
  "success": false,
  "error": "Cannot rollback INTAKE status issue",
  "code": "INVALID_ROLLBACK_STATE"
}
```

**운영 가이드:**
- Rollback은 "조사 재개" 시나리오에만 사용
- 상태를 여러 번 오락가락하면 추적이 어렵므로 최소화 권장
- 첨부파일은 그대로 유지 (추가 증거 자료 첨부 가능)

---

### Response to Issue 2.4: 담당자 변경 시 권한 검증 불충분

**검토자 지적사항:** MANAGER가 담당자를 할당할 때 부서 제약이 명시되지 않음. 처리 중 장애의 담당자 변경 규칙도 불명확.

**재검토 결과:** ✅ **검토자의 지적이 정당함. 담당자 할당 권한 명확화 필요**

**원본 설계 문제:**
- US-2: "MANAGER 역할로서, 부서 내 장애를 담당자에게 할당할 수 있다"
- 해석 오류: MANAGER가 다른 부서 직원에게도 할당 가능할 수 있음

**변경사항 - 담당자 할당 권한 정의:**

```
담당자 할당(Assign) 권한:

1) ADMIN:
   - 모든 직원(모든 부서)에게 할당 가능
   - 제약 없음

2) MANAGER:
   - 자신의 부서 소속 직원에게만 할당 가능
   - 다른 부서 직원 선택 시 → 400 Bad Request 반환
   - 예: 개발팀 MANAGER는 개발팀 직원에게만 할당 가능

3) USER:
   - 담당자 할당 불가 (읽기 전용)

담당자 변경 시점별 규칙:

1) INTAKE 상태:
   - ADMIN/MANAGER: 자유롭게 변경 가능
   - 변경 로그: "담당자 미지정 → 김철수" 기록

2) IN_PROGRESS 상태:
   - ADMIN만 변경 가능 (MANAGER는 불가)
   - MANAGER가 변경 시도 시 → 403 Forbidden
   - 사유: 진행 중인 업무 책임 추적을 위함

3) COMPLETED 상태:
   - ADMIN만 변경 가능 (매우 드문 케이스)
   - 히스토리 자동 생성: "담당자 변경 (완료 후) - 부실 처리 조사"

담당자 변경 시 처리 정보 처리:

1) 변경 시점이 INTAKE 상태:
   - 처리 정보(treatment_*) 초기화 불필요 (아직 미입력)

2) 변경 시점이 IN_PROGRESS/COMPLETED:
   - 기존 처리 정보 유지 (누가 진행했는지 기록 필요)
   - 새로운 담당자는 기존 처리 정보 참고
   - 추가 처리 필요 시 새로운 처리 정보 입력 가능
```

**API 구현:**
```typescript
// PUT /api/issues/[id] - assignee 변경
const session = await auth();
const issueManager = new IssueManager(repo);

// 권한 검증
if (session.user.role === 'MANAGER') {
  const managerDept = session.user.departmentId;
  const assigneeDept = await getEmployeeDepartment(newAssigneeId);

  if (managerDept !== assigneeDept) {
    return res.status(400).json({
      error: "Cannot assign employee from another department",
      code: "PERMISSION_DENIED"
    });
  }
}

// 상태별 권한 확인
const issue = await issueManager.findById(id);
if (issue.status === 'IN_PROGRESS' && session.user.role !== 'ADMIN') {
  return res.status(403).json({
    error: "Cannot reassign ongoing issue - ADMIN only",
    code: "INVALID_STATE_FOR_CHANGE"
  });
}
```

---

## 3. MEDIUM Priority Improvement Responses

### Response to Issue 3.1: 파일 업로드 검증 로직 불완전

**검토자 지적사항:** "PDF, Excel, Word, 이미지 등"이 모호하고, 정확한 MIME type 화이트리스트와 이중 확장자 사기(double extension) 처리 방법 불명시

**재검토 결과:** ✅ **검토자의 지적이 정당하며, 상세 보안 기준 추가 동의**

**변경사항:**

```
파일 업로드 보안 상세 정의 (섹션 5.6 추가):

1) 허용 MIME type 화이트리스트 (명확화):
   - application/pdf (PDF)
   - application/msword (DOC)
   - application/vnd.openxmlformats-officedocument.wordprocessingml.document (DOCX)
   - application/vnd.ms-excel (XLS)
   - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (XLSX)
   - application/vnd.ms-powerpoint (PPT)
   - application/vnd.openxmlformats-officedocument.presentationml.presentation (PPTX)
   - image/jpeg (JPG/JPEG)
   - image/png (PNG)
   - image/gif (GIF)
   - image/webp (WebP)

2) 파일명 검증:
   - 확장자 추출: 마지막 . 이후 문자 (예: "file.pdf" → "pdf")
   - 이중 확장자 감지: .pdf.exe → 거부
   - 특수문자 제거: /\:*?"<>| → 공백으로 변환
   - 공백 정규화: 연속 공백 → 단일 공백

3) MIME type 검증 (이중 검증):
   - 파일 확장자와 MIME type 일치 확인
   - 불일치 예:
     - 확장자: .pdf, MIME: image/png → 거부
     - 확장자: .exe, MIME: application/pdf → 거부

4) 파일 크기 제약:
   - 개별 파일: 최대 10MB
   - 누적 파일 크기(Issue당): 최대 50MB (5개 파일 기준)
   - 동시 업로드: 최대 5개

5) API 응답 코드:
   - 400 Bad Request: MIME type 불일치, 확장자 제한
   - 413 Payload Too Large: 파일 크기 > 10MB
   - 422 Unprocessable Entity: 파일 개수 > 5개
   - 429 Too Many Requests: 동시 업로드 수 초과

6) 백엔드 구현:
   - 업로드 전: 파일 헤더(magic number) 검증
   - 저장 위치: UPLOAD_DIR/issues/[issueId]/[timestamp]_[randomId]_[filename]
   - 파일명 난독화: 원본 파일명 저장하지만 저장 경로는 변경
```

**구현 예시:**
```typescript
// lib/file-validation.ts
const ALLOWED_MIMES = {
  'pdf': 'application/pdf',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'jpg': 'image/jpeg',
  'png': 'image/png',
};

function validateFileUpload(file: File): { valid: boolean; error?: string } {
  // 1) 확장자 검증
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_MIMES[ext]) {
    return { valid: false, error: 'Extension not allowed' };
  }

  // 2) MIME type 검증
  const expectedMime = ALLOWED_MIMES[ext];
  if (file.type !== expectedMime) {
    return { valid: false, error: 'MIME type mismatch' };
  }

  // 3) 크기 검증
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'File size exceeds 10MB' };
  }

  return { valid: true };
}
```

---

### Response to Issue 3.2: 처리 시간(treatment_time_minutes) 입력 방식 모호

**검토자 지적사항:** UI는 "시간 or 분" 선택 가능, DB는 treatment_time_minutes 고정으로 모호. 입력 제약도 불명확.

**재검토 결과:** ✅ **검토자의 지적이 타당하며, 입력 방식 명확화 필요**

**변경사항:**

```
처리 시간 입력 방식 명확화 (섹션 3 US-3 수정):

권장 방식: 분 단위 단일 입력 (단순성 우선)

1) UI 입력 필드:
   - 라벨: "처리 시간 (분)" 또는 "처리 시간"
   - 입력: 숫자 필드, 0 ~ 1440 범위 (최대 24시간)
   - 예: 150분 입력 → DB에 150 저장

2) 유효성 검사:
   - 최소값: 1분 이상
   - 최대값: 1440분 (24시간)
   - 소수점 입력 불가 (정수만)
   - 음수 입력 불가

3) 디스플레이 (프론트엔드 포맷팅):
   - DB: 150분 저장
   - 표시: "2시간 30분" (포맷팅)
   - 함수: formatMinutesToHourMin(minutes)
   ```typescript
   function formatMinutesToHourMin(minutes: number): string {
     const hours = Math.floor(minutes / 60);
     const mins = minutes % 60;
     return `${hours}시간 ${mins}분`.replace('0시간 ', '').trim();
   }
   ```

4) 접근성:
   - input[type="number"]으로 스크린 리더 지원
   - 범위 표시: "1분 ~ 1440분"
   - 팁 텍스트: "(최대 24시간)"

대안 방식: 시간/분 분리 입력 (더 정확하지만 복잡)

만약 사용자 편의를 위해 시간/분 분리 필요 시:
1) Hours 필드 (0-24)
2) Minutes 필드 (0-59)
3) 검증:
   - Hours >= 0 && Hours <= 24
   - Minutes >= 0 && Minutes < 60
   - (Hours === 24 && Minutes > 0) → 에러
4) DB 저장: (Hours * 60) + Minutes
```

**선택 권고:** 분 단위 단일 입력으로 진행 (단순함과 실수 방지)

---

### Response to Issue 3.3: 변경 이력(IssueHistory) 기록 범위 불명확

**검토자 지적사항:** IssueHistory.change_type이 STATUS_CHANGE, ASSIGNEE_CHANGE, COMMENT_ADDED만 제시되는데, 처리 정보 변경, 파일 첨부, 심각도 변경 등은 어떻게 기록할지 불명확

**재검토 결과:** ✅ **검토자의 지적이 정당하며, change_type 값 확장 필요**

**변경사항:**

```
IssueHistory.change_type 확장 정의:

필수 기록 사항:
1) STATUS_CHANGE
   - 상태 전이 (INTAKE → IN_PROGRESS 등)
   - old_value: 이전 상태
   - new_value: 새 상태
   - 예: INTAKE → IN_PROGRESS

2) ASSIGNEE_CHANGE
   - 담당자 할당/변경
   - old_value: 이전 담당자 ID 또는 "Unassigned"
   - new_value: 새 담당자 ID 또는 "Unassigned"
   - 예: Unassigned → 123 (직원 ID)

3) TREATMENT_INFO_CHANGE
   - 처리 방법, 소요 시간, 처리 결과 변경 시 기록
   - old_value: JSON 형식 (복수 필드 변경 시)
     ```json
     { "method": "REMOTE", "timeMinutes": 120 }
     ```
   - new_value: JSON 형식
   - 예: 처리 방법만 변경 또는 시간만 변경

4) FILE_ATTACHED
   - 파일 첨부
   - old_value: null 또는 ""
   - new_value: 파일명 (또는 파일 ID)
   - remark: 파일 크기 정보 등 추가 정보

5) FILE_REMOVED
   - 파일 삭제
   - old_value: 파일명
   - new_value: null
   - remark: 삭제 사유 (선택)

6) SEVERITY_CHANGE
   - 심각도 변경 (등록 후 재조정 필요 시)
   - old_value: CRITICAL, HIGH 등
   - new_value: HIGH, MEDIUM 등
   - 주의: 등록 후 심각도 변경은 제한적 허용 (MANAGER/ADMIN만)

7) DESCRIPTION_UPDATED
   - 설명/제목 변경 (등록 후 수정)
   - old_value: 이전 텍스트 (전체 또는 요약)
   - new_value: 새 텍스트
   - 주의: 등록자만 수정 가능

8) ROLLBACK
   - 상태 되돌리기 (ADMIN만)
   - old_value: 이전 상태 (보통 COMPLETED)
   - new_value: 새 상태 (보통 IN_PROGRESS)
   - remark: 되돌리기 사유

설계 권고:
- 모든 변경 사항을 IssueHistory에 기록 (감시 감사용)
- 변경 대상별로 change_type 구분
- 한 번에 여러 필드가 변경되면 TREATMENT_INFO_CHANGE처럼 복수 기록 또는 각각 기록
```

**구현 시 고려:**
```typescript
// API route에서 변경 후 즉시 기록
async function recordHistoryChange(
  issueId: number,
  changeType: string,
  oldValue: string | null,
  newValue: string,
  changedById: number,
  remark?: string
) {
  await issueHistoryRepository.save({
    issueId,
    changeType,
    oldValue,
    newValue,
    changedById,
    changedAt: new Date(),
    remark
  });
}
```

---

### Response to Issue 3.4: 대시보드 요약 배지 필터링 동작 미정의

**검토자 지적사항:** 배지 클릭 시 기존 필터와의 관계가 명확하지 않음. AND 조합 vs 필터 초기화 여부 불명확

**재검토 결과:** ✅ **검토자의 지적이 타당하며, 배지 동작 명확화 필요**

**변경사항:**

```
배지 클릭 동작 정의 (섹션 US-6 수정):

권장 방식: AND 조합 (더 직관적)

1) 현재 상황 예시:
   - 현재 필터: customer_id=A, severity=HIGH
   - 배지 현황: [전체 12] [진행중 5] [완료 7]

2) 배지 클릭 동작 (AND 조합):
   - "진행중 배지" 클릭
   - 결과: customer_id=A AND severity=HIGH AND status=IN_PROGRESS 필터 적용
   - 목록: A사의 HIGH 심각도 중 진행중인 건만 표시

3) 구현 로직:
   ```typescript
   // 배지 클릭 핸들러
   const handleBadgeClick = (status: IssueStatus) => {
     // 기존 필터 유지
     const newFilters = {
       ...currentFilters,
       status: status
     };
     setFilters(newFilters);
     // API 다시 호출 (TanStack Query refetch)
   };
   ```

4) 사용자 경험:
   - 배지 = "현재 필터 상황에서 상태별 분류"
   - 배지 클릭 = 상태 필터 추가/변경
   - 필터 초기화 버튼으로 모든 필터 제거 가능

5) 배지 업데이트 로직:
   - /api/issues/summary API가 현재 필터에 따른 집계 반환
   - 요청: customer_id=A&severity=HIGH
   - 응답: { total: 12, intake: 4, inProgress: 5, completed: 3 }
   - UI는 이 수치로 배지 업데이트

배지별 표시:
- 전체: 모든 Issue 중 현재 필터 조건에 맞는 수
- 진행중: 현재 필터 + status=IN_PROGRESS 수
- 완료: 현재 필터 + status=COMPLETED 수
```

**API 구현:**
```typescript
// GET /api/issues/summary?customer_id=1&severity=HIGH
// 응답
{
  "total": 12,      // customer_id=1 AND severity=HIGH인 모든 Issue
  "intake": 4,      // + status=INTAKE
  "inProgress": 5,  // + status=IN_PROGRESS
  "completed": 3    // + status=COMPLETED
}
```

---

### Response to Issue 3.5: API 권한 검증 응답 코드 모호

**검토자 지적사항:** 403 Forbidden만 명시되고, 시나리오별 응답 코드(401, 403, 400 구분)가 불명확. 응답 포맷도 표준화 필요

**재검토 결과:** ✅ **검토자의 지적이 정당하며, API 응답 표준화 필요**

**변경사항:**

```
API 응답 코드 명확화 (섹션 8 Security Considerations 추가):

1) 인증 관련:
   - 401 Unauthorized
     * 시나리오: 세션 만료, 토큰 없음, 유효하지 않은 토큰
     * 처리: 프론트엔드 → /login 리다이렉트
     * 응답 바디:
       ```json
       {
         "success": false,
         "error": "Session expired. Please login again.",
         "code": "UNAUTHORIZED"
       }
       ```

2) 권한 부족:
   - 403 Forbidden
     * 시나리오: 인증은 됐으나 권한 없음
     * 예시:
       - USER가 다른 USER의 Issue 수정 시도
       - MANAGER가 다른 부서의 Issue 수정 시도
       - USER가 담당자 할당 시도
     * 응답 바디:
       ```json
       {
         "success": false,
         "error": "Permission denied. You can only modify issues assigned to you or created by you.",
         "code": "PERMISSION_DENIED"
       }
       ```

3) 유효성 검사 실패:
   - 400 Bad Request
     * 시나리오: 비즈니스 로직 위반 (권한과 무관)
     * 예시:
       - 유효하지 않은 상태 전이 (COMPLETED → INTAKE)
       - 필수 필드 누락 (고객사, 제목)
       - MIME type 불일치
     * 응답 바디:
       ```json
       {
         "success": false,
         "error": "Invalid status transition: COMPLETED → INTAKE. Only COMPLETED → IN_PROGRESS allowed.",
         "code": "INVALID_STATE_TRANSITION"
       }
       ```

4) 리소스 충돌:
   - 409 Conflict
     * 시나리오: 데이터 일관성 문제
     * 예시:
       - Issue 삭제 시 첨부파일 존재
       - 파일 개수 초과 (5개 이상)
     * 응답 바디:
       ```json
       {
         "success": false,
         "error": "Cannot delete issue with 2 attachments. Remove files first.",
         "code": "ATTACHMENTS_EXIST"
       }
       ```

5) 파일 크기 관련:
   - 413 Payload Too Large
     * 파일 크기 > 10MB
     * 응답:
       ```json
       {
         "success": false,
         "error": "File size exceeds 10MB limit.",
         "code": "FILE_TOO_LARGE"
       }
       ```

6) 리소스 미발견:
   - 404 Not Found
     * Issue ID가 존재하지 않거나 권한 없음 (RBAC)
     * 보안: 명시적 404 vs 403 구분 (정보 노출 최소화)

표준 응답 포맷:
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": {
    "field": "customerId",
    "message": "Customer not found"
  }
}
```

성공 응답:
```json
{
  "success": true,
  "data": { ... }
}
```
```

---

### Response to Issue 3.6: 데이터 삭제 전 의존성 검증 정책 불명확

**검토자 지적사항:** Issue 삭제 시 ISSUE_ATTACHMENT 의존성만 명시되고, ISSUE_HISTORY나 기타 참조 테이블 처리 방식 불명확

**재검토 결과:** ✅ **검토자의 지적이 타당하며, 삭제 정책 명확화 필요**

**변경사항:**

```
DELETE /api/issues/[id] 사전 검증 정책 명확화:

1) 삭제 가능 조건 검증:

   a) ISSUE_ATTACHMENT 확인 (필수):
      ```sql
      SELECT COUNT(*) FROM "ISSUE_ATTACHMENT"
      WHERE "issue_id" = :id AND "deleted_at" IS NULL
      ```
      → 0개 이상: 삭제 불가 → 409 Conflict 응답
      → 0개: 진행

   b) ISSUE_HISTORY 확인 (정보 목적):
      - 삭제하지 않음 (감시 감사 기록 유지)
      - ISSUE_HISTORY는 soft delete된 Issue의 이력도 표시 가능하도록 설계

   c) 향후 추가 참조 테이블:
      - TASK (Task 엔티티와 연결 시): 확인 후 삭제 불가
      - NOTIFICATION (알림 엔티티): 삭제 대상에서 제외
      - 규칙: ON DELETE RESTRICT 원칙 준수

2) Soft Delete 구현:
   ```typescript
   // DELETE /api/issues/[id]
   async function deleteIssue(id: number, session: Session) {
     // 권한 검증
     const issue = await issueRepository.findOne(id);
     if (!issue) return res.status(404).json({...});

     // RBAC 검증
     if (!canDeleteIssue(session.user, issue)) {
       return res.status(403).json({...});
     }

     // 의존성 검증
     const attachmentCount = await issueAttachmentRepository.count({
       where: { issueId: id, deletedAt: IsNull() }
     });

     if (attachmentCount > 0) {
       return res.status(409).json({
         error: `Cannot delete issue with ${attachmentCount} attachment(s). Remove files first.`,
         code: "ATTACHMENTS_EXIST"
       });
     }

     // Soft delete 실행
     await issueRepository.update(id, {
       deletedAt: new Date(),
       updatedAt: new Date()
     });

     // 이력 기록
     await recordHistoryChange(
       id,
       'DELETED',
       issue.status,
       'DELETED',
       session.user.id,
       'Issue soft-deleted by ' + session.user.name
     );

     return res.status(200).json({
       success: true,
       message: 'Issue deleted successfully'
     });
   }
   ```

3) 삭제된 Issue 조회 처리:
   - SELECT 쿼리에 WHERE deleted_at IS NULL 조건 자동 추가
   - 삭제된 Issue는 목록, 상세 조회에서 숨김
   - ADMIN만 deleted_at 필터로 삭제된 Issue 조회 가능 (감시 감사용)

4) 권한별 삭제 권한:
   - ADMIN: 모든 Issue 삭제 가능 (첨부파일 제거 후)
   - MANAGER: 같은 부서의 Issue만 삭제 가능
   - USER: 자신이 생성한 Issue만 삭제 가능 (INTAKE 상태만)

5) 응답 예시:
   ```json
   // 성공 (200 OK)
   {
     "success": true,
     "message": "Issue deleted successfully"
   }

   // 첨부파일 존재 (409 Conflict)
   {
     "success": false,
     "error": "Cannot delete issue with 2 attachment(s). Remove files first.",
     "code": "ATTACHMENTS_EXIST",
     "details": {
       "attachmentCount": 2,
       "files": ["report.pdf", "screenshot.png"]
     }
   }

   // 권한 부족 (403 Forbidden)
   {
     "success": false,
     "error": "Permission denied. You can only delete issues from your department.",
     "code": "PERMISSION_DENIED"
   }
   ```
```

---

## 4. LOW Priority Responses

### Response to Issue 4.1: TypeScript 타입 정의 명시 필요

**검토자 지적사항:** src/types/issue.ts 위치만 언급되고, 구체적인 타입 스키마 제시 없음

**재검토 결과:** ℹ️ **타당하며, 구현 가이드 문서로 포함하는 것 적절**

**조치:**
- 본 PRD 수정 시 섹션 10 또는 별도 "TypeScript 타입 정의" 섹션 추가
- 제안된 enum 및 interface 스키마 수용
- 구현 단계에서 src/types/issue.ts 작성 시 기준으로 사용

---

### Response to Issue 4.2: API 요청/응답 포맷 예시 추가

**검토자 지적사항:** API route 목록만 있고, 구체적인 요청/응답 포맷 예시 없음

**재검토 결과:** ℹ️ **타당하며, API 명세 문서로 분리하는 것 권장**

**조치:**
- 본 PRD의 섹션 5.2에 예시 추가 (검토자 제안 예시 수용)
- 구현 단계에서 OpenAPI/Swagger 명세 작성
- 파라미터, 응답 포맷, 에러 케이스 상세 정의

---

### Response to Issue 4.3: 일관성 문제: "심각도" vs "Severity"

**검토자 지적사항:** 한글 "심각도"와 영문 "Severity" 혼용. DB 스키마는 영문, UI는 한글이지만 매핑 테이블 부재

**재검토 결과:** ✅ **검토자의 지적이 타당. 용어 통일 적용**

**변경사항:**
```
용어 통일 기준:

1) 문서:
   - 한글 공식 용어: "심각도"
   - 영문 기술용어: "severity" (코드 내에만)

2) 심각도 값 매핑:
   DB 컬럼값 → UI 표시 한글 → 배지 색

   CRITICAL → 긴급 🔴 (빨강)
   HIGH → 높음 🟠 (주황)
   MEDIUM → 보통 🟡 (노랑)
   LOW → 낮음 🟢 (초록)

3) 코드 네이밍:
   - enum 이름: IssueSeverity
   - 값: IssueSeverity.CRITICAL
   - 번역: severityDisplay[IssueSeverity.CRITICAL] = "긴급"

4) UI 컴포넌트:
   ```typescript
   // src/components/features/issues/SeverityBadge.tsx
   const severityDisplay = {
     CRITICAL: { label: "긴급", color: "red" },
     HIGH: { label: "높음", color: "orange" },
     MEDIUM: { label: "보통", color: "yellow" },
     LOW: { label: "낮음", color: "green" },
   };
   ```
```

---

### Response to Issue 4.4: 페이지 로딩 성능 메트릭 보완

**검토자 지적사항:** 초기 페이지 로드 메트릭만 있고, 필터/정렬 후 추가 로딩 성능 목표 없음

**재검토 결과:** ℹ️ **타당하며, 성능 메트릭 확장 권고**

**변경사항:**
```
성능 메트릭 확장 (섹션 7 Success Metrics 업데이트):

1) 초기 페이지 로드:
   - First Contentful Paint (FCP): < 1.8s
   - Largest Contentful Paint (LCP): < 2.5s

2) 인터랙션 후 재로드:
   - 필터 적용 후 결과 표시: < 500ms (클라이언트 + API 왕복)
   - 정렬 변경: < 300ms (클라이언트만 재정렬)
   - 페이지네이션: < 400ms (API 새 페이지 조회)

3) 상세 페이지:
   - 페이지 로드: < 1s (단일 Issue 조회)
   - 첨부파일 목록 렌더링: < 200ms

4) 파일 업로드:
   - 10MB 파일 업로드: < 5초
   - 5개 파일 동시 업로드: < 15초 (병렬 처리)

5) API 응답:
   - p50 (중앙값): < 100ms
   - p95 (95 percentile): < 200ms
   - p99 (99 percentile): < 500ms
   - 조건: 필터 5개 이상, 최대 1000건 조회 시에도 준수

6) 캐시 효과:
   - TanStack Query 동일 쿼리 재호출: < 10ms (메모리)
   - staleTime = 30s, gcTime = 5분 기준
```

---

## 5. Acknowledgements & Agreements

다음 이슈들에 대해서는 **검토자의 지적이 정당하며 전면 수정에 동의**합니다:

| 이슈 | 제목 | 조치 |
|------|------|------|
| 2.1 | ON DELETE CASCADE 위반 | ✅ ON DELETE RESTRICT로 변경 |
| 2.2 | RBAC 정의 모호성 | ✅ USER 권한 명확히 재정의 |
| 2.3 | 상태 되돌리기 정책 미정의 | ✅ 상세 정책 명시 |
| 2.4 | 담당자 변경 권한 불충분 | ✅ 부서/상태별 권한 명확화 |
| 3.1 | 파일 검증 로직 불완전 | ✅ MIME type 화이트리스트 추가 |
| 3.2 | 처리 시간 입력 방식 모호 | ✅ 분 단위 단일 입력으로 명확화 |
| 3.3 | 변경 이력 범위 불명확 | ✅ change_type 값 확장 |
| 3.4 | 배지 필터링 동작 미정의 | ✅ AND 조합 방식으로 명확화 |
| 3.5 | API 응답 코드 모호 | ✅ 상세 응답 코드 정의 |
| 3.6 | 삭제 의존성 검증 불명확 | ✅ 상세 검증 정책 명시 |

---

## 6. Disagreements & Justifications

**특정 불일치 없음** — 모든 Critical Review 지적사항이 합리적이며, 우리의 원래 설계가 불충분했음을 인정합니다.

다만 다음 항목들은 **구현 단계에서 유연하게 조정 가능**합니다:

1. **Issue 4.1 (TypeScript 타입):**
   - 검토자 제안 타입은 기본 골격으로 사용
   - 구현 중 추가 타입 필요 시 유동적으로 확장

2. **Issue 4.4 (성능 메트릭):**
   - 제시된 p95 < 200ms는 목표이지만, 데이터가 매우 많은 경우 조정 가능
   - 초기 배포 후 실제 성능 측정 후 메트릭 리파인

---

## 7. Summary of Changes Required

PRD 수정 계획 (우선순위순):

### Phase 1: 필수 수정 (High Priority)

**섹션 5.3 데이터베이스 정의:**
- [ ] ISSUE_ATTACHMENT의 ON DELETE CASCADE → ON DELETE RESTRICT 변경
- [ ] ISSUE 테이블에 `is_public` 컬럼 추가
- [ ] ISSUE_HISTORY의 change_type 값 확장 (STATUS_CHANGE 외 7가지 추가)

**섹션 3 User Stories:**
- [ ] US-2 (담당자 할당): 부서 제약 명시
- [ ] US-8 (상태 관리): 되돌리기 정책 상세 정의
- [ ] US-9 (RBAC): USER 권한 명확히 재정의

**섹션 5.5 인증/인가:**
- [ ] USER 권한 조회/생성/수정/삭제 명확화
- [ ] MANAGER의 담당자 할당 부서 제약 추가
- [ ] 상태별 권한 검증 추가 (IN_PROGRESS 변경은 ADMIN만)

### Phase 2: 상세화 (Medium Priority)

**섹션 5.6 파일 첨부:**
- [ ] MIME type 화이트리스트 추가
- [ ] 이중 확장자 감지 방법 명시
- [ ] 파일 크기 제약(50MB 누적) 추가

**섹션 3 (US-3):**
- [ ] 처리 시간 입력 방식을 분 단위 단일로 명확화
- [ ] 유효성 검사 범위 (1~1440) 명시

**섹션 8 Security Considerations:**
- [ ] API 응답 코드 상세화 (401, 403, 400, 409, 413 구분)
- [ ] 표준 응답 포맷 제시

**섹션 5.2 API Routes:**
- [ ] 요청/응답 포맷 예시 추가

### Phase 3: 가이드 강화 (Low Priority)

**섹션 10:**
- [ ] TypeScript 타입 정의 예시 추가
- [ ] 용어 통일 (심각도 매핑 테이블)

**섹션 7:**
- [ ] 성능 메트릭 확장 (필터 후 재로드, 파일 업로드 등)

---

## 8. Open Questions for Discussion

다음 사항들은 **팀 논의 후 최종 결정 필요**합니다:

| 번호 | 주제 | 선택지 | 권장 |
|------|------|--------|------|
| Q1 | 처리 시간 입력 | (a) 분 단위 단일 or (b) 시간/분 분리 | (a) 분 단위 |
| Q2 | is_public 플래그 필요성 | (a) 추가 or (b) 부서 조회로 통일 | (a) is_public 추가 |
| Q3 | 심각도 변경 허용 범위 | (a) 사용 불가 or (b) MANAGER만 | (b) MANAGER만 |
| Q4 | 배지 필터링 방식 | (a) AND 조합 or (b) 필터 초기화 | (a) AND 조합 |
| Q5 | Rollback 상태 전이 | (a) COMPLETED→IN_PROGRESS만 or (b) 더 유연 | (a) 제한적 |
| Q6 | 파일 MIME 검증 | (a) 업로드 전 검증 or (b) 저장 후 검증 | (a) 업로드 전 |

---

## 9. PRD 최종 버전 계획

**목표:** 2026-01-26까지 수정된 PRD v2 완성

**절차:**
1. 본 rebuttal 검토
2. Discussion Topics 검토 및 팀 의사결정
3. HIGH/MEDIUM Priority 항목 모두 PRD에 반영
4. 구현팀 리뷰 및 최종 승인
5. 구현 시작

---

**회신 완료**
- 회신자: Claude Haiku 4.5
- 회신일: 2026-01-25 17:00:00 KST
- 상태: 모든 주요 이슈 인정 및 수정 동의
- 다음 단계: Discussion Topics 검토 및 팀 의사결정
