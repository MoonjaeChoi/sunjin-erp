<!-- Generated: 2026-01-25 17:00:00 KST -->

# Discussion Topics: 장애_현황_관리 (Issue Tracking)

문서번호: 2051
작성일: 2026-01-25
출처: 2051_장애_현황_관리_prd_critical_review.md 및 Rebuttal 분석

---

## Priority Summary

- **HIGH (Blocker):** 6개 주제 — 즉시 결정 필요 (구현 진행 필수)
- **MEDIUM (Should):** 3개 주제 — 팀 논의 후 결정
- **LOW (Nice):** 2개 주제 — 구현 단계 최적화

---

## HIGH Priority Discussion Topics

### DT-01: ON DELETE CASCADE vs ON DELETE RESTRICT 결정

**Priority:** HIGH

**배경:**

ISSUE_ATTACHMENT 테이블의 외래키 정책을 결정해야 함. 원본 PRD는 ON DELETE CASCADE를 제시했으나, Critical Review에서 아키텍처 정책 위반 지적.

**현황:**
- sunjin-erp 정책: "모든 외래키는 ON DELETE RESTRICT 필수"
- ISSUE는 soft delete (deleted_at 컬럼)
- ISSUE_ATTACHMENT는 첨부파일 관리 (증거 자료)

**영향도:**
- **HIGH:** 데이터 무결성, 감시 감사(Audit), 법적 준거성
- 장애 처리 후 분쟁 시 증거 필요
- 규정 위반 시 구현 후 변경 어려움

**옵션:**

**Option A: ON DELETE RESTRICT (권장)**
- 장점:
  - sunjin-erp 정책 준수
  - 증거 보존 가능
  - 감시 감사 추적 완전
  - 물리 삭제와 논리 삭제 일관성
- 단점:
  - Issue 삭제 전 첨부파일 제거 필요
  - 운영 시 한 단계 더 필요
  - 사용자 실수 가능 (첨부파일 있으면 삭제 불가 에러)
- 구현:
  ```sql
  ALTER TABLE "ISSUE_ATTACHMENT"
  ADD CONSTRAINT fk_issue_attachment_issue
  FOREIGN KEY ("issue_id") REFERENCES "ISSUE"("id")
  ON DELETE RESTRICT;
  ```
- API 체크:
  ```typescript
  const attachmentCount = await repo.count({ where: { issueId } });
  if (attachmentCount > 0) {
    return res.status(409).json({
      error: "Remove attachments first"
    });
  }
  ```

**Option B: ON DELETE CASCADE (원본 설계)**
- 장점:
  - Issue 삭제 시 자동 정리
  - 운영 편의성 높음
  - 사용자 입장에서 직관적
- 단점:
  - sunjin-erp 정책 위반 (구현 거부 가능)
  - 증거 손실 (소송/분쟁 시 불리)
  - 감시 감사 추적 불완전
  - 기존 ProjectAttachment 패턴과 불일치
- 위험:
  - 실수로 Issue 삭제 → 모든 첨부파일 즉시 물리 삭제
  - 복구 불가능

**Recommendation:**

**Option A (ON DELETE RESTRICT) 선택**

이유:
1. sunjin-erp 아키텍처 표준 준수 필수
2. 장기 운영 관점에서 증거 보존이 중요 (고객 클레임, 기술지원 분쟁)
3. 기존 ProjectAttachment 패턴과 일치
4. 운영 비용 (한 번의 추가 단계) < 법적 위험

**구현 전략:**
- 삭제 전 자동 검증 API
- 사용자 UX: "이 Issue에 2개 파일이 있습니다. 먼저 삭제하시겠습니까?"
- 경고 다이얼로그 제시

---

### DT-02: USER 권한 범위 명확화 - 조회 권한 정의

**Priority:** HIGH

**배경:**

USER 역할의 조회 권한이 명확하지 않음. "공개 데이터"의 정의가 모호하여 구현 시 보안 or 기능성 문제 발생 가능.

**현황:**

원본 PRD의 모순:
- US-9: "USER: 조회, 신규 등록만 가능"
- 섹션 5.5: "USER: 공개 데이터 (자신이 등록한 또는 할당된 경우)"

