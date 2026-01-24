<!-- Generated: 2026-01-25 KST -->

# Critical Review: 프로젝트 관리 (Sales Pipeline) PRD

원본문서: 2041_프로젝트_관리_prd.md
리뷰일: 2026-01-25

## Review Summary

전반적으로 잘 구성된 PRD이나, 데이터 모델 설계, 동시성 처리, 첨부파일 제한, 상태-체크리스트 연동 규칙에서 보완이 필요한 부분이 식별됨.

---

## Critical Points

### CP-1: 첨부파일 단일 제한 [HIGH]

**문제:** PROJECT 테이블에 `attachment_path`, `attachment_name` 단일 컬럼만 존재. 프로젝트는 계약서, 제안서, 견적서, 완료보고서 등 복수의 문서가 필요한 특성이 있음.

**영향:** 실제 업무에서 프로젝트당 1개 파일만 관리 가능하면 사용자가 외부 저장소를 병행 사용하게 되어 시스템 활용도 저하.

**제안:**
- Option A: 별도 PROJECT_ATTACHMENT 테이블로 1:N 관계 설계
- Option B: 현재 단일 파일 유지하되, Phase 2에서 복수 파일 지원 추가 명시

---

### CP-2: 프로젝트 코드 생성 동시성 이슈 [HIGH]

**문제:** `POST /api/projects/generate-code`에서 `PJT-YYYYMMDD-NNN` 형식의 코드 생성 시, 동일 날짜에 복수 사용자가 동시에 요청하면 중복 NNN 값이 발생할 수 있음.

**영향:** 프로젝트 코드 중복으로 UNIQUE constraint 위반 에러 발생 가능.

**제안:**
- Oracle SEQUENCE 또는 `SELECT MAX + 1 ... FOR UPDATE` 방식으로 원자적 순번 생성
- 또는 코드 생성을 프로젝트 등록 트랜잭션 내에서 처리

---

### CP-3: 상태와 체크리스트 연동 규칙 불명확 [HIGH]

**문제:**
- US-4: "모든 단계 완료 시 COMPLETED로 변경할지 확인 Dialog 표시"
- 그러나 역방향 규칙 미정의: COMPLETED 상태에서 체크리스트 항목을 해제하면 상태는 어떻게 되는가?
- IN_PROGRESS에서 모든 체크 완료 후 Dialog를 거절하면 상태는 유지되는가?
- PREPARING 상태에서 체크리스트를 체크할 수 있는가?

**영향:** 구현 시 엣지케이스 처리 로직 불확실.

**제안:** 상태-체크리스트 연동 규칙을 명시적으로 정의:
- 체크리스트 변경은 상태와 독립 (상태 변경은 항상 사용자 명시적 액션)
- "모든 단계 완료 시" 자동 상태 변경 제안은 선택적 편의 기능으로 한정

---

### CP-4: MANAGER 권한의 "부서 내" 판별 기준 [MEDIUM]

**문제:** Authorization 테이블에서 MANAGER는 "부서 내" 프로젝트만 접근 가능하다고 명시. 그러나 프로젝트의 "부서"는 어떻게 결정되는가? PROJECT 테이블에 department 컬럼이 없고, employee_id(담당자)의 부서를 기준으로 하는 것인지 불명확.

**영향:** 부서 기반 필터링 쿼리 구현 시 JOIN 전략 불확실.

**제안:** "MANAGER는 employee_id의 department_id가 본인 부서와 일치하는 프로젝트를 조회/관리할 수 있다"로 명시.

---

### CP-5: 계약 금액 접근 권한 [MEDIUM]

**문제:** contract_amount(계약 금액)는 민감한 재무 정보. 현재 PRD에서는 컬럼 레벨 접근 제어가 정의되지 않음.

**영향:** 일반 USER가 모든 프로젝트의 계약 금액을 볼 수 있으면 보안 이슈.

**제안:**
- Option A: USER는 본인 담당 건의 금액만 조회 가능 (현재 조회 범위와 동일하므로 문제 없음)
- Option B: 금액 필드는 ADMIN/MANAGER만 조회 가능
- 현재 구조(USER=본인 건만 조회)에서는 문제없으나, 명시적 언급 필요

---

### CP-6: Summary API의 필터 범위 [MEDIUM]

**문제:** `GET /api/projects/summary`에서 상태별 카운트를 반환하는데, 이 카운트가 현재 사용자의 조회 권한을 반영하는지 불명확. ADMIN은 전체, USER는 본인 건만의 카운트여야 하는지?

**영향:** UI 상단의 카운트 뱃지가 실제 목록과 불일치할 수 있음.

**제안:** Summary API도 동일한 권한 필터를 적용하여 사용자에게 보이는 프로젝트만 집계. 필터 조건(customer_id, status 등)도 summary에 적용할지 결정 필요.

---

### CP-7: 담당자 필터의 Employee 목록 API [MEDIUM]

**문제:** 필터에 "담당자 필터"가 있으나, Employee 목록을 제공하는 API가 참조되지 않음. 현재 시스템에 Employee 목록 API가 존재하는지, 어떤 endpoint를 사용할지 미정의.

**영향:** 구현 시 추가 API 개발 필요 여부 판단 불가.

**제안:** Customer 목록과 유사하게 `GET /api/employees/list` 또는 기존 API 참조 명시.

---

### CP-8: 체크리스트 비순차적 체크의 비즈니스 타당성 [LOW]

**문제:** US-4에서 "순서에 관계없이 체크 가능 (비순차적 체크 허용)"으로 명시. 이는 "회의" 없이 "인수인계"를 완료 체크할 수 있다는 의미.

**영향:** Sales Pipeline의 논리적 순서를 무시할 수 있어 데이터 무결성 관점에서 의문.

**제안:** 비순차적 허용 근거를 명시하거나, 최소한 경고 메시지(이전 단계 미완료) 표시를 고려.

---

### CP-9: project_code NULL 허용과 UNIQUE 조합 [LOW]

**문제:** project_code가 NULL 허용(선택 입력)이면서 UNIQUE index가 있음. Oracle에서 NULL은 UNIQUE 제약에 포함되지 않으므로 기술적으로 문제없으나, 설계 의도가 모호.

**영향:** 코드 없는 프로젝트가 다수 존재할 수 있어 검색/식별성 저하.

**제안:**
- 코드 미입력 시에도 자동으로 코드를 생성하여 NOT NULL 유지
- 또는 코드 미입력 허용 이유를 명시 (예: 초기 영업 단계에서는 코드 불필요)

---

### CP-10: 수정 API의 체크리스트 업데이트 방식 [LOW]

**문제:** `PUT /api/projects/[id]`가 기본 정보와 체크리스트를 모두 처리. 체크리스트 토글(단일 stage 변경)에도 전체 프로젝트 데이터를 PUT 해야 하는지, partial update가 가능한지 불명확.

**영향:** 체크리스트 토글 시 불필요한 데이터 전송 및 동시 수정 충돌 가능.

**제안:** 체크리스트 전용 endpoint 추가 고려: `PATCH /api/projects/[id]/checklist`
- Body: `{ stage: 'MEETING', completed: true }`
- 단일 stage만 원자적으로 업데이트

---

## Priority Summary

| Priority | Count | Items |
|----------|-------|-------|
| HIGH | 3 | CP-1, CP-2, CP-3 |
| MEDIUM | 4 | CP-4, CP-5, CP-6, CP-7 |
| LOW | 3 | CP-8, CP-9, CP-10 |
