<!-- Generated: 2026-01-25 23:15:00 KST -->

# 직원 관리 (인사) PRD - 비판적 검토 보고서

**문서번호:** 2091
**검토일:** 2026-01-25
**검토 에이전트:** prd-critiquer
**상태:** 초안 검토 완료

---

## 검토 요약

본 PRD는 sunjin-erp 시스템의 핵심 인사관리 모듈을 다루며, 전반적인 구조와 요구사항이 명확하게 작성되었다. 그러나 **권한 제어의 세밀함, 데이터베이스 설계의 일관성, 에러 처리 전략, 성능 최적화 구체성** 등 여러 영역에서 중요한 개선이 필요하다. 특히 MANAGER 권한의 경계 케이스, 계정 비활성화 vs soft delete의 혼동, Account 엔티티의 ON DELETE RESTRICT 정책 등은 구현 시 심각한 문제를 야기할 수 있다. 아래는 15개의 비판적 지적사항이다.

---

## 비판적 지적 사항

### 1. Account Entity의 모순된 ON DELETE RESTRICT 정책

**카테고리:** 데이터베이스 설계
**심각도:** **HIGH** (구현 블로커)

**설명:**
PRD는 Account의 foreign key를 다음과 같이 정의한다:
- `employee_id (FK → EMPLOYEE, UNIQUE, ON DELETE RESTRICT)`

그러나 동시에:
- US-10에서 "관련 프로젝트/기술지원 기록이 있으면 경고 (삭제 불가)"라고 명시
- Account 삭제 시 hard delete (복구 불가)를 요구

**문제:**
1. Employee를 hard delete하려면 Account를 먼저 삭제해야 하는데, 이는 "평문 암호 저장 금지" 규칙과 충돌
2. Account의 ON DELETE RESTRICT는 "soft delete된 Employee"를 참조하는 경우도 제약하므로 soft delete와 불일치
3. Account가 이미 soft delete되어 있다면, Account.deleted_at != null인 상태로 Employee를 hard delete할 수 있으므로 ON DELETE RESTRICT의 의미가 불명확함

**영향:**
- 직원 삭제 워크플로우 불명확
- 규칙 위반 위험

**권고 해결안:**
```
선택안 1: Account는 soft delete만 사용, ON DELETE SET NULL (권장)
  → Employee hard delete 불가, Employee soft delete만 가능

선택안 2: Account와 Employee를 함께 soft delete하고, hard delete는 관리자 수동 작업
  → Account.deleted_at = now() 후 Employee.deleted_at = now() 순서
  → 이 경우 ON DELETE RESTRICT 제거, cascading soft delete 구현

선택안 3: Account의 ON DELETE RESTRICT를 ON DELETE CASCADE로 변경
  → 계정 정보 손실 위험 증가 (감사 추적 측면에서 부적절)
```

PRD에서 Account 삭제 정책을 명확히 재정의할 필요가 있다.

---

### 2. MANAGER 권한: 다른 부서 직원 조회 시 예외 케이스 누락

**카테고리:** 인증 및 권한 제어
**심각도:** **HIGH** (보안 이슈)

**설명:**
PRD US-6에서 MANAGER는 "자신의 부서에 속한 직원의 기본 정보를 읽기 전용으로 조회"할 수 있다고 하고, 5.7에서 다른 부서 직원 조회 시 API 403을 반환한다고 명시했다.

그러나 다음의 예외 케이스가 정의되지 않았다:

1. **상위 매니저 조회:** 직원의 `manager_id`가 가리키는 직원이 다른 부서일 경우?
2. **부서 변경 후 권한:** MANAGER의 부서가 변경되었을 때, 이전 부서 직원 기록을 조회할 수 있는가?
3. **부서 계층 구조:** 상위 부서의 MANAGER가 하위 부서 직원을 조회할 수 있는가?
4. **로그인 후 부서 변경:** 세션 캐시된 `department_id`가 현재 직원의 부서와 일치하지 않으면?

**영향:**
- 권한 검증 로직 구현 시 보안 허점 발생
- 세션 업데이트 정책 불명확

