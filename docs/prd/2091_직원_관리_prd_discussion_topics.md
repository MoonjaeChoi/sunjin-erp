<!-- Generated: 2026-01-25 23:35:00 KST -->

# Discussion Topics: 직원 관리 (인사) PRD

원본문서: 2091_직원_관리_prd.md
리뷰문서: 2091_직원_관리_prd_critical_review.md
반박문서: 2091_직원_관리_prd_rebuttal.md
작성일: 2026-01-25

---

## DT-1: MANAGER 권한 범위 - 정확한 부서만 vs 하위 부서 포함 [HIGH]

**배경:** 부서 계층 구조(parent_department_id)가 지원되지만, MANAGER의 권한 범위가 불명확. "자신의 부서"가 정확히 일치하는 부서만을 의미하는지, 아니면 조직 계층상 하위 부서까지 포함하는지 결정 필요.

**현재 PRD 입장:** "자신의 부서 소속 직원만 조회 가능" (US-6)

**Options:**
- **A) 정확히 자신의 부서만 (권장)**: `EMPLOYEE.department_id = MANAGER.department_id`. 하위 부서는 볼 수 없음. 보안상 강화, 구현 간단.
- **B) 자신 + 모든 하위 부서 포함**: `EMPLOYEE.department_id IN (자신, 자식 부서들)`. 조직도 관점에서 자연스러우나, 하위 부서 계층 전체 조회 필요 (성능 고려).
- **C) 계층별 차등 권한**: 직급이 높을수록 더 많은 하위 부서 조회 가능 (복잡도 증가).

**Impact:**
- A: 명확한 권한 경계, 구현 간단, 다만 조직도 기능이 제한적
- B: 조직도 기능이 자연스러우나, JOIN 복잡도 증가, 캐시 전략 복잡
- C: 최대 유연성이나 구현 복잡도 높음

**Rebuttal 권장:** Option A (Phase 2에서 B 검토)

---

## DT-2: Account 비활성화 vs Employee 소프트 삭제 정책 [HIGH]

**배경:** 퇴사 직원 처리 시 여러 방식이 가능하나, 현재 두 가지 메커니즘의 관계가 불명확.

**현재 PRD 입장:**
- Account.is_active = false (계정 비활성화)
- Employee.deleted_at ≠ null (소프트 삭제)

**Options:**
- **A) 이중 메커니즘 분리 (권장)**:
  - Account.is_active = false: 로그인만 차단, 직원 정보 유지
  - Employee.deleted_at: 목록에서 제외, 과거 기록 유지
  - hard delete: 의존성 없을 때만 물리 삭제
- **B) 단일 메커니즘 (Employee.deleted_at만)**:
  - Employee soft delete 시 Account도 함께 soft delete
  - 더 간단하나, 로그인만 차단하고 정보는 보존하는 시나리오 불가능
- **C) 계정 활성/비활성 + 직원 상태 필드**:
  - 별도 EMPLOYEE.status 필드 추가 (ACTIVE/INACTIVE/DELETED)
  - 더 명확하나 스키마 복잡도 증가

**Impact:**
- A: 명확한 의도 구분, Account와 Employee 라이프사이클 독립 관리 가능
- B: 간단하지만 유연성 제한
- C: 매우 명확하나 스키마 변경 필요

**Rebuttal 권장:** Option A (명확한 문서화 필수)

---

## DT-3: 감사 추적의 생성자/변경자 보존 전략 [HIGH]

**배경:** Employee와 EmployeeHistory의 `created_by_id`, `updated_by_id`, `changed_by_id`가 모두 `ON DELETE SET NULL`로 설정되면, 생성자/변경자가 퇴사 후 삭제될 시 감사 추적이 불완전해짐.

**현재 PRD 입장:** `ON DELETE SET NULL` (FK 설정)

**Options:**
- **A) ON DELETE RESTRICT (권장)**: 생성자/변경자 삭제 불가능. 감사 추적 신뢰성 보장. 다만 생성자가 퇴사하면 그 사용자 계정을 삭제할 수 없음 (의존성).
- **B) ON DELETE SET NULL + 사용자명 스냅샷**:
  - EmployeeHistory에 created_by_name (TEXT) 추가 저장
  - 향후 생성자 삭제 시에도 이력의 이름 필드로 누가 했는지 확인 가능
  - 구현 추가 필요
