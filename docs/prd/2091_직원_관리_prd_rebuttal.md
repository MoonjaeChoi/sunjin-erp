<!-- Generated: 2026-01-25 23:35:00 KST -->

# Rebuttal: 직원 관리 (인사) PRD

원본문서: 2091_직원_관리_prd.md
리뷰문서: 2091_직원_관리_prd_critical_review.md
작성일: 2026-01-25

---

## CP-1: MANAGER 권한 필터링의 세부 규칙 불명확 [HIGH]

**비평 타당성: 인정**

부서 계층 구조에서 MANAGER의 범위를 명확히 할 필요가 있음. 현재 "자신의 부서"만 명시되어 하위 부서 포함 여부가 모호함.

**반박:**
- 현재 직원 관리 시스템은 MANAGER가 제한된 권한을 가지므로, 부서 계층과 무관하게 정확히 자신의 부서(department_id 일치)만 조회하는 것이 안전
- 조직 계층도 기능은 Phase 2로 예정되어 있으므로, 지금은 단순 설계가 적절

**결론:** "MANAGER는 자신의 부서(department_id가 일치)에만 접근 가능하며, 하위 부서는 별도 권한이 필요함"으로 명시. 부서 계층 조회는 Phase 2에서 검토.

---

## CP-2: Account vs Employee 삭제/비활성화 의미 충돌 [HIGH]

**비평 타당성: 인정**

용어 정의가 혼재되어 있음. "비활성화"가 Account 레벨인지 Employee 레벨인지, soft delete와 hard delete의 관계가 불명확.

**반박:**
- 현재 설계는 `Account.is_active` (계정 비활성화)와 `Employee.deleted_at` (직원 소프트 삭제)를 구분하고 있음
- 그러나 문서에서 명시되지 않아 혼동이 발생

**결론:** 다음과 같이 명시:
1. **계정 비활성화 (Account.is_active = false):** 로그인 차단, 직원 정보는 유지. US-8 기준.
2. **직원 소프트 삭제 (Employee.deleted_at ≠ null):** 목록에서 제외되나 데이터 유지. hard delete 전 단계.
3. **직원 하드 삭제 (물리적 삭제):** Account도 함께 삭제. US-10 기준. 의존성 확인 필수.
4. **Account는 Employee당 1개 (UNIQUE):** 한 직원은 한 계정만 가짐.

---

## CP-3: created_by_id vs updated_by_id의 NULL 처리 규칙 [HIGH]

**비평 타당성: 인정**

감사 추적 목적상 생성자/변경자가 삭제되면 NULL이 되는 것은 컴플라이언스 문제. 타당한 지적.

**반박:**
- 초기 시스템 관리자가 퇴사하기까지의 기간이 충분하므로, 실제 발생 가능성은 낮음
- 그러나 감사 추적의 신뢰성을 위해 ON DELETE RESTRICT가 더 적절함

**결론:** `created_by_id`, `updated_by_id`를 `ON DELETE RESTRICT`로 변경.
- 생성자/변경자 계정은 삭제 불가 (의존 관계가 있을 때)
- 또는 대체 방안: EmployeeHistory에 사용자명(text, snapshot) 추가 저장하여 나중 삭제와 무관하게 누가 변경했는지 기록 유지

---

## CP-4: 부서 계층 구조의 orphan 방지 전략 [MEDIUM]

**비평 타당성: 인정**

순환 참조 방지가 없으면 조직도 조회 시 무한 루프 가능. 반드시 구현 필요.

**반박:** 없음. 타당한 지적.

**결론:**
- `PUT /api/departments/[id]`에서 parent_department_id 변경 시, 순환 참조 검증 로직 필수
- 검증: "새 부모 부서의 상위 계층에 현재 부서가 없는지 확인"
- 또는 DB TRIGGER로 구현
- 부서 계층 깊이 제한 검토 (권장: 최대 5단계)

---

## CP-5: 암호 정책과 초기 암호 관리 [MEDIUM]

**비평 타당성: 인정**

임시 암호 생성 및 전달 방식이 불명확. 보안과 UX의 균형이 필요.

**반박:**
- 임시 암호는 관리자가 명시적으로 설정하는 것이 보안상 안전 (자동 생성보다 제어 가능)
- "첫 로그인 시 변경 강제"는 Phase 2로 미루고, Phase 1에서는 관리자가 직원에게 별도 전달

**결론:**
- US-4 추가 명시: "계정 생성 시 관리자는 임시 암호를 설정하고, 보안상 별도 채널(전화, 직접 전달)로 직원에게 전달"
- 첫 로그인 시 암호 변경 강제는 Phase 2
- 암호 유효 기간(expiry)은 현재 미정의 (필요 시 추후 추가)

---

## CP-6: MANAGER가 자신의 부서 직원에 대한 수정 권한 부재 [MEDIUM]

**비평 타당성: 부분 인정**

실제 HR 업무에서 MANAGER가 기본 정보를 수정해야 할 필요가 있을 수 있음. 다만 현재는 보안상 제한하는 것도 합리적.

**반박:**
- Phase 1의 범위 제한으로 MANAGER는 읽기 전용으로 설계
- 필요 시 Phase 2에서 MANAGER의 수정 권한 확대 검토 (예: 연락처, 직무만 수정 가능)