**권고 해결안:**
```
1. 부서 계층 구조 정책 명시:
   - "MANAGER는 자신의 부서와 하위 부서 모든 직원 조회 가능"
   또는
   - "MANAGER는 자신의 부서만 조회 가능 (하위 부서 제외)"

2. 상위 매니저 조회 정책:
   - "MANAGER는 employee.manager_id를 통해 상위 매니저 정보 조회 가능"
   (이 경우 `name`, `email` 정도만 제한적으로 표시)

3. 세션 업데이트 정책:
   - "로그인 후 부서 변경 시 세션 refresh 필요"
   또는
   - "매 API 호출 시 현재 department_id를 DB에서 조회"
```

---

### 3. Employee 비활성화 (is_active) 정책과 soft delete (deleted_at) 혼동

**카테고리:** 데이터 모델 설계
**심각도:** **HIGH** (기능 혼동)

**설명:**
PRD는 다음 두 개념을 혼용한다:

1. **Soft Delete (deleted_at):**
   - 모든 테이블에 포함되며, 기본적으로 조회에서 제외됨
   - US-1~US-3에서 "부서/직급/직원 삭제"는 soft delete를 의미

2. **비활성화 (is_active):**
   - US-8에서 "퇴사한 직원을 비활성화하여 로그인을 차단"
   - Employee 엔티티에는 정의되지 않았으나, Account 엔티티에는 있음

**문제:**
- US-8: "비활성화 시 is_active = false, 삭제되지 않음 (soft delete 아님)"
  → Employee 엔티티에 `is_active` 필드가 정의되지 않음 (4.1 Scope 참조)
- Account.is_active와 Employee.deleted_at의 관계가 불명확
  - Account.is_active = false이지만 Employee.deleted_at = null인 경우?
  - Account.is_active = true이지만 Employee.deleted_at != null인 경우?

**영향:**
- 로그인 검증 로직: 어떤 필드를 체크할 것인가?
- 직원 목록: 비활성화된 직원을 표시할 것인가?
- API 필터링: `is_active` 필터가 Account인가 Employee인가?

**권고 해결안:**
```
옵션 1 (권장): Employee에 is_active 필드 추가
  - DELETE /api/employees/[id]는 hard delete 또는 is_active = false로 변경
  - Account.is_active는 제거하고, Account는 Employee.is_active에 의존

  EMPLOYEE 엔티티 수정:
  ├── is_active (BOOLEAN, default: true)
  ├── deleted_at (TIMESTAMP, soft delete용)

  로그인 검증:
  - SELECT ... WHERE username = ? AND is_active = true AND deleted_at IS NULL

옵션 2: 명확한 상태 모델 정의
  - Employee.status: 'ACTIVE' | 'INACTIVE' | 'DELETED'
  - Account.status: 'ACTIVE' | 'DISABLED'
  - 이 경우 enum 검사 필요

옵션 3 (현재 방식 유지하되 명확화):
  - Employee는 soft delete만 사용 (deleted_at)
  - Account.is_active는 Employee와 독립적 (계정 비활성화용)
  - 규칙: Account.is_active = false인 경우 로그인 불가
         Employee.deleted_at != null인 경우 목록/조회에서 제외

  이 경우 명확한 설명 추가 필요
```

---

### 4. 계정 생성 및 비활성화 API 엔드포인트의 일관성 부족

**카테고리:** API 설계
**심각도:** **MEDIUM** (일관성 이슈)

**설명:**
섹션 5.2 API 라우트에서:
- `POST /api/employees/[id]/deactivate` — 계정 비활성화
- `POST /api/employees/[id]/reactivate` — 계정 활성화

그러나:
- 이 엔드포인트들이 Account를 수정하는 건지 Employee를 수정하는 건지 불명확
- POST 요청에 본문이 없다면, Account 선택 메커니즘이 불명확
  (한 Employee가 여러 Account를 가질 수 있는가?)
- 다른 API 엔드포인트와의 일관성 부족

**영향:**
- 구현 시 혼동 발생
- 문서와 코드 불일치

