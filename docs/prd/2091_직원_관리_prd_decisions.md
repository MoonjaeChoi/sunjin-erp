<!-- Generated: 2026-01-25 23:50:00 KST -->

# 직원 관리 (인사) PRD - 최종 결정 사항

**문서번호:** 2091
**작성일:** 2026-01-25
**결정자:** prd-mediator
**상태:** 최종 결정 완료
**대상:** PRD v2 (2091_직원_관리_prd_v2.md)

---

## 결정 개요

본 문서는 비판적 검토(critical review)와 토론 주제(discussion topics)에서 도출된 12개의 중요 결정사항을 정리한다. 각 결정은 sunjin-erp의 아키텍처 원칙(보안 우선, 명확성, 데이터 무결성)과 Phase 1 중심 범위를 고려하여 AI-assisted mode로 선정되었다.

---

## 결정 사항

### Decision 1: MANAGER 권한 범위 - 정확한 부서만

**Topic:** MANAGER 권한 범위 - 정확한 부서만 vs 하위 부서 포함 (DT-1)
**Category:** RBAC (Role-Based Access Control)
**Priority:** HIGH
**Phase:** Phase 1

**Decision:** Option A - MANAGER는 정확히 자신의 부서(`EMPLOYEE.department_id = MANAGER.department_id`)만 조회 가능. 하위 부서는 제외.

**Rationale:**
- **보안 우선:** sunjin-erp 원칙에 따라 최소 권한(principle of least privilege) 준수
- **명확성:** 권한 경계가 단순명확하여 보안 감사 용이
- **구현 간단:** 하위 부서 조회를 위한 재귀 알고리즘 불필요
- **Phase 2 확장 가능:** 향후 필요하면 하위 부서 포함 기능 추가

**Implementation Impact:**
- API 필터링: `WHERE EMPLOYEE.department_id = :managerDepartmentId`
- 세션: `session.user.department_id` 활용
- 권한 검증: 상세 조회 시 `employee.department_id === session.user.department_id` 확인
- 에러: MANAGER가 다른 부서 직원 조회 시 403 Forbidden (또는 404 Not Found)

**Affected Sections:**
- Section 3 (US-6): MANAGER 직원 조회 범위 명시
- Section 5.5 (Auth & RBAC): MANAGER 부서 필터링 규칙 명확화
- Section 5.7: 부서 기반 권한 필터링 상세 설명

**Acceptance Criteria:**
- MANAGER는 자신의 부서만 조회 가능
- 다른 부서 직원 상세 조회 시 API 오류 반환
- 권한 검증 로직 구현 시 department_id 일치 확인

---

### Decision 2: Account 비활성화 vs Employee 소프트 삭제 정책

**Topic:** Account 비활성화 vs Employee 소프트 삭제 정책 (DT-2)
**Category:** Database Design & Data Model
**Priority:** HIGH
**Phase:** Phase 1

**Decision:** Option A - 이중 메커니즘 분리 유지 (명확한 문서화 필수)
- `Account.is_active = false`: 로그인만 차단, 직원 정보 유지
- `Employee.deleted_at ≠ null`: 목록에서 제외, 과거 기록 유지
- `hard delete`: 의존성 확인 후 물리 삭제

**Rationale:**
- **명확한 의도 구분:** 계정 비활성화(로그인 차단)와 직원 소프트 삭제(기록 제외)의 목적 분리
- **라이프사이클 독립 관리:** Account와 Employee를 독립적으로 관리 가능
  - 시나리오 1: 퇴사 직원 → Account.is_active = false + Employee.deleted_at = now()
  - 시나리오 2: 일시 휴직 → Account.is_active = false (Employee는 유지)
  - 시나리오 3: 완전 삭제 (의존성 없을 시) → hard delete
- **감사 추적:** Employee 기록 유지로 과거 프로젝트/기술지원 연결 유지

**Implementation Impact:**
- Employee 엔티티: 기존 설계 유지 (Employee에 is_active 추가하지 않음, deleted_at으로 관리)
- Account 엔티티: is_active 필드 유지
- 로그인 검증: Account.is_active = true AND Employee.deleted_at IS NULL 확인
- 직원 목록: Employee.deleted_at IS NULL만 조회

**Affected Sections:**
- Section 4.1 (In-Scope): Employee 엔티티 스키마 명확화
- Section 5.3 (Database): ON DELETE 정책 설명 강화
- Section 5.5 (Auth & RBAC): 로그인 검증 체크리스트 추가
- Section 8 (Security): 계정 비활성화 vs 직원 삭제의 차이 명시

