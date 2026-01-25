<!-- Generated: 2026-01-25 16:50:00 KST -->

# Critical Review: 장애 현황 관리 (Issue Tracking)

문서번호: 2051
검토일: 2026-01-25
검토자: Claude Haiku 4.5
상위문서: 2051_장애_현황_관리_prd.md

---

## 1. 종합 평가

**평가 등급: CONDITIONAL** ✓

이 PRD는 장애 현황 관리(Issue Tracking) 모듈의 기능 요구사항을 체계적으로 정의한 문서이며, 전반적으로 아키텍처 표준을 잘 준수하고 있다. 다만, 몇 가지 중요한 구현 상의 모호함과 데이터 무결성 관련 문제, RBAC 정의의 일관성 부족이 있어 수정이 필요하다.

**주요 강점:**
- 엔티티 설계가 명확하고 Oracle XE 규칙을 대체로 잘 준수
- User Story 및 Acceptance Criteria가 구체적으로 정의됨
- 파일 첨부 기능 사양이 상세함
- 상태 관리 워크플로우가 명확함

**주요 우려사항:**
- ISSUE_ATTACHMENT의 ON DELETE CASCADE 규칙이 아키텍처 정책 위반
- RBAC 정의가 부분적으로 모호함 (특히 USER의 "공개 데이터" 정의)
- 상태 되돌리기(rollback) 정책이 명시되지 않음
- 담당자 변경 시 권한 검증이 불충분함
- 파일 업로드 검증 로직이 부분적으로 누락됨

---

## 2. 주요 우려사항 (High Priority - Blockers)

### Issue 2.1: ON DELETE CASCADE 위반
**심각도:** HIGH
**위치:** 섹션 5.3, ISSUE_ATTACHMENT 엔티티 정의
**현황:**
```
ISSUE_ATTACHMENT.issue_id → ISSUE.id (ON DELETE CASCADE)
```
이는 sunjin-erp 아키텍처 규칙의 "CASCADE DELETE 금지" 정책을 직접 위반한다.

**영향도:**
- 장애(Issue)를 삭제할 때 첨부파일이 자동 삭제되어 증거 추적 불가능
- 감사(Audit) 목적으로 삭제된 파일 이력 추적 불가
- 소프트 삭제 정책의 일관성 파괴

**권장사항:**
```
ISSUE_ATTACHMENT.issue_id → ISSUE.id (ON DELETE RESTRICT)
```
으로 변경. Issue 삭제 시 연관된 첨부파일이 있는지 먼저 확인한 후 삭제하도록 API 로직 구현.

---

### Issue 2.2: RBAC 정의 모호성 (USER 권한)
**심각도:** HIGH
**위치:** 섹션 5.5, 섹션 3 (US-9)
**현황:**
- US-9 AC: "USER: 조회, 신규 등록만 가능 (수정은 담당자 또는 MANAGER만)"
- 섹션 5.5 RLS: "USER: 공개 데이터 (자신이 등록한 또는 할당된 경우)"

두 정의가 모순. "공개 데이터"의 정의가 모호하고, "자신이 등록한" vs "할당된 경우"의 구분이 불명확.

**영향도:**
- 구현 시 혼란 야기 (할당된 장애도 조회 가능한가? 수정은?)
- API 테스트 작성 시 요구사항 해석 오류 가능
- 운영 중 권한 분쟁 발생

**권장사항:**
```
USER 권한 재정의:
- 조회: 다음 중 하나에 해당하는 Issue만 조회 가능
  1) 자신이 생성한 Issue (created_by_id = current_user.id)
  2) 자신에게 할당된 Issue (assigned_to_id = current_user.id)
  3) 동일 부서 직원이 생성한 공개 Issue (부서 내 공개 플래그)

- 생성: 제한 없음 (모든 고객사 Issue 생성 가능)
- 수정: 자신이 생성한 Issue만 제목/설명 수정 가능
        처리 정보(방법, 시간, 결과) 수정은 할당자만
- 담당자 할당: 불가 (MANAGER/ADMIN만)
```

---