- **C) 별도 AuditLog 테이블**:
  - Employee와 무관한 독립적 감사 로그 테이블
  - 사용자 삭제와 무관하게 영구 보존
  - 복잡도 증가

**Impact:**
- A: 감사 추적 신뢰성 높음, 다만 사용자 삭제 시 관계 확인 필요
- B: 감사 추적 가능하면서 사용자 삭제 유연성 제공
- C: 최고 수준의 신뢰성이나 별도 시스템 필요

**Rebuttal 권장:** Option A (또는 B와 병행)

---

## DT-4: 부서 계층 구조 순환 참조 방지 전략 [HIGH]

**배경:** 부서 계층 구조를 지원하나, 순환 참조(A → B → C → A) 방지 로직이 명시되지 않음. 조직도 조회 시 무한 루프 가능.

**현재 PRD 입장:** 불명시

**Options:**
- **A) API 레벨 검증 + 깊이 제한 (권장)**:
  - `PUT /api/departments/[id]`에서 parent_department_id 변경 시 순환 참조 검증
  - 또한 최대 깊이 제한 (예: 5단계)
  - 검증 로직: 새 부모의 조상 계층에 현재 부서가 없는지 확인
- **B) DB TRIGGER로 강제**:
  - Oracle TRIGGER on UPDATE departments
  - 구현이 더 강력하나 관리 복잡도 증가
- **C) 계층 제한 없음**:
  - 순환 참조 검증만 하고 깊이는 제한하지 않음
  - 조직도 조회 시 알고리즘으로 순환 감지 (예: DFS)

**Impact:**
- A: 명확한 한계 설정, 구현 간단, 성능 예측 가능
- B: DB 레벨 강제, 신뢰성 높음
- C: 최대 유연성이나 조직도 알고리즘 복잡

**Rebuttal 권장:** Option A (깊이 제한: 최대 5단계)

---

## DT-5: 초기 직원 계정 암호 관리 및 첫 로그인 프로세스 [MEDIUM]

**배경:** 새로운 직원 등록 후 계정 생성까지의 암호 관리 및 첫 로그인 절차가 불명확. "임시 암호"를 어떻게 직원에게 전달하고, 첫 로그인 시 암호 변경을 강제할지 결정 필요.

**현재 PRD 입장:**
- US-4: "임시 암호 설정 가능"
- 5.6: "첫 로그인 시 변경 강제" (Phase 2)

**Options:**
- **A) 관리자 수동 설정 + 별도 채널 전달 (권장, Phase 1)**:
  - 관리자가 임시 암호 입력
  - UI에 임시 암호 일회 표시 (복사 가능)
  - 관리자가 전화, 이메일, 직접 전달 등으로 직원에게 전달
  - Phase 2에서 첫 로그인 시 강제 변경
- **B) 자동 임시 암호 생성**:
  - 시스템이 무작위 문자 생성 (예: 12자 영문숫자특수문자)
  - UI에 표시 또는 이메일 발송
  - 더 간편하나 이메일 기능 필요
- **C) 암호 재설정 링크 발급**:
  - 계정 생성 후 일회용 재설정 링크 발급
  - 직원이 링크 클릭하여 자신의 암호 설정
  - 가장 보안상 우수하나 이메일 시스템 필요

**Impact:**
- A: 간단하고 보안상 안전, 관리자 책임 명확
- B: 더 자동화되나 이메일 시스템 필요
- C: 가장 보안상 우수나 구현 복잡도 높음

**Rebuttal 권장:** Option A (Phase 1), Option C (Phase 2 검토)

---

## DT-6: Hard Delete 의존성 검증의 자동화 수준 [MEDIUM]

**배경:** 직원 hard delete 시 Project, TechSupport, Task 등 여러 테이블에서 참조 가능. 의존성 검증 범위와 자동화 수준을 결정 필요.

**현재 PRD 입장:** "관련 프로젝트/기술지원 기록이 있으면 경고" (US-10)

**Options:**
- **A) 전체 FK 참조 검증 + 명확한 에러 (권장)**:
  - hard delete 시 모든 FK 참조 테이블 검사
  - 참조가 있으면 상세 에러 메시지: "이 직원은 5개 프로젝트에서 담당자입니다. 먼저 [...]"
  - API 응답: 참조 정보 상세 반환