**Acceptance Criteria:**
- Account.is_active = false인 경우 로그인 불가
- Employee.deleted_at ≠ null인 경우 목록/조회에서 제외 (ADMIN 제외)
- 비활성화와 삭제의 의도가 명확히 문서화됨

---

### Decision 3: 감사 추적의 생성자/변경자 보존 전략

**Topic:** 감사 추적의 생성자/변경자 보존 전략 (DT-3)
**Category:** Database Integrity & Audit Trail
**Priority:** HIGH
**Phase:** Phase 1

**Decision:** Option A - `created_by_id`, `updated_by_id`, `changed_by_id`의 Foreign Key를 `ON DELETE RESTRICT`로 변경

**Rationale:**
- **감사 추적 신뢰성:** 생성자/변경자 정보가 영구 보존되어 규정 준수(compliance)
- **데이터 무결성:** 감사 로그의 무결성이 가장 중요한 시스템 요구사항
- **제약 관리:** 생성자가 퇴사해도 계정 삭제 시 의존성 검증으로 명확한 에러 제시
- **sunjin-erp 원칙:** "Consistency > flexibility, Safety > performance"

**Implementation Impact:**
- Database Constraints:
  - `Employee.created_by_id: ON DELETE RESTRICT`
  - `Employee.updated_by_id: ON DELETE RESTRICT`
  - `EmployeeHistory.changed_by_id: ON DELETE RESTRICT`
- 직원 hard delete 시: 생성자/변경자로 등록된 Employee 존재 여부 확인
- 에러 처리: 의존성 있으면 "이 직원을 삭제할 수 없습니다. 이 직원이 생성/수정한 직원이 있습니다" 메시지

**Affected Sections:**
- Section 4.1 (In-Scope): Employee, EmployeeHistory 엔티티 FK 설정
- Section 5.3 (Database): ON DELETE RESTRICT 정책 명시
- Section 6 (API): hard delete 의존성 검증 강화

**Acceptance Criteria:**
- created_by_id, updated_by_id, changed_by_id는 모두 ON DELETE RESTRICT
- 직원 hard delete 시 이 필드의 의존성 확인 필수
- 의존성 있으면 명확한 에러 메시지 반환

---

### Decision 4: 부서 계층 구조 순환 참조 방지 전략

**Topic:** 부서 계층 구조 순환 참조 방지 전략 (DT-4)
**Category:** Database Integrity & API Validation
**Priority:** HIGH
**Phase:** Phase 1

**Decision:** Option A - API 레벨 검증 + 깊이 제한 (최대 5단계)

**Rationale:**
- **순환 참조 방지:** 부서 계층 조회 시 무한 루프 방지
- **성능 예측 가능:** 깊이 제한으로 조회 성능 보장 (최대 5단계는 조직 구조상 충분)
- **구현 명확:** DB 트리거 불필요, API 레벨에서 간단하게 구현
- **조직 표준:** 일반적 조직 구조는 5단계 이내

**Implementation Impact:**
- API: `PUT /api/departments/[id]` 시 parent_department_id 변경 검증
  ```
  1. 새 parent_department_id의 깊이 확인
  2. 새 부모의 모든 조상 중에 현재 부서가 없는지 확인 (순환 참조)
  3. 총 깊이가 5를 초과하면 에러
  ```
- 검증 알고리즘:
  ```
  function validateCircularReference(deptId, newParentId, maxDepth = 5) {
    const visited = new Set();
    let current = newParentId;
    let depth = 1;

    while (current !== null) {
      if (current === deptId) throw Error('순환 참조 감지');
      if (visited.has(current)) throw Error('순환 참조 감지');
      if (depth >= maxDepth) throw Error('최대 계층 깊이 초과');

      visited.add(current);
      current = getParentDepartmentId(current);
      depth++;
    }
  }
  ```
- 부서 생성 시: parent 없거나 유효한 부모만 선택 가능

**Affected Sections:**
- Section 4.1 (In-Scope): Department 엔티티 깊이 제한
- Section 5.3 (Database): 부서 계층 제약 명시
- Section 5.2 (API): PUT /api/departments/[id] 검증 규칙 추가

**Acceptance Criteria:**
- 부서 계층은 최대 5단계로 제한
- 순환 참조 시 API 오류 반환 (409 Conflict)
- 깊이 초과 시 명확한 에러 메시지 제시

---