### Issue 2.3: 상태 되돌리기(Rollback) 정책 미정의
**심각도:** HIGH
**위치:** 섹션 3 (US-8), 섹션 5.5
**현황:**
- US-8 AC: "상태 되돌리기 가능 (ADMIN만 가능)"
- 하지만 어떤 상태로 되돌릴 수 있는가? (COMPLETED → IN_PROGRESS만? COMPLETED → INTAKE도?)
- 되돌릴 때 처리 정보(treatment_result, treatment_time) 초기화 여부?
- 변경 이력에 되돌리기 기록을 어떻게 남길 것인가?

**영향도:**
- 구현 시 API 로직이 불명확
- 되돌리기 후 데이터 일관성 문제 가능
- 감사 추적(audit trail) 불완전

**권장사항:**
```
상태 되돌리기 정책 명시:
1) ADMIN만 가능
2) 상태 전이 규칙:
   - COMPLETED → IN_PROGRESS (만 가능)
   - IN_PROGRESS → INTAKE (만 가능)
3) 되돌리기 시 동작:
   - completed_at → NULL 설정
   - treatment_result, treatment_time은 유지 (기록 목적)
   - IssueHistory에 "ROLLBACK: COMPLETED → IN_PROGRESS" 기록
4) 첨부파일은 유지
5) API: PUT /api/issues/[id]/rollback (또는 PUT with status rollback flag)
```

---

### Issue 2.4: 담당자 변경 시 권한 검증 불충분
**심각도:** HIGH
**위치:** 섹션 3 (US-2), 섹션 5.5
**현황:**
- US-2: "MANAGER 역할로서, 부서 내 장애를 담당자에게 할당할 수 있다"
- 하지만 MANAGER가 다른 부서 직원에게 할당할 수 있는가?
- 자신의 부서에만 할당 가능한가?
- 처리 중(IN_PROGRESS) 장애의 담당자를 변경할 수 있는가? (변경하면 처리 정보 초기화?)

**영향도:**
- 부서 간 권한 침해 가능
- 진행 중인 업무의 책임 추적 불명확
- RBAC 우회 가능

**권장사항:**
```
담당자 할당 정책 명시:
1) ADMIN: 모든 직원에게 할당 가능
2) MANAGER: 자신의 부서 소속 직원에게만 할당 가능
   - 다른 부서 직원 선택 시 400 Bad Request
3) 담당자 변경 시 타이밍:
   - INTAKE 상태: 자유롭게 변경 가능
   - IN_PROGRESS/COMPLETED: ADMIN만 변경 가능
     (또는 MANAGER가 변경 시 이전 담당자에게 알림 필요)
4) 담당자 변경 시 처리 정보(treatment_*) 초기화 여부 명시
```

---

## 3. 개선 권고사항 (Medium Priority)

### Issue 3.1: 파일 업로드 검증 로직 불완전
**심각도:** MEDIUM
**위치:** 섹션 5.6, 섹션 8
**현황:**
- 파일당 최대 10MB, 장애당 최대 5개 제한은 명시
- 하지만 MIME type 검증 세부사항이 없음:
  - "PDF, Excel, Word, 이미지 등 일반 문서 포맷"이라는 표현이 모호
  - 정확한 MIME type 화이트리스트 없음 (예: application/pdf, image/png 등)
  - 이중 확장자 사기 방지 (.pdf.exe) 처리 방법 불명시

**영향도:**
- 보안 취약점 (악의적 파일 업로드 가능)
- 구현 시 일관성 부족
- 테스트 케이스 작성 모호

**권장사항:**
```
섹션 5.6에 다음 추가:

**파일 업로드 보안 상세:**
- 허용 MIME type 화이트리스트:
  - application/pdf
  - application/vnd.ms-excel
  - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  - application/msword
  - application/vnd.openxmlformats-officedocument.wordprocessingml.document
  - image/jpeg, image/png, image/gif
  - application/vnd.ms-powerpoint
  - application/vnd.openxmlformats-officedocument.presentationml.presentation

- 파일명 검증:
  - 확장자와 MIME type 불일치 시 거부
  - 특수문자(/\:*?"<>|) 제거 또는 변환
  - 이중 확장자 감지 및 거부

- 업로드 API 응답 코드:
  - 400: MIME type 불일치, 크기 초과
  - 413: 개별 파일 크기 > 10MB 또는 누적 크기 > 50MB
  - 422: 파일 개수 > 5개
```