**결론:** 현재는 US-6의 "읽기 전용" 유지. Phase 2에서 요구사항 검토 후 권한 확대 검토.

---

## CP-7: Hard Delete 의존성 검증의 범위 [MEDIUM]

**비평 타당성: 인정**

hard delete 시 모든 관련 테이블을 검사해야 하는데, 범위가 불명확. 명시 필요.

**반박:** 없음. 타당한 지적.

**결론:** US-10 명시:
- "직원 완전 삭제 시 다음 테이블의 FK 참조를 확인:"
  - PROJECT.employee_id (담당자)
  - PROJECT.created_by_id
  - PROJECT.updated_by_id
  - TECHSUPPORT.employee_id (담당자)
  - TECHSUPPORT.created_by_id
  - TECHSUPPORT.updated_by_id
  - TASK.assigned_to (또는 참조 테이블 추가)
  - ACCOUNT.changed_by_id (EmployeeHistory)
  - EMPLOYEE.manager_id
  - EMPLOYEE.created_by_id
  - EMPLOYEE.updated_by_id
- 위 중 하나라도 참조가 있으면 "삭제 불가 경고" 표시
- 관계자에게 업무 인수인계 후 삭제 진행

---

## CP-8: 부서 삭제 시 조직 고아화 문제 [MEDIUM]

**비평 타당성: 인정**

자식 부서가 있는 부서를 삭제하면 고아 부서 발생. 검증 필요.

**반박:** 없음.

**결론:** US-1 명시:
- "부서 삭제 조건: (1) 소속 직원이 없고, (2) 자식 부서가 없어야 함"
- 또는 "자식 부서를 reparent하고 삭제" 옵션 제공 (복잡도 증가)
- 현재는 조건 (1) + (2) 모두 충족하지 않으면 "삭제 불가" 경고

---

## CP-9: 캐시 무효화 전략의 구체성 부족 [MEDIUM]

**비평 타당성: 인정**

캐시 무효화 시나리오가 모호. 구체적 규칙 필요.

**반박:** 없음.

**결론:** 섹션 5.4 캐시 무효화 전략 상세화:

**직원(Employee) 변경 시:**
- 캐시 무효화: `employees-list`, `employees-detail-{id}`, `departments`(직원 수 표시), `positions`(직원 수 표시)
- 부서 변경: `employees-list?department_id={oldDeptId}`, `employees-list?department_id={newDeptId}`

**부서(Department) 변경 시:**
- 캐시 무효화: `departments`, `employees-list`(필터링)

**직급(Position) 변경 시:**
- 캐시 무효화: `positions`, `employees-list`(필터링)

**계정(Account) 변경 시:**
- Account 캐시는 별도 관리 (role 변경, 비활성화 등)

---

## CP-10: 직급 코드의 자동 생성 시점과 보증 [LOW]

**비평 타당성: 인정**

동시성 이슈는 이론적으로 존재. SEQUENCE 사용이 간단한 해결책.

**반박:**
- 직급 생성 빈도가 매우 낮으므로 (조직 초기화 시점), 실제 동시성 문제 가능성은 극히 낮음
- 그러나 SEQUENCE 사용이 간단하므로 적용 권장

**결론:** `POST /api/positions` 시:
1. 직급명 유효성 검증
2. Oracle SEQUENCE(`POSITION_CODE_SEQ`) 호출하여 code 자동 생성: `POS-{SEQ.NEXTVAL:05D}`
3. INSERT 트랜잭션 내 원자적 처리

---

## CP-11: 로그인 검증 시 Account.is_active 외 다른 조건 [LOW]

**비평 타당성: 인정**

로그인 검증 조건이 명시되지 않아 구현 시 혼동 가능.

**반박:** 없음.

**결론:** NextAuth.js 로그인 로직(별도 PRD 2001 참조)에 다음 검증 추가:
1. Account 존재 여부
2. `Account.is_active = true` 확인
3. `Employee.deleted_at IS NULL` 확인 (소프트 삭제 직원은 로그인 불가)
4. 암호 일치 (bcrypt.compare())

---

## Rebuttal Summary

| CP | 타당성 | 결론 |
|----|--------|------|
| CP-1 | 인정 | "정확히 자신의 부서만" 명시, 하위 부서는 Phase 2 |
| CP-2 | 인정 | Account.is_active vs Employee.deleted_at 용어 정의 명확화 |
| CP-3 | 인정 | created_by_id를 ON DELETE RESTRICT로 변경 |
| CP-4 | 인정 | 부서 업데이트 시 순환 참조 검증 로직 추가 |
| CP-5 | 인정 | 임시 암호 전달 방식 명시, Phase 2에서 강제 변경 |
| CP-6 | 부분 인정 | 현재는 읽기 전용 유지, Phase 2에서 검토 |
| CP-7 | 인정 | hard delete 의존성 검증 범위 명시 |
| CP-8 | 인정 | 부서 삭제 조건: 소속 직원 없음 AND 자식 부서 없음 |
| CP-9 | 인정 | 캐시 무효화 시나리오 상세 규칙 정의 |
| CP-10 | 인정 | SEQUENCE 사용으로 동시성 안전 보증 |
| CP-11 | 인정 | 로그인 검증 체크리스트 명시 |