### Decision 5: 초기 직원 계정 암호 관리 및 첫 로그인 프로세스

**Topic:** 초기 직원 계정 암호 관리 및 첫 로그인 프로세스 (DT-5)
**Category:** Security & User Experience
**Priority:** MEDIUM
**Phase:** Phase 1 (임시 암호), Phase 2 (강제 변경)

**Decision:** Option A (Phase 1) + Option C 검토 (Phase 2)
- **Phase 1:** 관리자가 임시 암호를 수동으로 설정하고 UI에 일회 표시
- **Phase 2:** 암호 재설정 링크 기능 추가 (별도 인증 PRD)

**Rationale (Phase 1):**
- **간단한 구현:** Phase 1 핵심 기능에 집중
- **보안상 안전:** 임시 암호를 UI에 표시하고 관리자가 직접 전달
- **관리자 책임 명확:** 누가 어떤 암호를 설정했는지 추적 가능
- **마이그레이션 용이:** 레거시 시스템에서 기존 암호 유지 가능

**Rationale (Phase 2):**
- **셀프 서비스:** 직원이 자신의 암호를 직접 설정
- **보안 강화:** 일회용 재설정 링크로 보안 개선
- **사용자 경험 개선:** 이메일 기반 안내

**Implementation Impact (Phase 1):**
- Account 생성 API: `POST /api/employees/[id]/accounts`
  ```
  {
    "username": "kim.company",
    "temporaryPassword": "temp123!ABC",
    "role": "USER"
  }
  ```
- UI: 계정 생성 후 임시 암호 일회 표시, 복사 버튼 제공
- 규칙: 임시 암호는 최소 8자, 영문+숫자+특수문자 포함
- 암호 저장: bcrypt로 해시 후 저장

**Implementation Impact (Phase 2):**
- 별도 인증 PRD에서 정의
- 첫 로그인 시 암호 변경 강제 (Account.password_changed_at 체크)
- 이메일 발송 기능 필요

**Affected Sections:**
- Section 4.1 (In-Scope): Account 생성 프로세스
- Section 5.6 (Password Security): 임시 암호 생성 규칙
- Section 5.2 (API): POST /api/employees/[id]/accounts 스펙

**Acceptance Criteria (Phase 1):**
- 관리자가 임시 암호 입력/생성 가능
- UI에 일회 표시 후 숨김
- 암호는 bcrypt로 해시 저장

---

### Decision 6: Hard Delete 의존성 검증의 자동화 수준

**Topic:** Hard Delete 의존성 검증의 자동화 수준 (DT-6)
**Category:** Data Integrity & API Design
**Priority:** MEDIUM
**Phase:** Phase 1

**Decision:** Option A - 전체 FK 참조 검증 + 명확한 에러 메시지

**Rationale:**
- **데이터 무결성:** 모든 FK 참조 검사로 orphaned records 방지
- **명확한 피드백:** 사용자에게 왜 삭제할 수 없는지 명시
- **사용자 경험:** 삭제 불가 이유를 알면 조치 방법 인지 가능

**Implementation Impact:**
- API: `DELETE /api/employees/[id]`
  ```
  검증 순서:
  1. Account 참조 확인 (ON DELETE RESTRICT 이미 DB 제약)
  2. Project 테이블에서 담당자로 참조 확인
  3. TechSupport 테이블에서 담당자로 참조 확인
  4. Task 테이블에서 담당자로 참조 확인 (필요시)
  5. Issue 테이블에서 담당자로 참조 확인 (필요시)
  6. EmployeeHistory 테이블에서 changed_by_id로 참조 확인 (ON DELETE RESTRICT)
  ```
- 에러 응답 (409 Conflict):
  ```json
  {
    "error": "EMPLOYEE_HAS_DEPENDENCIES",
    "message": "이 직원을 삭제할 수 없습니다. 다음 의존성이 있습니다:",
    "dependencies": [
      {
        "table": "Project",
        "count": 3,
        "description": "담당자로 3개 프로젝트 등록"
      },
      {
        "table": "TechSupport",
        "count": 2,
        "description": "담당자로 2개 기술지원 기록"
      }
    ]
  }
  ```

**Affected Sections:**
- Section 4.1 (In-Scope): API 응답 스펙
- Section 5.2 (API): DELETE /api/employees/[id] 상세 정의
- Section 3 (US-10): 삭제 의존성 검증 강화