---

### Issue 3.2: 처리 시간(treatment_time_minutes) 입력 방식 모호
**심각도:** MEDIUM
**위치:** 섹션 3 (US-3), 섹션 5.3, 섹션 6.2
**현황:**
- US-3 AC: "처리 시간(소요 시간) 입력 필드: 시간 단위 or 분 단위 입력"
- 하지만 DB 스키마는 `treatment_time_minutes (NUMBER)`로 단위 고정
- UI에서 시간/분 선택 가능한가? (예: "2시간 30분" → 150분 변환?)
- 유효성 검사: 최대 입력 시간 제한이 있는가? (999시간 가능?)

**영향도:**
- 입력 인터페이스 설계 불명확
- 데이터 일관성 문제 (시간/분 혼용)
- 통계 계산 오류 가능

**권장사항:**
```
섹션 3 (US-3) Acceptance Criteria 수정:

처리 시간 입력 방식:
- UI: 두 필드 제공
  1) Hours (0-24, 숫자)
  2) Minutes (0-59, 숫자)
- 유효성 검사:
  - Hours >= 0, Hours <= 24
  - Minutes >= 0, Minutes < 60
  - Hours=24이고 Minutes>0 → 에러
- DB 저장: (Hours * 60) + Minutes → treatment_time_minutes
- 디스플레이: "2시간 30분" 형식 (프론트엔드 포맷팅)

또는 단순화:
- 분 단위만 입력 (1~1440, 최대 24시간)
- UI에 분 → "Xh Ym" 변환 표시
```

---

### Issue 3.3: 변경 이력(IssueHistory) 기록 범위 불명확
**심각도:** MEDIUM
**위치:** 섹션 5.3, 섹션 3 (US-7)
**현황:**
- IssueHistory.change_type: "STATUS_CHANGE / ASSIGNEE_CHANGE / COMMENT_ADDED"
- 하지만 처리 정보 변경(treatment_method, treatment_result)은 기록하는가?
- 파일 첨부/삭제도 기록하는가?
- 심각도 변경은? (초기 등록 후 심각도 변경 가능한가?)

**영향도:**
- 감사 추적 불완전
- 장애 해결 과정의 투명성 부족
- 구현 시 어떤 변경을 기록할지 모호

**권장사항:**
```
섹션 5.3 IssueHistory 테이블 정의 수정:

change_type 값 명확화:
- STATUS_CHANGE: 상태 변경 (INTAKE → IN_PROGRESS 등)
- ASSIGNEE_CHANGE: 담당자 변경
- SEVERITY_CHANGE: 심각도 변경 (등록 후 조정 필요 시)
- TREATMENT_INFO_CHANGE: 처리 방법/시간/결과 변경
- FILE_ATTACHED: 파일 첨부 (file_name in remark)
- FILE_REMOVED: 파일 삭제 (file_name in remark)
- DESCRIPTION_UPDATED: 설명 변경 (등록 후 수정 필요 시)
- COMPLETED: 완료 처리 (상태 변경과 구분)

또는 심각도 변경을 제한:
- 장애 등록 후 심각도 변경 불가 (초기 심각도로 고정)
- 변경이 필요한 경우 등록자 또는 MANAGER에 수정 권한만 부여
```

---

### Issue 3.4: 대시보드 요약 배지 필터링 동작 미정의
**심각도:** MEDIUM
**위치:** 섹션 3 (US-6), 섹션 5.2
**현황:**
- US-6: "필터(고객사, 심각도 등) 변경 시 배지 수 동적 업데이트"
- 배지 클릭 시 "해당 필터 상태로 목록 포커싱"
- 하지만 현재 필터와 배지 필터의 관계가 모호:
  - "진행중" 배지 클릭 시, 기존 고객사 필터는 유지되는가?
  - 아니면 모두 초기화되고 상태=진행중만 적용되는가?