- **B) 주요 참조만 검증 (간단)**:
  - Project, TechSupport만 검사
  - Task, Issue 등은 무시
  - 빠르지만 불완전
- **C) Cascade Delete (위험)**:
  - 직원 삭제 시 관련 Project/TechSupport도 함께 삭제
  - 매우 위험 (데이터 손실)
- **D) 비동기 삭제 + 관리 UI**:
  - hard delete를 비동기 작업으로 처리
  - 의존성 수정 후 재시도 가능
  - 더 복잡하나 사용자 경험 개선

**Impact:**
- A: 명확한 삭제 경로 제시, 데이터 무결성 보장
- B: 빠르지만 불안전
- C: 위험, 권장하지 않음
- D: 유연성 높으나 구현 복잡

**Rebuttal 권장:** Option A

---

## DT-7: 부서 삭제 시 자식 부서 처리 전략 [MEDIUM]

**배경:** 부서 삭제 조건에 "소속 직원 없음"은 명시되나, 자식 부서가 있는 경우 처리 방안이 없음.

**현재 PRD 입장:** 불명시

**Options:**
- **A) 엄격한 삭제 조건 (권장)**:
  - 삭제 가능 조건: (1) 소속 직원 없음 AND (2) 자식 부서 없음
  - 두 조건 모두 만족할 때만 삭제 가능
  - 명확하나 부서 삭제가 어려울 수 있음
- **B) 자동 Reparent**:
  - 부서 삭제 시 자식 부서를 삭제 대상 부서의 부모로 이동
  - 더 유연하나 사용자가 의도하지 않은 결과 가능
- **C) Cascade Delete**:
  - 부서 삭제 시 자식 부서도 함께 삭제
  - 위험 (계층 붕괴)
- **D) 논리적 삭제만 (soft delete)**:
  - 부서를 soft delete만 수행, hard delete는 나중에
  - 간단하나 고아 부서 발생 가능

**Impact:**
- A: 명확한 경계, 데이터 무결성 보장
- B: 유연성 높으나 예상치 못한 결과
- C: 위험
- D: 간단하지만 불완전

**Rebuttal 권장:** Option A

---

## DT-8: 캐시 무효화 전략의 세분화 수준 [MEDIUM]

**배경:** 직원/부서/직급 변경 시 TanStack Query 캐시를 무효화해야 하는데, 전체 무효화 vs 부분 무효화의 균형이 필요.

**현재 PRD 입장:** 캐시 무효화 전략 명시되나 세부 시나리오 불완전

**Options:**
- **A) 세분화된 부분 무효화 (권장, Phase 1)**:
  - 부서 변경 시: 해당 부서 캐시만 무효화
  - 직원 변경 시: 해당 직원 상세만 무효화
  - 목록 캐시는 필터 조건별로 부분 무효화
  - 구현 복잡하나 성능 최적
- **B) 전체 무효화 (간단)**:
  - 어떤 변경이 있으면 employees-list, departments, positions 모두 무효화
  - 간단하고 안전하나 불필요한 재요청 증가
- **C) 스마트 무효화 (고급)**:
  - queryKey 패턴 기반 자동 무효화 (예: `employees-list?dept=123`)
  - TanStack Query의 invalidateQueries 활용
  - 가장 효율적이나 구현 신중함 필요

**Impact:**
- A: 밸런스 있는 성능, 구현 중간 수준
- B: 간단하고 안전, 약간의 성능 저하
- C: 최고 성능이나 신중한 구현 필요

**Rebuttal 권장:** Option A (또는 C)

---

## DT-9: MANAGER 권한 수정 범위 확대 여부 [MEDIUM]

**배경:** 현재 MANAGER는 읽기 전용이나, 실제 HR 운영 시 자신의 부서 직원 기본 정보(연락처, 직무)를 수정해야 할 필요 있을 수 있음.

**현재 PRD 입장:** MANAGER는 읽기 전용 (US-6)

**Options:**
- **A) 현재 유지 (권장, Phase 1)**:
  - MANAGER는 읽기 전용
  - 모든 수정은 ADMIN만 가능
  - 보안상 강화, 구현 간단