**Acceptance Criteria:**
- hard delete 시 모든 FK 참조 테이블 검사
- 참조 있으면 명확한 에러 메시지 반환
- 에러 응답에 참조 정보 상세 포함

---

### Decision 7: 부서 삭제 시 자식 부서 처리 전략

**Topic:** 부서 삭제 시 자식 부서 처리 전략 (DT-7)
**Category:** Data Integrity & Business Rules
**Priority:** MEDIUM
**Phase:** Phase 1

**Decision:** Option A - 엄격한 삭제 조건 (자식 부서 AND 직원 모두 없어야 함)

**Rationale:**
- **명확한 경계:** 삭제 조건이 단순명확
- **데이터 무결성:** 고아 부서(orphan department) 방지
- **사용자 명확성:** 왜 삭제할 수 없는지 이유 제시

**Implementation Impact:**
- API: `DELETE /api/departments/[id]`
  ```
  검증:
  1. 직접 자식 부서(parent_department_id = id) 있는지 확인
  2. 직접 소속 직원(department_id = id, deleted_at IS NULL) 있는지 확인
  3. 둘 다 없어야만 삭제 가능
  ```
- 에러 응답 (409 Conflict):
  ```json
  {
    "error": "DEPARTMENT_HAS_CHILDREN_OR_EMPLOYEES",
    "message": "부서를 삭제할 수 없습니다.",
    "reasons": [
      "자식 부서 1개 있음",
      "활성 직원 2명 있음"
    ]
  }
  ```

**Affected Sections:**
- Section 3 (US-1): 부서 삭제 조건
- Section 5.2 (API): DELETE /api/departments/[id] 스펙

**Acceptance Criteria:**
- 자식 부서 있으면 삭제 불가
- 활성 직원 있으면 삭제 불가
- 두 조건 모두 충족해야만 삭제 가능

---

### Decision 8: 캐시 무효화 전략의 세분화 수준

**Topic:** 캐시 무효화 전략의 세분화 수준 (DT-8)
**Category:** Performance & Caching
**Priority:** MEDIUM
**Phase:** Phase 1

**Decision:** Option A - 세분화된 부분 무효화 (또는 Option B 보수적 접근)

**Rationale:**
- **성능 최적:** 불필요한 재요청 최소화
- **사용자 경험:** 캐시 hit율 증가로 UI 반응성 개선
- **메모리 효율:** 필요한 캐시만 유지

**Implementation Impact (Option A 권장):**
- 직원 수정 시:
  ```
  // setQueryData로 detail 캐시 즉시 업데이트
  queryClient.setQueryData(['employees', 'detail', employeeId], updatedEmployee);

  // list 캐시는 부분 무효화 (해당 부서만)
  queryClient.invalidateQueries({
    queryKey: ['employees', 'list'],
    predicate: query => {
      const departmentId = query.queryKey[2]?.departmentId;
      return departmentId === employee.department_id;
    }
  });
  ```
- 부서 수정 시:
  ```
  queryClient.setQueryData(['departments', 'detail', deptId], updatedDept);
  queryClient.invalidateQueries({ queryKey: ['departments', 'list'] });
  ```
- 직급 수정 시:
  ```
  queryClient.setQueryData(['positions', 'detail', posId], updatedPos);
  queryClient.invalidateQueries({ queryKey: ['positions', 'list'] });
  ```

**Implementation Impact (Option B 대안 - 더 보수적):**
- 모든 변경 후:
  ```
  queryClient.invalidateQueries({ queryKey: ['employees', 'list'] });
  queryClient.invalidateQueries({ queryKey: ['departments'] });
  queryClient.invalidateQueries({ queryKey: ['positions'] });
  ```
- 더 간단하나 약간의 성능 저하

**Affected Sections:**
- Section 5.4 (State Management): TanStack Query 캐시 무효화 전략
- Section 4.1 (In-Scope): 캐시 무효화 구체적 규칙

**Acceptance Criteria:**
- 직원 변경 후 detail 캐시는 즉시 업데이트
- list 캐시는 부분 무효화 또는 필터 조건별 무효화
- 부서/직급 변경 후 관련 캐시만 무효화

---

### Decision 9: MANAGER 편집 권한 범위

**Topic:** MANAGER 편집 권한 범위 (DT-9)
**Category:** RBAC & Feature Scope
**Priority:** MEDIUM
**Phase:** Phase 1 (읽기 전용), Phase 2 (검토)

**Decision:** Option A (Phase 1) - MANAGER는 읽기 전용 유지