**질문:** USER가 다음을 조회할 수 있는가?
1. 자신이 생성한 Issue → YES (명확)
2. 자신에게 할당된 Issue → YES (명확)
3. 다른 사람의 Issue? → 불명확
4. 동일 부서 다른 사람의 Issue? → 불명확

**영향도:**
- **HIGH:** RBAC 구현, API WHERE 절 동적 구성
- 정보 보안 문제 (과도한 조회 vs 기능 제약)
- 테스트 케이스 작성 모호

**옵션:**

**Option A: 최소 권한 (Least Privilege - 권장)**
```
USER는 다음만 조회 가능:
1) 자신이 생성한 Issue
2) 자신에게 할당된 Issue

구현:
SELECT * FROM ISSUE
WHERE (created_by_id = ? OR assigned_to_id = ?)
AND deleted_at IS NULL
```
- 장점:
  - 보안 강화 (정보 노출 최소화)
  - RBAC 구현 단순
  - 정보 보호
- 단점:
  - 동일 부서의 다른 직원 Issue 미조회 (업무 효율성 저하)
  - 팀 단위 협업 어려움

**Option B: 부서 기반 조회 (권장)**
```
USER는 다음을 조회 가능:
1) 자신이 생성한 Issue
2) 자신에게 할당된 Issue
3) 동일 부서의 공개 Issue (is_public = 1)

구현:
SELECT * FROM ISSUE i
WHERE (
  (i.created_by_id = ? OR i.assigned_to_id = ?)
  OR (i.is_public = 1 AND i.department_id = ?)
)
AND i.deleted_at IS NULL
```
- 장점:
  - 팀 협업 지원
  - 정보 공유 가능 (is_public 플래그로 제어)
  - 현실적인 업무 흐름
- 단점:
  - is_public 컬럼 추가 필요
  - API 로직 복잡도 증가
  - 부서 경계 설정 필요

**Option C: 전사 조회 (최대 권한)**
```
USER는 모든 Issue를 조회 가능

구현:
SELECT * FROM ISSUE
WHERE deleted_at IS NULL
```
- 장점:
  - 구현 단순
  - 정보 접근 최대화
- 단점:
  - 보안 문제 (민감한 정보 노출)
  - MANAGER/USER 구분 불명확
  - sunjin-erp RBAC 철학 위배

**Recommendation:**

**Option B (부서 기반 조회) 선택**

이유:
1. 보안(Option A)과 협업(Option C) 균형
2. 부서 단위 팀 협업 지원 (현실적)
3. is_public 플래그로 조회 범위 제어 가능
4. 기술지원팀, 개발팀 등 부서별 특성 반영

**추가 결정 필요:**
- is_public 컬럼을 Schema에 추가할 것인가? (DT-02-A)
- 기본값을 공개(1) or 비공개(0)로 할 것인가? (DT-02-B)

---

### DT-02-A: is_public 컬럼 추가 여부

**Priority:** HIGH (DT-02 종속)

**배경:**

DT-02에서 "부서 기반 조회"를 선택하면, Issue의 공개 범위를 제어할 수 있어야 함.

**옵션:**

**Option A: is_public 컬럼 추가 (권장)**
```sql
ALTER TABLE "ISSUE" ADD "is_public" NUMBER(1) DEFAULT 0;

-- 0: 비공개 (자신, 담당자만)
-- 1: 공개 (같은 부서원 조회 가능)
```
- 장점:
  - 조회 범위 명확한 제어
  - 민감한 Issue는 비공개로 설정 가능
  - 향후 다양한 공개 정책 확장 가능
- 단점:
  - Schema 변경
  - 마이그레이션 필요
  - 추가 UI 입력 필드

**Option B: is_public 컬럼 없음 (비공개만)**
```sql
-- 모든 Issue는 자신과 담당자만 조회
-- 부서 조회는 제공하지 않음
```
- 장점:
  - Schema 단순
  - 마이그레이션 불필요
- 단점:
  - 정보 공유 불가능
  - 팀 협업 어려움
  - 중복 등록 가능성

**Recommendation:**

**Option A (is_public 컬럼 추가)**

---

### DT-02-B: is_public 기본값 결정

**Priority:** HIGH (DT-02 종속)

**질문:**
- 신규 Issue 생성 시 기본값을 공개(1) or 비공개(0)로 할 것인가?