- **B) 부분 수정 권한 확대 (Phase 2 검토)**:
  - MANAGER는 자신의 부서 직원의 연락처, 직무, 상위 매니저만 수정 가능
  - 계정, 부서, 직급은 ADMIN만
  - 더 현실적이나 권한 세분화 필요
- **C) 완전 수정 권한 (위험)**:
  - MANAGER가 자신의 부서 직원의 모든 정보 수정 가능
  - 보안상 위험 (계정 정보 조작)

**Impact:**
- A: 명확하고 보안상 강화
- B: 현실적 업무 효율성, 권한 세분화 필요
- C: 위험, 권장하지 않음

**Rebuttal 권장:** Option A (Phase 2에서 Option B 검토)

---

## DT-10: 직급 코드 생성의 동시성 보증 방식 [LOW]

**배경:** 직급 자동 코드 생성 시 동시성 이슈. 생성 방식을 결정 필요.

**현재 PRD 입장:** 불명시

**Options:**
- **A) Oracle SEQUENCE (권장)**:
  - `POSITION_CODE_SEQ` 생성
  - `POS-{SEQ.NEXTVAL:05D}` 형식
  - 간단하고 안전한 동시성 보증
- **B) MAX + 1 with FOR UPDATE**:
  - SELECT MAX(code) ... FOR UPDATE로 row-level lock
  - 날짜별로 리셋하고 싶을 때 사용 가능
  - 더 복잡하나 유연함
- **C) UUID 기반**:
  - 고유 코드를 UUID로 생성
  - 순번 필요 없음, 그러나 가독성 낮음

**Impact:**
- A: 간단, 안전, 읽기 좋은 코드
- B: 유연하나 구현 복잡
- C: 가장 간단하나 비즈니스 요구 불부합

**Rebuttal 권장:** Option A

---

## DT-11: 로그인 검증 체크리스트의 명시 수준 [LOW]

**배경:** 로그인 시 확인해야 할 조건이 여러 개이나 문서에 명시되지 않음. 구현 시 혼동 방지 필요.

**현재 PRD 입장:** 불명시

**Options:**
- **A) 명시적 체크리스트 (권장)**:
  - NextAuth.js 로직 또는 별도 인증 PRD 참조
  - 검증 순서: Account 존재 → is_active = true → Employee.deleted_at IS NULL → 암호 일치
  - 각 실패 시 구체적 에러 메시지
- **B) 간단한 기준**:
  - Account 존재 + 암호 일치만 확인
  - Employee deleted_at는 무시
  - 간단하나 불완전
- **C) 엄격한 기준**:
  - 위 4가지 + 추가 조건 (예: 직급 있음, 부서 있음)
  - 더 안전하나 과도할 수 있음

**Impact:**
- A: 명확하고 완전, 로그인 보안 강화
- B: 간단하나 보안상 약함
- C: 가장 안전하나 과도할 수 있음

**Rebuttal 권장:** Option A

---

## DT-12: 부서 계층 깊이 제한의 필요성 [LOW]

**배경:** 부서 계층 구조를 무제한으로 허용할 때 성능과 UI 렌더링 영향 가능.

**현재 PRD 입장:** "무제한" (Open Question 1)

**Options:**
- **A) 깊이 제한 설정 (권천, 최대 5단계)**:
  - 부모 부서 업데이트 시 깊이 검증
  - 초과하면 "최대 계층 깊이 초과" 에러
  - 일반적 조직 구조에 충분
- **B) 무제한 (현재)**:
  - 순환 참조만 방지
  - 최대 유연성
  - 성능/UI 고려 필요
- **C) 동적 제한**:
  - 조직 크기에 따라 제한 조정
  - 복잡도 증가

**Impact:**
- A: 명확한 한계, 성능 예측 가능
- B: 최대 유연성이나 성능 모니터링 필요
- C: 적응형이나 관리 복잡

**Rebuttal 권장:** Option A (깊이 제한: 최대 5)

---

## Priority Summary

| Priority | Topics |
|----------|--------|
| HIGH | DT-1, DT-2, DT-3, DT-4 |
| MEDIUM | DT-5, DT-6, DT-7, DT-8, DT-9 |
| LOW | DT-10, DT-11, DT-12 |