**권고 해결안:**
```
옵션 1 (권장): Account를 직접 제어
  POST /api/accounts/[accountId]/deactivate (Account 엔티티 기준)
  POST /api/accounts/[accountId]/reactivate

  또는

  PUT /api/accounts/[accountId]
  {
    "is_active": false
  }

옵션 2: Employee 기준으로 통합 (한 Employee = 한 Account 가정)
  POST /api/employees/[id]/account/deactivate
  POST /api/employees/[id]/account/reactivate

  이 경우 "한 Employee가 하나의 Account만 가질 수 있다"는 제약을 명시

현재 PRD는 엔드포인트 명을 `deactivate/reactivate`라고 했으나,
이것이 Account의 `is_active` 토글인지 Employee.deleted_at 설정인지 명확히 할 필요
```

---

### 5. 암호 변경 이력 기록 정책의 모순

**카테고리:** 보안 및 감사 추적
**심각도:** **MEDIUM** (규정 위반 위험)

**설명:**
PRD 5.6에서:
- "암호 변경 시각만 기록 (평문이나 해시 저장 금지)"

그러나 US-4의 Acceptance Criteria:
- "암호 변경 이력 기록 (평문 저장 금지, 변경 시각만 기록)"

EmployeeHistory.changed_fields는 JSON으로 정의되어 있으며, 암호 변경 시 이를 기록하려면:

**문제:**
1. 암호 변경 이력을 `EmployeeHistory.change_type = 'UPDATE'`로 기록할 때, `changed_fields` 어디에 저장할 것인가?
2. `{"password": {"before": "***", "after": "***"}}`처럼 마스킹하면 실제 변경 내역 검증 불가
3. OWASP 감사 기준: "암호 변경 이력은 기록되어야 한다"는 권고는 변경 시각과 변경자만을 의미하나?

**영향:**
- 감사 추적 불완전
- 규정 준수 불명확

**권고 해결안:**
```
1. EmployeeHistory 엔티티 확장:
   ├── account_id (FK, nullable)
   ├── change_type: 'PASSWORD_CHANGED' 추가
   ├── changed_fields: null (암호는 기록 안 함)
   ├── changed_by_id
   ├── changed_at

2. Account 엔티티에 별도 필드:
   ├── password_changed_at (TIMESTAMP)
   ├── password_changed_by_id (FK, nullable)

3. EmployeeHistory 기록 규칙:
   - CREATE: 모든 필드 기록
   - UPDATE: 변경된 필드만 기록 (암호 제외)
   - PASSWORD_CHANGED: password_changed_at만 기록
   - DEACTIVATE: 변경 없음 (change_type만 의미 있음)
```

---

### 6. 직급 레벨 (1~10) 활용 사례 및 정렬 규칙 불명확

**카테고리:** 요구사항 완성도
**심각도:** **MEDIUM** (기능 명확성)

**설명:**
PRD에서:
- Position.level: 1~10 (check constraint 필요)
- 직급 코드는 자동 생성: POS-{5digit}

그러나:
1. 레벨의 의미가 불명확
   - 1 = CEO, 10 = Intern? 또는 반대?
   - 이 레벨이 조직 권한 계층(ADMIN/MANAGER/USER)과 관련이 있는가?
2. 직급 목록 페이지에서 정렬 순서는?
   - `level` ASC인가 DESC인가?
3. 직급 레벨이 Employee의 권한 역할(role)을 자동으로 결정하는가?
   - "직급이 3 이상이면 MANAGER" 같은 규칙이 있는가?

**영향:**
- UI에서 직급 선택 시 정렬 순서 불명확
- Employee 생성/수정 시 직급 레벨에 따른 권한 자동 배치 로직 필요 여부 불명확

**권고 해결안:**
```
1. 레벨 정의 명시:
   "Position.level은 조직 계층을 나타낸다.
   1: 최고 경영진, 2: 임원, 3~5: 부장급, 6~8: 과장급, 9~10: 사원급
   (예시, 실제 정의는 고객사 조직 구조에 따라 수정)"

2. UI 정렬:
   "직급 목록은 level ASC 순서로 표시"

3. 권한과 직급의 관계:
   "Note: Position.level은 직급(호칭)을 나타내며,
   Account.role (ADMIN/MANAGER/USER)은 시스템 권한을 나타낸다.
   둘은 독립적이다. 예: 과장(level=5)이 USER 권한일 수 있다."
```

---

### 7. 부서 계층 구조 깊이 제한 및 순환 참조 방지 규칙 부재