**옵션:**

**Option A: 기본값 = 비공개(0) - 권장**
```
신규 Issue 생성 시 is_public = 0
사용자가 필요 시 수정하여 공개로 변경
```
- 장점:
  - 보안 우선
  - 민감한 정보 자동 보호
  - 의도적 공개만 가능
- 단점:
  - 사용자가 매번 공개로 변경 필요 (번거로움)

**Option B: 기본값 = 공개(1)**
```
신규 Issue는 부서원 모두 조회 가능
```
- 장점:
  - 정보 공유 자동화
  - 팀 협업 효율성
- 단점:
  - 민감한 정보 실수로 노출 가능
  - 기본값 보안 약화

**Recommendation:**

**Option A (기본값 비공개)**

이유: "보안 by default" 원칙 준수. 정보 공개는 의도적으로만.

---

### DT-03: 상태 되돌리기(Rollback) 허용 범위

**Priority:** HIGH

**배경:**

Issue가 실수로 "완료"로 표시되면 "진행중"으로 되돌리기 필요. 하지만 어디까지 허용할지 결정 필요.

**시나리오:**
1. COMPLETED → IN_PROGRESS (명백히 필요) → 허용
2. IN_PROGRESS → INTAKE (담당자 변경 후 재할당) → ?
3. COMPLETED → INTAKE (원점 회귀) → ?

**영향도:**
- **HIGH:** 상태 전이 로직, 데이터 무결성
- 되돌리기 정책이 애매하면 사용자 혼동

**옵션:**

**Option A: 제한적 되돌리기 (권장)**
```
COMPLETED → IN_PROGRESS만 허용
IN_PROGRESS는 되돌릴 수 없음 (다시 처리하면 됨)

논리:
- "완료"는 최종 상태이므로, 실수 수정 필요
- "진행중"은 아직 처리 중이므로 상태 되돌리기 불필요
  (다시 담당자가 처리하면 됨)
```
- 장점:
  - 상태 흐름 명확
  - 되돌리기 목적이 명확 (완료 실수 수정)
  - 구현 단순
- 단점:
  - IN_PROGRESS에서 INTAKE로의 되돌리기 불가
    (담당자 변경 시 재할당만 가능)

**Option B: 완전한 되돌리기**
```
COMPLETED → IN_PROGRESS → INTAKE
모든 역방향 전이 허용
```
- 장점:
  - 유연성 높음
  - 운영 시 선택지 많음
- 단점:
  - 상태 흐름 예측 어려움
  - 기록이 복잡해짐 (상태 왕복)
  - 최종 책임 추적 어려움

**Recommendation:**

**Option A (제한적 되돌리기: COMPLETED → IN_PROGRESS만)**

---

### DT-04: 처리 시간 입력 방식 - 단일 vs 분리

**Priority:** HIGH

**배경:**

장애 처리 소요 시간을 입력받을 때:
- 사용자는 "2시간 30분"으로 입력하길 원함
- DB는 분 단위 저장 (150분)
- UI는 어떻게 입력받을 것인가?

**현황:**
- DB: treatment_time_minutes (NUMBER) - 분 단위만 저장
- US-3 AC: "시간 단위 or 분 단위 입력" (모호)

**영향도:**
- **MEDIUM-HIGH:** UI 설계, 입력 검증 로직
- 사용자 편의성과 데이터 정확성 trade-off

**옵션:**

**Option A: 분 단위 단일 입력 (권장)**
```
UI:
  처리 시간: [     ] 분

입력: 150분
검증: 1 <= input <= 1440
저장: 150 (DB)
표시: "2시간 30분" (포맷팅)
```
- 장점:
  - 구현 단순
  - 데이터 단일화
  - 검증 명확
  - 실수 가능성 낮음
- 단점:
  - 사용자가 시간을 분으로 환산 필요
  - 150분이 2.5시간임을 알아야 함
  - 입력 불편함

**Option B: 시간/분 분리 입력**
```
UI:
  처리 시간: [ ] 시간 [ ] 분

입력: 2시간 30분 (또는 0~24 시간, 0~59 분)
검증:
  - 0 <= hours <= 24
  - 0 <= minutes < 60
  - !(hours === 24 && minutes > 0)
저장: (2*60) + 30 = 150 (DB)
표시: "2시간 30분"
```
- 장점:
  - 사용자 친화적
  - 직관적 입력
  - 실제 업무 방식과 일치