**Rationale:**
- **보안 우선:** 모든 수정권한은 ADMIN만 보유 (최소 권한)
- **Phase 1 초점:** 핵심 기능 구현에 집중
- **명확한 책임:** 직원 정보 변경은 HR/ADMIN의 책임
- **감사 추적:** 모든 변경을 ADMIN이 수행하므로 추적 용이

**Phase 2 검토 사항:**
- 실제 HR 운영 시 MANAGER가 필요로 하는 편집 범위 파악
- 예: 연락처, 직무, 상위 매니저만 수정 가능 여부 검토
- 계정, 부서, 직급은 ADMIN만 유지

**Implementation Impact (Phase 1):**
- MANAGER 접근 시: 수정 버튼 비활성화 (UI)
- API 접근: PUT /api/employees/[id]에 ADMIN 전용 체크 (백엔드)
- 에러 응답: 403 Forbidden

**Affected Sections:**
- Section 3 (US-6): MANAGER 읽기 전용 명시
- Section 5.5 (Auth & RBAC): PUT 엔드포인트 권한 검증
- Out-of-Scope에 Phase 2 고려사항 추가

**Acceptance Criteria:**
- MANAGER는 직원 상세 조회 가능
- 모든 편집 기능은 비활성화 또는 거부
- 수정은 ADMIN만 가능

---

### Decision 10: 직급 코드 생성의 동시성 보증 방식

**Topic:** 직급 코드 생성의 동시성 보증 방식 (DT-10)
**Category:** Database & Concurrency
**Priority:** LOW
**Phase:** Phase 1

**Decision:** Option A - Oracle SEQUENCE 사용

**Rationale:**
- **간단하고 안전:** DB 레벨에서 동시성 자동 보증
- **읽기 좋은 코드:** "POS-00001" 형식은 사용자 친화적
- **성능:** SEQUENCE.NEXTVAL 호출은 매우 빠름
- **관리 용이:** Oracle 표준 기능

**Implementation Impact:**
- Migration: SEQUENCE 생성
  ```sql
  CREATE SEQUENCE POSITION_CODE_SEQ
    START WITH 1
    INCREMENT BY 1
    NOCACHE;
  ```
- Entity 생성 시:
  ```
  INSERT INTO POSITION (name, code, level, created_at)
  VALUES (:name, 'POS-' || LPAD(POSITION_CODE_SEQ.NEXTVAL, 5, '0'), :level, SYSDATE);
  ```
- TypeORM: `@BeforeInsert()` 훅에서 코드 생성

**Affected Sections:**
- Section 4.1 (In-Scope): Position.code 생성 규칙
- Section 5.3 (Database): SEQUENCE 정의 추가

**Acceptance Criteria:**
- 직급 코드는 POS-{5digit} 형식
- SEQUENCE로 유일성 보증
- 동시성 이슈 없음

---

### Decision 11: 로그인 검증 체크리스트의 명시

**Topic:** 로그인 검증 체크리스트의 명시 (DT-11)
**Category:** Security & Authentication
**Priority:** LOW
**Phase:** Phase 1

**Decision:** Option A - 명시적 체크리스트 정의

**Rationale:**
- **보안 강화:** 모든 검증 조건을 명시하여 보안 허점 방지
- **구현 명확:** 로그인 로직을 구현할 때 혼동 없음
- **감사:** 체크리스트 문서화로 규정 준수 가능

**Implementation Impact:**
- 로그인 검증 순서 (필수):
  ```
  1. 입력: username (필수), password (필수)
  2. Account 존재 확인: SELECT * FROM ACCOUNT WHERE username = ?
     → 없으면: "계정이 없습니다" 에러
  3. Account.is_active 확인: is_active = true
     → false이면: "비활성화된 계정입니다" 에러
  4. Employee 존재 확인: SELECT * FROM EMPLOYEE WHERE id = account.employee_id
     → 없으면: "계정이 유효하지 않습니다" 에러
  5. Employee.deleted_at 확인: deleted_at IS NULL
     → null이 아니면: "퇴사한 직원의 계정입니다" 에러
  6. 암호 검증: bcrypt.compare(inputPassword, account.password)
     → 불일치이면: "암호가 일치하지 않습니다" 에러
  7. 성공: last_login_at 업데이트, 세션 생성
  ```
- 에러 메시지는 모두 동일하게 "계정 또는 암호가 일치하지 않습니다"로 통일 가능 (보안상 권장)

**Affected Sections:**
- Section 5.5 (Auth & RBAC): 로그인 검증 체크리스트 추가
- 별도 인증 PRD 참조