**영향도:**
- UX 예측 불가능 (사용자 혼동)
- 구현 시 필터 로직 복잡성 증가

**권장사항:**
```
섹션 US-6 Acceptance Criteria 명확화:

배지 클릭 동작 정의:
1) 현재 필터 + 배지 필터 AND 조합:
   - 고객사=A, 상태=진행중 필터 중 "완료 배지" 클릭
   → 고객사=A AND 상태=완료 필터 적용

2) 또는 배지 필터 단독 적용 (기존 필터 초기화):
   - 고객사=A, 상태=진행중 필터 중 "완료 배지" 클릭
   → 상태=완료만 적용 (고객사 필터 초기화)

권장: 1) 방식 (AND 조합)이 더 자연스러움
```

---

### Issue 3.5: API 권한 검증 응답 코드 모호
**심각도:** MEDIUM
**위치:** 섹션 5.5, 섹션 8
**현황:**
- "권한 없는 접근 시 403 Forbidden 응답" 명시
- 하지만 구체적인 시나리오별 응답이 없음:
  - USER가 다른 USER의 장애 수정 시도: 403? 400?
  - MANAGER가 다른 부서 장애 수정 시도: 403? 그냥 빈 목록?
  - 인증 실패(토큰 만료): 401? 미들웨어에서 처리?

**영향도:**
- 프론트엔드 에러 처리 로직 불명확
- API 응답 일관성 부족

**권장사항:**
```
섹션 8 Security Considerations 추가:

API 응답 코드 명시:
- 401 Unauthorized: 세션 만료, 토큰 없음
  → 프론트엔드에서 /login 리다이렉트

- 403 Forbidden: 권한 부족 (인증은 됐으나 권한 없음)
  → 응답 바디: { "error": "You don't have permission to modify issues from another department" }

- 400 Bad Request: 유효성 검사 실패 (권한과 무관)
  → 응답 바디: { "error": "Invalid status transition: COMPLETED → INTAKE" }

응답 포맷 표준화:
{
  "success": false,
  "error": "string",
  "code": "PERMISSION_DENIED | INVALID_STATE | RESOURCE_NOT_FOUND",
  "details": { ... }
}
```

---

### Issue 3.6: 데이터 삭제 전 의존성 검증 정책 불명확
**심각도:** MEDIUM
**위치:** 섹션 5.3, 섹션 8
**현황:**
- ON DELETE RESTRICT 정책은 명시
- 하지만 Issue 삭제 시 고려할 의존성이 명확하지 않음:
  1) ISSUE_ATTACHMENT가 있으면 삭제 불가 (명시됨)
  2) ISSUE_HISTORY가 있으면? (감사 기록이므로 당연히 유지되어야 함)
  3) Issue를 참조하는 다른 테이블이 있으면? (향후 추가 가능)

**영향도:**
- 삭제 API 에러 처리 미정의
- 운영 시 삭제 불가 상황에 대한 대응 방안 부족

**권장사항:**
```
섹션 5.3 또는 API route 구현 가이드 추가:

DELETE /api/issues/[id] 사전 검증:
1) issue_id를 참조하는 ISSUE_ATTACHMENT 행 개수 확인
   → 1개 이상이면 409 Conflict 응답
   ```
   { "error": "Cannot delete issue with attachments. Remove files first." }
   ```

2) ISSUE_HISTORY는 삭제하지 않음 (감사 기록 유지)

3) 실제 삭제: DELETE 없이 soft delete
   ```
   UPDATE "ISSUE" SET "deleted_at" = SYSTIMESTAMP
   WHERE "id" = :id
   ```

응답 예시:
- 200 OK + soft delete 성공
- 409 Conflict: 삭제 불가 (첨부파일 존재 등)
```

---

## 4. 경미한 제안 (Low Priority)

### Issue 4.1: TypeScript 타입 정의 명시 필요
**심각도:** LOW
**위치:** 섹션 10, Component File Structure
**현황:**
- `src/types/issue.ts`는 언급되지만, 구체적인 타입 스키마 제시 없음
- IssueStatus, IssueSeverity enum 정의 위치 불명확