- 단점:
  - 구현 복잡 (두 필드 검증)
  - 입력 실수 가능 (예: 25시간)
  - UI 공간 더 필요

**Recommendation:**

**Option A (분 단위 단일 입력)**

이유:
1. 구현 단순함
2. 데이터 무결성 (단일 단위)
3. 검증 명확함
4. UI 표시에서 "2시간 30분" 포맷으로 보여주면 사용자는 시간으로 인식

**대안 활동:**
- UI에 tooltip: "(예: 150분 = 2시간 30분)"
- 실시간 포맷팅: 입력 중 아래에 "약 2시간 30분" 표시

---

### DT-05: MANAGER의 담당자 할당 권한 - 부서 제약

**Priority:** HIGH

**배경:**

MANAGER가 Issue 담당자를 할당할 때, 자신의 부서 직원에게만 할당 가능해야 하는가?

**시나리오:**
- 개발팀 MANAGER가 영업팀 직원에게 Issue 할당 시도
  → 허용? 차단?

**현황:**
- US-2: "부서 내 장애를 담당자에게 할당"
- 해석: "부서 내" Issue를 할당하는 것이지, 담당자도 부서 내로 제한?

**영향도:**
- **HIGH:** RBAC, 권한 검증 로직
- 부서 간 협업 구조에 영향

**옵션:**

**Option A: 부서 제약 (권장)**
```
MANAGER는 자신의 부서 소속 직원에게만 할당 가능

예:
- 개발팀 MANAGER는 개발팀 직원에게만 할당
- 다른 부서 직원 선택 시: 400 Bad Request
  "Cannot assign employee from another department"

구현:
const assigneeDept = getEmployeeDepartment(assigneeId);
if (assigneeDept !== managerDept) {
  return 400;
}
```
- 장점:
  - 부서별 책임 명확
  - 부서장이 인력 관리
  - RBAC 강화
- 단점:
  - 부서 간 협업 어려움 (영업팀 Issue를 개발팀이 지원할 수 없음)
  - 운영 유연성 감소

**Option B: 부서 제약 없음**
```
MANAGER는 모든 직원에게 할당 가능 (자신의 부서가 아니어도)

예:
- 어떤 MANAGER든 어떤 직원이든 할당 가능
```
- 장점:
  - 부서 간 협업 자유로움
  - 운영 유연성
- 단점:
  - RBAC 약화 (권한 남용 가능)
  - 타 부서 인력 간섭 (조직 정책상 문제)

**Recommendation:**

**Option A (부서 제약)**

이유:
1. sunjin-erp RBAC 철학 (부서별 권한 분리)
2. 부서장 기능 강화 (인력 관리)
3. 부서 간 협업이 필요하면 ADMIN이 직접 할당

**운영 가이드:**
- 부서 간 협업: ADMIN 또는 상위 부서장이 할당
- MANAGER는 자신의 부서 내 인력 관리만

---

### DT-06: 진행 중(IN_PROGRESS) Issue의 담당자 변경 권한

**Priority:** HIGH

**배경:**

Issue가 "진행중" 상태일 때 담당자를 변경할 수 있는가?

**시나리오:**
1. 김철수가 Issue를 진행 중 (IN_PROGRESS)
2. 담당자를 이영희로 변경하려고 함
3. 누가 할 수 있는가?

**영향도:**
- **HIGH:** 업무 책임 추적, 진행 중 업무 중단 위험
- 담당자 변경 시 처리 정보 처리 방식

**옵션:**

**Option A: ADMIN만 가능 (권장)**
```
IN_PROGRESS 상태에서는 ADMIN만 담당자 변경 가능

이유:
- 진행 중인 업무의 책임성 명확화
- 임의 변경 방지
- 필요 시 ADMIN이 체계적으로 변경

구현:
if (issue.status === 'IN_PROGRESS' && session.user.role !== 'ADMIN') {
  return 403 Forbidden;
}
```
- 장점:
  - 업무 책임 명확
  - 승인 프로세스 (ADMIN 개입)
  - 무단 변경 방지