**카테고리:** 데이터베이스 설계
**심각도:** **MEDIUM** (데이터 무결성)

**설명:**
PRD 4.1에서:
- `Department.parent_department_id (FK, nullable, ON DELETE RESTRICT)`

그러나:
1. 순환 참조 방지 로직이 정의되지 않음
   - Department A의 부모 = Department B
   - Department B의 부모 = Department A
   → 무한 루프 가능
2. 깊이 제한 없음 (Open Question에서 "무제한"이라고 명시)
   - 10단계 깊이의 부서 계층이 조회 성능에 영향?
3. Orphan 부서 방지 규칙이 불명확
   - "parent_department_id가 deleted_at != null인 부서를 가리킬 수 있는가?"

**영향:**
- 부서 계층 조회 API에서 무한 루프 위험
- 성능 저하 가능성

**권고 해결안:**
```
Database 레벨:
1. 순환 참조 방지는 Application 코드에서만 가능
   (DB 제약으로는 불가능, 트리거 필요하면 복잡)

2. 깊이 제한:
   "부서 계층은 최대 5단계로 제한한다"
   또는
   "무제한이나, UI에서는 최대 3단계까지 표시"

3. Orphan 부서:
   "parent_department_id가 deleted_at != null인 경우,
   해당 부서는 최상위 부서로 취급한다"

   또는

   "부모 부서가 soft delete될 때,
   자식 부서의 parent_department_id를 NULL로 설정"

API 구현:
- GET /api/departments: 순환 참조 감지 로직 추가
  function getAncestors(deptId, visited = []) {
    if (visited.includes(deptId)) throw Error('Circular reference');
    ...
  }
```

---

### 8. 직원 검색 필터 조합 시 성능 명시 부재

**카테고리:** 성능 및 확장성
**심각도:** **MEDIUM** (성능 보장 불확실)

**설명:**
PRD 5.9에서:
- "API Response Time Target: p95 < 200ms"
- "직원 검색 성능: < 100ms"

그러나:
1. "직원 검색 성능 < 100ms"는 어느 조건인가?
   - 전체 직원 중 1만 명 검색?
   - 단순 이름 검색인가?
   - 필터 5개 조합?
2. Index 전략(5.9)에서 복합 인덱스 부재
   - `(department_id, position_id, hired_at)`?
   - `(deleted_at, name)` 또는 `(deleted_at, email)`?

**영향:**
- 대규모 직원 데이터(수만 건)에서 성능 저하 가능
- 목록 조회 시간 초과 가능

**권고 해결안:**
```
인덱스 전략 추가:
- Compound Index: (deleted_at, department_id, position_id)
- Composite Search Index: (deleted_at, name) for LIKE query
- Composite Search Index: (deleted_at, email) for exact match

성능 명시:
- "단일 필터 (department_id만): < 100ms"
- "전체 필터 조합 (5개): < 200ms"
- "LIKE 검색 (이름 시작 문자): < 150ms"

Query Optimization:
- SELECT에서 필요한 컬럼만 조회 (예: list에서 account 정보 제외)
- pagination limit 최대값 100으로 제한 (이미 정의됨)
```

---

### 9. 부서/직급 삭제 시 "소속 직원이 없는 경우" 검증 세부사항 불명확

**카테고리:** 요구사항 완성도
**심각도:** **MEDIUM** (구현 일관성)

**설명:**
US-1, US-2:
- "부서 삭제 시 소속 직원이 없는 경우에만 삭제 가능"
- "직급 삭제 시 소속 직원이 없는 경우에만 삭제 가능"

그러나:
1. "소속 직원이 없는 경우"의 정의가 모호
   - Soft delete된 Employee도 카운트하는가?
   - 예: department_id = 1인 Employee는 3명인데, 모두 deleted_at != null?
2. 에러 응답이 정의되지 않음
   - `409 Conflict`인가? 아니면 `400 Bad Request`?
   - 응답 본문에 "this department has 2 active employees"라고 명시해야 하는가?

**영향:**
- 삭제 실패 시 사용자 경험 불확실
- API 클라이언트 에러 처리 로직 불명확