**Acceptance Criteria:**
- 로그인 검증 6단계 모두 구현
- 각 실패 시 적절한 메시지 또는 통일된 에러 메시지 제시
- 감사 로그에 로그인 시도 기록 (선택사항)

---

### Decision 12: 부서 계층 깊이 제한의 필요성

**Topic:** 부서 계층 깊이 제한 (DT-12)
**Category:** Performance & Data Integrity
**Priority:** LOW
**Phase:** Phase 1

**Decision:** Option A - 깊이 제한 설정 (최대 5단계)

**Rationale:**
- **성능 보장:** 부서 계층 조회 시 무한 루프 또는 느린 재귀 방지
- **UI 렌더링:** 깊이 제한으로 조직도 UI 복잡도 제어
- **조직 표준:** 일반적 조직 구조는 CEO → 부문장 → 팀장 → 과장 → 사원 (최대 5~6단계)
- **후속 유지보수:** 과도하게 깊은 구조는 운영상 복잡도 증가

**Implementation Impact:**
- Decision 4의 부서 계층 순환 참조 방지와 함께 구현
  ```
  MAX_DEPARTMENT_DEPTH = 5

  function validateCircularAndDepth(deptId, newParentId, maxDepth = 5) {
    const visited = new Set();
    let current = newParentId;
    let depth = 1;

    while (current !== null) {
      if (current === deptId) throw Error('순환 참조 감지');
      if (visited.has(current)) throw Error('순환 참조 감지');
      if (depth >= maxDepth) throw Error('최대 계층 깊이 초과 (최대 5단계)');

      visited.add(current);
      current = getParentDepartmentId(current);
      depth++;
    }
  }
  ```
- 에러 응답 (409 Conflict):
  ```json
  {
    "error": "DEPARTMENT_MAX_DEPTH_EXCEEDED",
    "message": "부서 계층이 최대 깊이(5단계)를 초과합니다."
  }
  ```

**Affected Sections:**
- Section 4.1 (In-Scope): Department 계층 깊이 제한 명시
- Section 5.3 (Database): 깊이 제한 규칙
- Section 5.2 (API): PUT /api/departments 검증 규칙

**Acceptance Criteria:**
- 부서 계층은 최대 5단계로 제한
- 깊이 초과 시 명확한 에러 메시지
- Decision 4의 순환 참조 방지와 함께 검증

---

## 결정 영향도 분석

### Database Schema Changes

**추가 필요:** 없음
- Employee 엔티티에 `is_active` 필드 추가 안 함 (Decision 2)
- 부서 계층 깊이 제한은 애플리케이션 레벨 검증 (DB 스키마 변경 없음)

**변경 필요:**
- Employee.created_by_id, updated_by_id: `ON DELETE RESTRICT` (Decision 3)
- EmployeeHistory.changed_by_id: `ON DELETE RESTRICT` (Decision 3)

### API Changes

**신규/강화:**
- DELETE /api/employees/[id]: 의존성 검증 강화 (Decision 6)
- DELETE /api/departments/[id]: 자식 부서 + 직원 검증 (Decision 7)
- PUT /api/departments/[id]: 순환 참조 + 깊이 검증 (Decision 4, 12)
- 로그인 검증: 체크리스트 명시 (Decision 11)

### RBAC Impact

**권한 검증 강화:**
- MANAGER: 정확한 부서만 조회 (Decision 1)
- MANAGER: 읽기 전용 (Decision 9)
- 모든 수정: ADMIN만 (Decision 9)

### Caching Strategy

**구현 세부사항:**
- 부분 무효화 또는 보수적 무효화 (Decision 8)

---

## 구현 로드맵

| Phase | Decisions | Priority | Complexity |
|-------|-----------|----------|------------|
| Phase 1 | DT-1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 | HIGH/MEDIUM/LOW | M-L |
| Phase 2 | DT-5 (암호 재설정 링크), DT-9 (MANAGER 편집 권한 검토) | FUTURE | M |

---

## 최종 검토 체크리스트

- [x] 모든 12개 결정 사항 정의
- [x] sunjin-erp 원칙과의 일관성 확인
- [x] Phase 1 중심 범위 준수
- [x] 구현 영향도 분석 완료
- [x] PRD v2 적용 준비 완료

---

**결정자:** Claude (prd-mediator)
**최종 검증:** Pending
**적용 대상:** 2091_직원_관리_prd_v2.md