**권장사항:**
```
섹션 10 또는 별도 문서에 타입 예시 제시:

// src/types/issue.ts
export enum IssueStatus {
  INTAKE = 'INTAKE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum IssueSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum TreatmentMethod {
  REMOTE = 'REMOTE',
  PHONE = 'PHONE',
  ONSITE = 'ONSITE',
}

export interface Issue {
  id: number;
  customerId: number;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  createdById: number;
  assignedToId: number | null;
  treatmentMethod: TreatmentMethod | null;
  treatmentTimeMinutes: number | null;
  treatmentResult: string | null;
  createdAt: Date;
  completedAt: Date | null;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface IssueAttachment {
  id: number;
  issueId: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadedById: number;
  createdAt: Date;
  deletedAt: Date | null;
}

export interface IssueHistory {
  id: number;
  issueId: number;
  changeType: string;
  oldValue: string | null;
  newValue: string | null;
  changedById: number;
  changedAt: Date;
  remark: string | null;
}
```

---

### Issue 4.2: API 요청/응답 포맷 예시 추가
**심각도:** LOW
**위치:** 섹션 5.2
**현황:**
- API route 목록만 있고, 요청/응답 포맷 예시 없음

**권장사항:**
```
섹션 5.2에 예시 추가:

POST /api/issues 요청:
{
  "customerId": 123,
  "title": "DB 연결 오류",
  "description": "메인 DB 서버 연결 불가능...",
  "severity": "HIGH",
  "assignedToId": null
}

응답 (201 Created):
{
  "success": true,
  "data": {
    "id": 456,
    "customerId": 123,
    "title": "DB 연결 오류",
    "severity": "HIGH",
    "status": "INTAKE",
    "createdById": 789,
    "createdAt": "2026-01-25T10:15:00Z"
  }
}

GET /api/issues?status=IN_PROGRESS&page=1&page_size=20 응답:
{
  "success": true,
  "data": [
    { ...issue1 },
    { ...issue2 }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### Issue 4.3: 일관성 문자: "심각도" vs "Severity"
**심각도:** LOW
**위치:** 섹션 3, 섹션 5.3, 섹션 6.3
**현황:**
- 문서 전체에서 "심각도"와 "Severity" 혼용
- DB 스키마는 CRITICAL/HIGH/MEDIUM/LOW (영문)
- UI 배지는 "높음/주황" (한글)

**권장사항:**
```
용어 통일:
- 한글: "심각도" (모든 User Story, 설명에서)
- DB: severity (컬럼명, 영문 대문자 값)
- UI: 표시 시 한글 매핑 테이블 제시

심각도 → 한글 매핑:
CRITICAL → 긴급 🔴
HIGH → 높음 🟠
MEDIUM → 보통 🟡
LOW → 낮음 🟢
```

---

### Issue 4.4: 페이지 로딩 성능 메트릭 보완
**심각도:** LOW
**위치:** 섹션 7 (Success Metrics)
**현황:**
- "페이지 로드: FCP < 1.8s, LCP < 2.5s" 제시
- 하지만 필터/정렬/페이지네이션 적용 후 추가 로딩은?

**권장사항:**
```
섹션 7에 추가:

성능 메트릭 확장:
- 초기 페이지 로드: FCP < 1.8s, LCP < 2.5s
- 필터 적용 후 재로드: < 500ms (클라이언트 + 서버 왕복)
- 상세 페이지 로드: < 1s
- 파일 업로드: 10MB 파일 < 5초
- API 응답: p95 < 200ms (모든 조건, 최대 1000건 조회 시에도)
```

---

## 5. 긍정 평가

**문서 구조 및 명확성:**
- PRD 전체 구조가 일관되고 논리적이며 읽기 쉬움
- 각 섹션이 명확한 목표를 가지고 정보 제공

**기능 정의의 구체성:**
- User Story 10개가 명확한 acceptance criteria를 포함
- 각 기능의 입출력이 구체적으로 정의됨

**아키텍처 표준 준수:**
- Next.js App Router 구조가 sunjin-erp 가이드를 따름
- TypeORM 엔티티 관계 설계가 좋음
- TanStack Query + Zustand 상태 관리 분리가 명확

**보안 고려:**
- RBAC, 입력 검증, SQL injection 방지, XSS 방지 등 포괄적으로 다룸
- 파일 첨부 보안 조치 구체적

**UI/UX 설계:**
- shadcn/ui 컴포넌트 선택이 적절
- 레이아웃 ASCII 다이어그램으로 시각적 이해 용이
- Responsive Design 정의 충분

**디렉토리 구조:**
- Component File Structure 명확하고 컨벤션 준수

---

## 6. 아키텍처 준수 검증

| 항목 | 상태 | 비고 |
|------|------|------|
| **Next.js App Router** | ✅ 준수 | Route 구조 및 Server/Client Component 분리 명확 |
| **TypeORM Entity** | ⚠️ 부분 준수 | ON DELETE CASCADE 위반 (ISSUE_ATTACHMENT) |
| **Oracle XE 규칙** | ✅ 준수 | VARCHAR2, NUMBER, CLOB, Sequence 사용 정확 |
| **Soft Delete** | ✅ 준수 | 모든 테이블에 deleted_at 포함 |
| **RBAC** | ⚠️ 부분 준수 | USER 권한 정의 모호, 담당자 변경 권한 불명확 |
| **API Route Pattern** | ✅ 준수 | CRUD 패턴 및 파라미터 정의 적절 |
| **State Management** | ✅ 준수 | TanStack Query (서버), Zustand (클라이언트) 분리 명확 |
| **파일 첨부** | ⚠️ 부분 준수 | 파일 업로드 검증 로직 불완전 |
| **입력 검증** | ⚠️ 부분 준수 | 클라이언트/서버 검증 명시되었으나 상세 부족 |
| **성능 메트릭** | ✅ 준수 | 구체적인 목표값 제시 |

---

## 7. 종합 의견

**평가: CONDITIONAL PROCEED** (조건부 진행)

이 PRD는 기본적으로 잘 작성되었으며, 아키텍처 표준을 대부분 따르고 있다. 그러나 다음 **4가지 High Priority 이슈**가 해결되어야만 구현을 진행할 수 있다:

1. **ON DELETE CASCADE 위반** → ON DELETE RESTRICT로 변경
2. **RBAC 정의 모호성** → USER 권한 명확히 정의
3. **상태 되돌리기 정책** → 상태 전이 규칙 및 데이터 일관성 명시
4. **담당자 변경 권한** → 부서 및 상태별 권한 명확화

Medium Priority 6개 이슈도 구현 전에 검토하여 보안 및 데이터 무결성을 강화해야 한다.

---

## 8. 다음 단계

### Phase 1: PRD 수정 (필수)
1. **Issue 2.1** 수정: ISSUE_ATTACHMENT ON DELETE CASCADE → RESTRICT
2. **Issue 2.2** 수정: USER 권한 명확 정의
3. **Issue 2.3** 수정: 상태 되돌리기 정책 명시
4. **Issue 2.4** 수정: 담당자 변경 권한 검증 정의

### Phase 2: 구현 가이드 작성
5. **Issue 3.1 ~ 3.6** 반영: 파일 검증, 처리 시간, 변경 이역, 필터링, API 응답, 삭제 정책 등

### Phase 3: 구현 시작
6. 수정된 PRD 기반 TypeORM Migration 작성
7. API Route Handler 구현 (RBAC 검증 포함)
8. React Client Component 구현 (TanStack Query)
9. Unit Test 작성 (> 80% coverage)
10. E2E Test 작성 (주요 워크플로우)

### Phase 4: 검증
11. Code Review (아키텍처 준수 확인)
12. 보안 리뷰 (입력 검증, SQL injection, XSS 등)
13. 성능 테스트 (응답 시간 메트릭)
14. 스테이징 배포 및 운영팀 테스트

---

**검토 완료**
- 검토자: Claude Haiku 4.5
- 검토일시: 2026-01-25 16:50:00 KST
- 상태: 조건부 승인 (High Priority 이슈 수정 필수)