**권고 해결안:**
```
1. "소속 직원" 정의 명시:
   "부서에 소속된 활성 직원을 의미한다 (deleted_at IS NULL)
    Soft delete된 직원은 카운트하지 않는다."

   또는

   "부서에 소속된 모든 직원을 의미한다 (soft delete 포함).
    따라서 과거 직원이 존재하면 부서 삭제 불가."

2. API 응답 스펙:
   DELETE /api/departments/[id]

   Success (204 No Content)

   Failure (409 Conflict):
   {
     "error": "DEPARTMENT_HAS_EMPLOYEES",
     "message": "이 부서에는 2명의 활성 직원이 있어 삭제할 수 없습니다.",
     "employeeCount": 2,
     "departmentId": 1
   }
```

---

### 10. 권한 검증 실패 시 응답 일관성 부재

**카테고리:** API 설계
**심각도:** **LOW** (문서화 개선)

**설명:**
PRD에서:
- "MANAGER가 다른 부서 직원 접근 시 403 Forbidden 응답"
- 그러나 403, 404, 401의 구분이 불명확

**상황 1:** MANAGER가 Employee ID=1을 조회하는데, 그 직원이 다른 부서:
- `GET /api/employees/1` → 403 Forbidden?
- 아니면 `404 Not Found`?

**상황 2:** 비로그인 사용자가 직원 목록 조회:
- `GET /api/employees` → 401 Unauthorized?

**영향:**
- 프론트엔드 에러 처리 로직 불명확
- API 클라이언트 혼동

**권고 해결안:**
```
API 응답 표준화:
- 401 Unauthorized: 세션 없음 또는 만료
- 403 Forbidden: 세션 있으나 권한 없음 (role 또는 department 제약)
- 404 Not Found: 리소스 없음 또는 권한으로 인해 조회 불가

예:
GET /api/employees/1 (MANAGER, 다른 부서)
→ 403 또는 404 선택하되, 그 이유를 응답 본문에 명시

Response (403):
{
  "error": "FORBIDDEN",
  "message": "다른 부서의 직원 정보는 조회할 수 없습니다.",
  "reason": "DEPARTMENT_MISMATCH"
}

또는

Response (404):
{
  "error": "NOT_FOUND",
  "message": "해당 직원을 찾을 수 없습니다."
}
(권한 문제를 명시하지 않음, 보안상 권장)
```

---

### 11. 유효성 검증: 전화번호 형식 검증 규칙 너무 광범위

**카테고리:** 입력 검증
**심각도:** **LOW** (데이터 품질)

**설명:**
PRD 4.1에서:
- "전화번호: 한국 표준 형식 (02-xxxx-xxxx, 010-xxxx-xxxx, 등)"

"등"이 너무 광범위하며, 정확한 정규식이 정의되지 않았다.

**가능한 형식:**
- 02-1234-5678 (지역번호)
- 010-1234-5678 (모바일)
- 031-1234-5678 (지역번호)
- 050-1234-5678 (인터넷 전화)
- 1600-1234 (콜센터)
- 01-1234-5678 (유효하지 않은 형식)

**영향:**
- 구현 시 정규식 선택에 따라 수용/거부 기준 다름
- 유효한 한국 전화번호 거부 가능

**권고 해결안:**
```
정규식 명시:
"한국 표준 형식: (02|031|032|033|...)-\d{3,4}-\d{4} 또는 01[0-9]-\d{3,4}-\d{4}"

또는 더 관대하게:
"하이픈이 포함된 숫자: \d{2,3}-\d{3,4}-\d{4}"

또는 가장 관대하게:
"숫자와 하이픈만 포함: [\d-]{10,}"

권장: 첫 번째 또는 두 번째 (명확성)
```

---

### 12. 이메일 중복 검증 시 soft delete 제외 규칙의 마이그레이션 고려 부재

**카테고리:** 데이터 일관성
**심각도:** **LOW** (마이그레이션 이슈)

**설명:**
PRD US-3, 4.1:
- "이메일 중복 검증 (soft delete 제외)"
- 이는 `WHERE deleted_at IS NULL` 조건으로 UNIQUE 제약을 구현하는 것

그러나:
1. 기존 시스템에서 마이그레이션 시, 동일한 이메일로 soft delete된 두 직원이 있을 경우?
2. 이를 해결하는 마이그레이션 전략이 정의되지 않음

