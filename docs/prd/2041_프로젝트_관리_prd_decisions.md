<!-- Generated: 2026-01-25 KST -->

# Decisions: 프로젝트 관리 (Sales Pipeline) PRD

원본문서: 2041_프로젝트_관리_prd.md
토픽문서: 2041_프로젝트_관리_prd_discussion_topics.md
작성일: 2026-01-25
결정방식: AI-Assisted

---

## Decision Summary

| Topic | Priority | Decision | Option |
|-------|----------|----------|--------|
| DT-1 | HIGH | 별도 PROJECT_ATTACHMENT 테이블 (1:N) | A |
| DT-2 | HIGH | Oracle SEQUENCE 기반 코드 생성 | A |
| DT-3 | HIGH | 상태-체크리스트 완전 독립 관리 | A |
| DT-4 | MEDIUM | 담당자 employee_id → department 기준 | A |
| DT-5 | MEDIUM | Summary API에 권한+필터 모두 적용 | A |
| DT-6 | MEDIUM | /api/employees/list 신규 생성 | A |
| DT-7 | MEDIUM | PATCH /checklist 별도 endpoint | A |
| DT-8 | LOW | 미완료 이전 단계 하이라이트 | A |
| DT-9 | LOW | project_code NULL 허용 유지 | A |

---

## Decision Details

### DT-1: 별도 PROJECT_ATTACHMENT 테이블 (1:N)

**결정:** Option A 채택

**근거:**
- 프로젝트 특성상 계약서, 제안서, 견적서, 보고서 등 복수 문서 관리 필수
- 초기 스키마를 올바르게 설계하면 이후 마이그레이션 비용 불필요
- 파일별 카테고리(contract/proposal/quotation/report/other) 분류 가능

**PRD 변경사항:**
- PROJECT 테이블에서 attachment_path, attachment_name 컬럼 제거
- PROJECT_ATTACHMENT 테이블 신규 추가
- 첨부파일 API 수정: 복수 파일 CRUD 지원

---

### DT-2: Oracle SEQUENCE 기반 코드 생성

**결정:** Option A 채택

**근거:**
- Oracle SEQUENCE는 동시성 안전하고 구현 간단
- 전역 증가 순번이므로 날짜별 리셋 불필요
- generate-code API에서 SEQUENCE.NEXTVAL 호출 후 포맷팅

**PRD 변경사항:**
- `PROJECT_CODE_SEQ` SEQUENCE 추가
- generate-code API 로직 명시

---

### DT-3: 상태-체크리스트 완전 독립 관리

**결정:** Option A 채택

**근거:**
- 업무 유연성 최대화 (상태는 비즈니스 판단, 체크리스트는 진행 추적)
- 자동 연동 시 예기치 않은 상태 변경으로 혼란 가능
- "모든 체크 완료 시 알림"은 편의 기능으로 충분

**PRD 변경사항:**
- 연동 규칙 4가지 명시:
  1. 체크리스트 변경은 상태에 자동 영향 없음
  2. 모든 체크 완료 시 완료 변경 알림(toast) 표시 (선택적)
  3. COMPLETED 상태에서도 체크리스트 수정 가능
  4. 어떤 상태에서든 체크리스트 체크/해제 가능

---

### DT-4: 담당자 employee_id → department 기준

**결정:** Option A 채택

**근거:**
- 별도 컬럼 추가 없이 기존 관계(PROJECT → EMPLOYEE → DEPARTMENT)로 해결
- MANAGER 쿼리: `WHERE employee.department_id = :managerDeptId`

---

### DT-5: Summary API에 권한+필터 모두 적용

**결정:** Option A 채택

**근거:**
- UI 상단 카운트와 목록 데이터의 일관성 보장
- 사용자가 필터를 적용하면 카운트도 해당 필터 범위 내에서 집계

**PRD 변경사항:**
- Summary API에 권한 필터 + 검색 필터(customer_id, employee_id) 모두 적용 명시

---

### DT-6: /api/employees/list 신규 생성

**결정:** Option A 채택

**근거:**
- Customer 목록 API(`/api/customers/list`)와 동일 패턴
- 다른 모듈에서도 재사용 가능 (범용)
- Response: `{ employees: [{ id, name, department_name }] }`

---

### DT-7: PATCH /checklist 별도 endpoint

**결정:** Option A 채택

**근거:**
- 체크리스트 토글은 빈번한 인터랙션으로 경량 API 필요
- 기본 정보 수정과 분리하여 동시 수정 충돌 방지
- Optimistic update에 적합

**PRD 변경사항:**
- `PATCH /api/projects/[id]/checklist` endpoint 추가
- Body: `{ stage: string, completed: boolean }`

---

### DT-8: 미완료 이전 단계 하이라이트

**결정:** Option A 채택

**근거:**
- 비순차 체크를 허용하되, 누락 단계를 시각적으로 인지시킴
- 강제 차단보다 유연하면서 데이터 품질 유지

**PRD 변경사항:**
- 체크리스트 UI: 완료된 후속 단계가 있을 때 미완료 이전 단계를 주황색 하이라이트

---

### DT-9: project_code NULL 허용 유지

**결정:** Option A 채택

**근거:**
- 초기 영업 상담 단계에서 공식 코드 불필요
- 계약 진행 시 명시적 코드 생성이 업무 프로세스에 자연스러움

**PRD 변경사항:**
- "초기 영업 단계에서는 코드 미부여, 계약 진행 시 생성" 업무 규칙 명시
- 목록에서 코드 미부여 건은 "-"로 표시
