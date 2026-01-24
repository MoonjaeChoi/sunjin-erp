<!-- Generated: 2026-01-25 KST -->

# Discussion Topics: 프로젝트 관리 (Sales Pipeline) PRD

원본문서: 2041_프로젝트_관리_prd.md
리뷰문서: 2041_프로젝트_관리_prd_critical_review.md
반박문서: 2041_프로젝트_관리_prd_rebuttal.md
작성일: 2026-01-25

---

## DT-1: 첨부파일 설계 - 단일 vs 복수 [HIGH]

**배경:** 프로젝트는 계약서, 제안서, 견적서 등 복수 문서가 필요. 현재 PRD는 단일 파일(attachment_path/name) 설계.

**Options:**
- **A) 별도 PROJECT_ATTACHMENT 테이블 (1:N)**: 복수 파일 지원, 파일별 카테고리(계약서/제안서/기타) 분류 가능. DB 스키마 추가, 별도 CRUD API 필요.
- **B) 현재 단일 파일 유지, Phase 2에서 확장**: 초기 구현 간소화, 기술지원 모듈과 동일 패턴. 이후 마이그레이션 비용 발생.
- **C) 단일 파일 유지 (최종)**: 프로젝트당 1개 대표 파일만 관리. 추가 자료는 별도 관리.

**Rebuttal 권장:** Option A

---

## DT-2: 프로젝트 코드 생성 전략 [HIGH]

**배경:** `PJT-YYYYMMDD-NNN` 형식에서 NNN 동시성 이슈. 사용자가 명시적으로 생성 버튼을 클릭하는 방식.

**Options:**
- **A) Oracle SEQUENCE 기반 NNN 생성**: `PROJECT_CODE_SEQ`로 전역 순번 생성. 날짜별 리셋 없이 전역 증가. 형식: `PJT-YYYYMMDD-{seq}` (패딩 3자리).
- **B) 날짜별 MAX+1 with FOR UPDATE**: 해당 날짜의 최대 순번 + 1. 트랜잭션 내 row-level lock으로 동시성 보장.
- **C) 등록 시 자동 생성 (버튼 제거)**: 프로젝트 생성 트랜잭션 내에서 자동 코드 부여. 별도 generate-code API 불필요.

**Rebuttal 권장:** Option A (SEQUENCE)

---

## DT-3: 상태-체크리스트 연동 규칙 [HIGH]

**배경:** 체크리스트 전체 완료 시 상태 자동 변경 여부, COMPLETED 상태에서 체크 해제 시 동작 등 엣지케이스 미정의.

**Options:**
- **A) 완전 독립 (권장)**: 상태와 체크리스트는 독립적으로 관리. 모든 체크 완료 시 "완료로 변경하시겠습니까?" 알림만 표시 (선택적). 어떤 상태에서든 체크리스트 수정 가능.
- **B) 반자동 연동**: 모든 체크 완료 → 자동으로 COMPLETED. 하나라도 해제 → 자동으로 IN_PROGRESS 복귀.
- **C) 순방향만 자동**: 모든 체크 완료 → COMPLETED 제안(수락 시 변경). 체크 해제 시 상태 변경 없음.

**Rebuttal 권장:** Option A

---

## DT-4: MANAGER 부서 범위 판별 로직 [MEDIUM]

**배경:** MANAGER가 "부서 내" 프로젝트만 접근 가능하나, 부서 판별 기준이 불명확.

**Options:**
- **A) 담당자(employee_id) 부서 기준**: PROJECT.employee_id → EMPLOYEE.department_id = MANAGER의 department_id. JOIN 1회.
- **B) 프로젝트에 department_id 컬럼 추가**: PROJECT 테이블에 직접 department_id FK 추가. JOIN 없이 직접 비교.

**Rebuttal 권장:** Option A

---

## DT-5: Summary API 필터 적용 범위 [MEDIUM]

**배경:** 상태별 카운트 뱃지가 사용자 권한과 현재 필터를 반영해야 하는지.

**Options:**
- **A) 권한 + 필터 모두 적용**: Summary API에 동일한 권한 필터와 검색 필터(customer_id, employee_id 등) 적용. 목록과 완전 일치.
- **B) 권한만 적용, 필터 미적용**: 사용자가 볼 수 있는 전체 프로젝트의 상태별 카운트. 필터와 무관한 전체 현황 표시.
- **C) 권한 + 필터 + 별도 전체 카운트**: 필터 적용 카운트와 전체 카운트를 동시 제공.

**Rebuttal 권장:** Option A

---

## DT-6: Employee 목록 API [MEDIUM]

**배경:** 담당자 필터 Dropdown에 Employee 목록이 필요하나 API 미참조.

**Options:**
- **A) 기존 /api/employees/list 활용 (신규 생성)**: Customer 목록 API와 동일 패턴으로 `{ employees: [{ id, name }] }` 반환. 범용적.
- **B) /api/projects/employees (프로젝트 전용)**: 실제 프로젝트에 배정된 직원만 반환. 필터 정확도 높음.

**Rebuttal 권장:** Option A

---

## DT-7: 체크리스트 업데이트 API 분리 [MEDIUM]

**배경:** 체크리스트 토글은 빈번한 인터랙션이므로 전체 PUT과 분리 필요.

**Options:**
- **A) PATCH /api/projects/[id]/checklist (별도 endpoint)**: `{ stage: 'MEETING', completed: true }`. 단일 stage 원자적 업데이트. 추가 API endpoint.
- **B) PUT /api/projects/[id]에 partial update 지원**: 체크리스트 필드만 전송 시 해당 필드만 업데이트. 기존 API 활용.

**Rebuttal 권장:** Option A

---

## DT-8: 비순차적 체크 시 시각적 피드백 [LOW]

**배경:** 이전 단계 미완료인데 후속 단계를 체크하면 사용자 인지 필요.

**Options:**
- **A) 미완료 이전 단계 하이라이트**: 완료된 후속 단계가 있을 때 미완료 이전 단계를 주황색 등으로 강조.
- **B) 경고 없이 허용**: 비순차 체크를 자연스럽게 허용. 추가 UI 없음.
- **C) 비순차 체크 시 확인 Dialog**: "이전 단계가 완료되지 않았습니다. 계속하시겠습니까?" 확인.

**Rebuttal 권장:** Option A

---

## DT-9: project_code NULL 시 업무 규칙 [LOW]

**배경:** 코드 미부여 프로젝트의 식별 및 검색 방안.

**Options:**
- **A) NULL 허용 + 업무 규칙 명시**: "초기 영업 단계에서는 코드 미부여, 계약 진행 시 생성" 문서화. 목록에서 코드 없는 건은 "-"로 표시.
- **B) 등록 시 자동 코드 부여 (NOT NULL)**: 모든 프로젝트에 코드 자동 생성. 검색/정렬 일관성 보장.

**Rebuttal 권장:** Option A

---

## Priority Summary

| Priority | Topics |
|----------|--------|
| HIGH | DT-1, DT-2, DT-3 |
| MEDIUM | DT-4, DT-5, DT-6, DT-7 |
| LOW | DT-8, DT-9 |