**영향:**
- 기존 데이터와의 충돌 가능
- 마이그레이션 스크립트 작성 필요

**권고 해결안:**
```
Migration 관련 주석 추가:
"신규 직원 등록 시 이메일 중복 검증은 WHERE deleted_at IS NULL 조건으로
수행하여 soft delete된 직원과의 중복을 허용한다.
따라서 기존 시스템에서 마이그레이션 시, 이메일 중복 체크를 먼저 수행하고
필요하면 이메일 suffix 추가 (e.g., kim@company.com → kim_old@company.com)"
```

---

### 13. 캐시 무효화 전략: 부분 무효화 vs 전체 무효화 구현 방식 미정

**카테고리:** 성능 및 캐싱
**심각도:** **LOW** (구현 세부사항)

**설명:**
PRD 4.1에서:
- "부분 무효화 지원 (특정 직원의 캐시만 무효화)"

그러나:
1. TanStack Query에서 부분 무효화의 구현 방식이 정의되지 않음
   - `queryClient.invalidateQueries({ queryKey: ['employees', 'detail', id] })`?
   - 아니면 `queryClient.setQueryData(['employees', id], newData)`?
2. 전체 무효화(`employees-list`)와 부분 무효화(`employees-detail-{id}`)의 우선순위?

**영향:**
- 캐시 동기화 오류 가능
- 구현 복잡도 증가

**권고 해결안:**
```
캐시 전략 명시:
"직원 수정 후:
1. setQueryData로 detail 캐시 즉시 업데이트
   queryClient.setQueryData(['employees', 'detail', id], updatedData)

2. list 캐시는 stale로 표시하되, 필요시에만 refetch
   queryClient.invalidateQueries({ queryKey: ['employees', 'list'] })

3. department/position 캐시는 그대로 유지 (영향 없음)"

또는 더 보수적으로:
"직원 정보 변경 시, 다음 캐시 모두 무효화:
- employees-list
- employees-detail-{id}
(단순하고 안전한 방식)"
```

---

### 14. User 역할의 정의: 직원 관리 메뉴 미표시 외에 추가 제약 없음

**카테고리:** 인증 및 권한 제어
**심각도:** **LOW** (기능 범위)

**설명:**
PRD 4.1에서:
- `USER: 직원 관리 메뉴 미표시`

그러나:
1. USER 역할이 자신의 기본 정보를 조회할 수 있는가?
   - `GET /api/employees/[self]` 접근 가능?
2. USER가 자신의 계정 정보(role, last_login)를 조회할 수 있는가?
3. USER가 자신의 비밀번호를 변경할 수 있는가?
   - 이는 직원 관리 모듈의 범위인가?

**영향:**
- USER의 기본 정보 조회 권한 불명확
- 비밀번호 변경 기능이 이 PRD에 포함되는가?

**권고 해결안:**
```
USER 역할 명시:
"USER는 다음 기능에 접근할 수 없다:
- 직원 목록 페이지 (/employees)
- 부서/직급 관리 페이지 (/employees/departments, /employees/positions)
- 다른 직원의 상세 정보 조회
- 직원 관리 관련 메뉴

USER는 다음 기능에 접근할 수 있다 (별도 PRD에서 정의):
- 자신의 프로필 조회 (dashboard)
- 자신의 비밀번호 변경 (인증 모듈)
- 자신의 기본 정보 수정 (프로필 관리)"

이 항목들이 이 PRD에 포함되지 않으면:
"USER 역할은 직원 관리 모듈에서 사용되지 않으며,
별도 인증/프로필 관리 PRD에서 정의된다."
```

---

### 15. 조직도 시각화 Phase 2 의존성: 부서 계층 조회 API 여부 불명확

**카테고리:** API 설계 및 범위
**심각도:** **LOW** (향후 호환성)

**설명:**
Out-of-Scope에서:
- "조직도 시각화 — Phase 2 (조직도 다이어그램, 계층도)"

그러나 Phase 2를 위해 Phase 1에서 필요한 API가 정의되지 않았다:
- `GET /api/departments/tree` — 부서 계층도 (재귀적 조회)
- `GET /api/departments/[id]/employees` — 부서별 직원 목록