- 단점:
  - MANAGER도 변경 불가 (운영상 번거로움)
  - ADMIN 개입 필요 (병목)

**Option B: MANAGER도 가능**
```
MANAGER는 진행 중인 Issue의 담당자도 변경 가능
(부서 내 인력이면)

이유:
- 부서 내 인력 재조정 유연성
- 긴급 상황 대응 가능
```
- 장점:
  - 운영 유연성
  - MANAGER 권한 강화
- 단점:
  - 책임 추적 복잡 (누가 언제 변경했는지)
  - 기록 필요 (변경 이력 명시)

**Recommendation:**

**Option A (ADMIN만 가능)**

이유:
1. 진행 중인 업무의 책임성 명확 필수
2. 임의 변경으로 인한 업무 혼선 방지
3. 필요 시 ADMIN이 승인 후 변경

**추가 정책:**
- ADMIN 변경 시: IssueHistory에 변경 사유 필수 기록
- 이전 담당자는 히스토리 조회로 변경 경력 추적 가능

---

## MEDIUM Priority Discussion Topics

### DT-07: 심각도(Severity) 변경 허용 범위

**Priority:** MEDIUM

**배경:**

Issue 등록 후 심각도를 변경할 수 있는가?

**시나리오:**
- 초기: 심각도 = HIGH로 등록
- 조사 후: 실제로는 MEDIUM 정도
- 변경 가능? 불가능?

**영향도:**
- **MEDIUM:** 데이터 무결성, 통계 정확성
- 등록 초기 심각도가 잘못되는 경우 처리 방식

**옵션:**

**Option A: 변경 불가 (권장)**
```
등록 후 심각도 변경 불가
- 등록 시 심각도는 고정
- 변경이 필요하면 Issue 재등록
```
- 장점:
  - 초기 심각도 기록 보존
  - 심각도 기반 통계 정확
  - 데이터 무결성
- 단점:
  - 잘못된 심각도는 수정 불가
  - 사용자 불편

**Option B: MANAGER/ADMIN만 변경 가능**
```
MANAGER/ADMIN은 심각도 변경 가능
- USER는 변경 불가
- 이력 기록: SEVERITY_CHANGE
```
- 장점:
  - 유연성 (조사 후 심각도 조정 가능)
  - 운영상 현실적
- 단점:
  - 이력 기록 필요 (변경 추적)
  - 심각도 기반 통계 신뢰성 감소

**Recommendation:**

**Option B (MANAGER/ADMIN만 변경)**

이유:
1. 조사 후 심각도 조정 현실적 필요
2. MANAGER/ADMIN 승인 하에 제한적 변경
3. 이력 기록으로 추적 가능

---

### DT-08: 배지 필터링 동작 - AND vs 초기화

**Priority:** MEDIUM

**배경:**

사용자가 필터를 적용한 상태에서 배지를 클릭할 때 동작을 정의.

**예시:**
- 현재 필터: customer_id=A, severity=HIGH
- 배지: "완료" 클릭

결과:
- AND 방식: customer_id=A AND severity=HIGH AND status=COMPLETED
- 초기화 방식: status=COMPLETED만 (기존 필터 제거)

**영향도:**
- **MEDIUM:** UX, 필터 로직 구현
- 사용자 예측 가능성

**옵션:**

**Option A: AND 조합 (권장)**
```
배지 클릭 = 현재 필터 + 상태 필터

장점:
- 직관적 (배지는 현재 필터 하에서의 상태 분류)
- 정제된 조회 (A사의 HIGH 심각도 중 완료된 것)

구현:
const newFilters = { ...currentFilters, status: 'COMPLETED' };
```

**Option B: 필터 초기화**
```
배지 클릭 = 상태 필터만 (기존 필터 제거)

장점:
- 단순 (배지 = 상태 전체 조회)

구현:
const newFilters = { status: 'COMPLETED' };
```

**Recommendation:**

**Option A (AND 조합)**

---

### DT-09: 파일 검증 시점 - 업로드 전 vs 후

**Priority:** MEDIUM

**배경:**

파일 업로드 시 MIME type, 확장자, 크기 검증을 언제 할 것인가?

**옵션:**