**영향:**
- Phase 2에서 API 재설계 필요
- Phase 1에서 미리 구현했으면 좋을 API 누락

**권고 해결안:**
```
선택안 1: Phase 1에 추가
GET /api/departments/tree
{
  "id": 1,
  "name": "IT",
  "children": [
    { "id": 2, "name": "System Team", "children": [] },
    { "id": 3, "name": "Network Team", "children": [] }
  ]
}

선택안 2: Phase 1 범위 명시
"부서 계층 조회는 Phase 2에서 구현되며,
Phase 1에서는 평탄한 부서 목록만 제공한다."
```

---

## 요약 및 권고

### 주요 블로커 (HIGH 심각도)

| # | 제목 | 영향 | 권고 |
|---|------|------|------|
| 1 | Account ON DELETE RESTRICT 모순 | Employee 삭제 워크플로우 불명확 | Account 삭제 정책 재정의 |
| 2 | MANAGER 권한 예외 케이스 누락 | 보안 허점 | 부서 계층/세션 정책 명시 |
| 3 | 비활성화 vs Soft Delete 혼동 | 기능 구현 불명확 | Employee에 is_active 필드 추가 또는 명확화 |

### 중요 개선 항목 (MEDIUM 심각도)

| # | 제목 | 영향 | 권고 |
|---|-----|------|------|
| 4 | API 엔드포인트 일관성 | 구현 시 혼동 | 엔드포인트 명시 재정의 |
| 5 | 암호 변경 이력 기록 정책 모순 | 규정 위반 위험 | EmployeeHistory 엔티티 확장 |
| 6 | 직급 레벨 활용 불명확 | 기능 명확성 부족 | 레벨 정의 및 정렬 규칙 명시 |
| 7 | 부서 계층 순환 참조 방지 부재 | 데이터 무결성 | 순환 참조 검증 로직 추가 |
| 8 | 검색 성능 조건 불명확 | 성능 보장 불확실 | 인덱스 전략 및 성능 명시 |
| 9 | 삭제 검증 세부사항 불명확 | 구현 일관성 | 에러 응답 스펙 정의 |

### 경미한 개선 항목 (LOW 심각도)

| # | 제목 | 권고 |
|---|------|------|
| 10 | 권한 검증 응답 일관성 | 401/403/404 구분 명시 |
| 11 | 전화번호 형식 검증 | 정규식 명시 |
| 12 | Soft delete 마이그레이션 | 마이그레이션 전략 문서화 |
| 13 | 캐시 무효화 구현 방식 | TanStack Query 전략 명시 |
| 14 | USER 역할 정의 | USER 접근 범위 명시 |
| 15 | Phase 2 호환성 | 부서 계층 조회 API 고려 |

---

## 최종 권장사항

### 즉시 해결 필요 (다음 버전 전에)

1. **Account 삭제 정책 재정의** (HIGH)
   - Employee hard delete 워크플로우 재설계
   - ON DELETE 제약 정책 명확화

2. **Employee 비활성화 모델 통일** (HIGH)
   - `is_active` 필드 추가 또는 명확한 soft delete 규칙
   - Account.is_active와의 관계 정의

3. **MANAGER 권한 예외 케이스 문서화** (HIGH)
   - 부서 계층 조회 정책
   - 세션 업데이트 정책
   - 상위 매니저 조회 규칙

### 구현 단계에서 명확화 필요

4. API 엔드포인트 및 응답 스펙 상세 정의 (섹션 2091_XX 세부 구현 PRD 작성)
5. 암호 보안 및 감사 추적 규칙 통합 (Account + EmployeeHistory 엔티티 재검토)
6. 성능 목표 및 인덱스 전략 상세 정의 (DB 마이그레이션 PRD에 포함)

### Phase 1 종료 후 검토 추천

7. 부서 계층 조회 API 추가 여부 (Phase 2 준비)
8. USER 역할 기능 범위 명확화 (인증 모듈과의 연계)
9. 캐시 무효화 전략 구현 검증 (성능 테스트)

---

## 검토자 서명

**검토일:** 2026-01-25
**검토 에이전트:** prd-critiquer
**상태:** 초안 검토 완료, 피드백 대기 중

---