**Option A: 업로드 전 (프론트엔드) - 권장**
```javascript
// 선택 시점에 검증
<input type="file" onChange={(e) => {
  const file = e.target.files[0];
  if (!isValidFile(file)) {
    showError("Invalid file");
    return;
  }
}} />

장점:
- UX 즉시 피드백
- 불필요한 업로드 방지 (대역폭 절약)

단점:
- 클라이언트 검증 우회 가능 (보안상 주의)
```

**Option B: 업로드 후 (서버)**
```typescript
// 서버에서 검증 후 저장
app.post('/api/issues/:id/attachments', (req, res) => {
  const file = req.file;
  if (!isValidMimeType(file)) {
    return res.status(400).json({ error: "Invalid file" });
  }
  // 저장
});

장점:
- 서버 검증으로 보안 강화

단점:
- 네트워크 낭비 (잘못된 파일도 전송)
- UX 지연
```

**Recommendation:**

**Option A (업로드 전 프론트엔드 + 업로드 후 서버 이중 검증)**

이유:
1. 프론트엔드: 사용자 피드백 즉시화
2. 서버: 보안 검증 (우회 방지)

---

## LOW Priority Discussion Topics

### DT-10: TypeScript 타입 정의 위치

**Priority:** LOW

**배경:**

TypeScript 타입 정의를 어디에 배치할 것인가?

**옵션:**

**Option A: 단일 src/types/issue.ts**
```
+ 단순, 한 곳 관리
- 파일 크기 증가
```

**Option B: 모듈별 분리**
```
src/
  ├── types/
  │   └── issue/
  │       ├── issue.ts (Issue 인터페이스)
  │       ├── attachment.ts (IssueAttachment)
  │       └── history.ts (IssueHistory)

+ 조직화 좋음
- 파일 분산
```

**Recommendation:**

**Option A (단일 파일) - Issue 테이블 구조 단순하므로**

---

### DT-11: API 응답 포맷 표준화

**Priority:** LOW

**배경:**

API 응답을 일관된 포맷으로 정의.

**옵션:**

**Option A: 성공/실패 포맷 분리**
```json
// 성공
{ "success": true, "data": {...} }

// 실패
{ "success": false, "error": "...", "code": "..." }
```

**Option B: 공통 wrapper**
```json
{
  "success": true/false,
  "data": {...},
  "error": null or "...",
  "code": "SUCCESS" or "ERROR_CODE"
}
```

**Recommendation:**

**Option A (구조적, 명확함)**

---

## Decision Matrix (for Mediator)

| Topic ID | 제목 | Priority | 권장 | Status |
|----------|------|----------|------|--------|
| DT-01 | CASCADE vs RESTRICT | HIGH | Option A | [Pending] |
| DT-02 | USER 조회 권한 범위 | HIGH | Option B | [Pending] |
| DT-02-A | is_public 컬럼 추가 | HIGH | Option A | [Pending] |
| DT-02-B | is_public 기본값 | HIGH | Option A | [Pending] |
| DT-03 | Rollback 범위 | HIGH | Option A | [Pending] |
| DT-04 | 처리 시간 입력 | HIGH | Option A | [Pending] |
| DT-05 | MANAGER 부서 제약 | HIGH | Option A | [Pending] |
| DT-06 | IN_PROGRESS 담당자 변경 | HIGH | Option A | [Pending] |
| DT-07 | 심각도 변경 | MEDIUM | Option B | [Pending] |
| DT-08 | 배지 필터링 | MEDIUM | Option A | [Pending] |
| DT-09 | 파일 검증 시점 | MEDIUM | A+B | [Pending] |
| DT-10 | TypeScript 타입 위치 | LOW | Option A | [Pending] |
| DT-11 | API 응답 포맷 | LOW | Option A | [Pending] |

---

## Decision Process

### Step 1: 팀 리뷰 (1시간)
1. 각 HIGH Priority 주제 5분 토론
2. 권장 선택지에 동의하는지 확인
3. 이의 있으면 대안 검토

### Step 2: 결정 기록 (30분)
- Decision Matrix 업데이트
- 결정 근거 기록

### Step 3: PRD 반영 (1일)
- 결정사항을 PRD에 통합
- 구현팀 최종 리뷰

---

**토론 준비 완료**
- 작성자: Claude Haiku 4.5
- 작성일: 2026-01-25
- 상태: 팀 의사결정 대기 중
