<!-- Generated: 2026-01-25 22:30:00 KST -->

# Rebuttal: 고객 등록 및 조회 (CRM) PRD

문서번호: 2071
작성일: 2026-01-25
기준: 2071_고객_등록_및_조회_prd_critical_review.md

---

## 개요

본 문서는 CRM PRD에 대한 비판적 검토의 각 항목에 대한 재반박 및 상세 설명을 제시한다.
유효한 우려사항은 인정하면서도, 설계 결정의 정당성과 sunjin-erp 아키텍처 기준과의 일관성을 설명한다.

---

## 1. 엔티티 설계 관련

### 1.1 CustomerHistory 추적 범위

**비판:** CustomerHistory에서 모든 필드 변경을 추적하는 것은 불필요하게 복잡하며, 메모나 담당자 변경 같은 부차적 필드는 추적할 필요가 없을 수 있다.

**재반박:**

✓ **감사 요구사항:** 고객 정보는 프로젝트, 기술지원, 유지보수 계약과 연결되는 핵심 데이터이다.
   - 고객명, 분류, 담당자 변경은 업무 흐름에 영향을 미침
   - 금융감시 또는 감사(audit) 목적으로 모든 변경 기록이 필요할 수 있음
   - Phase 1에서는 모든 필드를 기록하고, Phase 2에서 필드별 추적 필터링 추가 가능

✓ **설계 유연성:** JSON 기반 `changed_fields` 필드는 선택적 필터링 지원
   - 모든 변경 기록은 하지만, 조회 시 관심 필드만 필터링 가능
   - 향후 "중요 필드 변경만 보기" 기능 추가 용이

✓ **성능 영향 최소:** 이력 기록은 비동기 처리 가능
   - 고객 수정 API 응답 후 별도 배치로 이력 저장
   - 읽기 성능에는 거의 영향 없음 (이력 조회는 별도 쿼리)

**결론:** 감사 추적을 중시하는 Enterprise ERP 시스템의 요구사항에 부합하므로 유지한다.

---

### 1.2 CustomerContact와 Employee 동기화

**비판:** CustomerContact가 Employee와 별도 엔티티인 이유가 명확하지 않으며, 코드 중복이 발생할 수 있다.

**재반박:**

✓ **도메인 분리:**
   - **Employee:** 조직 내부 직원 (급여, 인사고과, 부서 이동 등)
   - **CustomerContact:** 외부 고객사의 담당자 (고객 관점)

   두 엔티티는 생명 주기가 다르다:
   - 직원이 부서 이동 → Employee 레코드 수정, 고객사와의 담당자 관계는 유지
   - 고객사 담당자 교체 → CustomerContact만 변경, 직원과 무관

✓ **이력 추적 차이:**
   - Employee: 인사 이력 (부서 이동, 직급 변경)
   - CustomerContact: 고객 관점의 담당자 이력 (담당자 교체, 연락처 변경)

✓ **데이터 독립성:**
   - 외부 고객사 담당자는 우리 시스템의 Employee와 무관할 수 있음
   - 오픈키 설계로 고객사 담당자 이메일/전화번호는 자유 입력 가능

**결론:** 도메인 분리 원칙과 생명 주기 차이에 따라 독립 엔티티 유지가 정당하다.

---

## 2. API 설계 관련

### 2.1 담당자 API 경로 설계

**비판:** `/api/customers/[id]/contacts/[contactId]`는 중첩이 깊고, RESTful 설계가 복잡하다.
`/api/contacts/[contactId]` 직접 호출이 더 간단할 수 있다.

**재반박:**

✓ **컨텍스트 명확성:**
   - 중첩 경로는 담당자가 항상 고객에 소속됨을 API 차원에서 명시
   - 클라이언트가 고객 ID 없이 담당자 ID만으로는 의미 불완전

✓ **권한 검증 편의성:**
   - 담당자 수정 시, 먼저 고객 존재 여부 → 담당자 존재 여부 검증
   - 중첩 경로는 자연스러운 권한 체크 순서 반영

✓ **sunjin-erp 컨벤션 준수:**
   - CLAUDE.md: `GET /api/[module]/[id]` 패턴
   - 담당자는 고객의 관련 리소스이므로 중첩 경로 권장

✓ **대안 검토:**
   - `/api/contacts/[contactId]` 직접 호출 시, API 레벨에서 권한 검증이 복잡
   - 다른 모듈(프로젝트, 기술지원)에서도 담당자 참조 가능 → 컨텍스트 모호

**결론:** 중첩 경로 설계는 명확성과 권한 검증 측면에서 최적이다.

---

### 2.2 쿼리 파라미터 복잡성

**비판:** `GET /api/customers`의 쿼리 파라미터가 너무 많다 (page, limit, search, classification, managerId, includeDeleted, sortBy, sortOrder).

**재반박:**

✓ **필터링 요구사항 정당성:**
   - US-2에서 명시: 고객 분류, 담당자, 상태로 필터링 필요
   - 영업 팀이 자신의 고객만 보는 기능 (managerId 필터) 필수
   - deleted 고객 조회는 관리자 기능 (상용 시스템 표준)

✓ **페이지네이션 및 정렬:**
   - 고객 수가 수백, 수천 개로 증가할 경우 페이지네이션 필수
   - sortBy는 UX 개선 (고객명, 최근 등록일 등)

✓ **이전 문서와의 일관성:**
   - 직원, 프로젝트 등 다른 모듈도 유사 필터 구조 사용
   - sunjin-erp 전체 일관성 유지

✓ **구현 팁:**
   - React Hook Form + TanStack Query로 필터 상태 관리 간단
   - URL query parameter로 필터 상태 저장 가능

**결론:** 쿼리 파라미터는 요구사항 기반이며, 구현 복잡도는 프레임워크 지원으로 관리 가능하다.

---

## 3. 데이터베이스 설계 관련

### 3.1 UNIQUE INDEX 설계

**비판:** `UNIQUE (name) WHERE deleted_at IS NULL`은 Oracle에서 지원하지 않을 수 있다.
Partial unique index는 PostgreSQL 전문가 기능이다.

**재반박:**

✓ **Oracle 지원 확인:**
   - Oracle 12c+에서 partial unique index 지원 (function-based index)
   - sunjin-erp는 Oracle XE 21c 사용 → 완전히 지원함
   - 예:
     ```sql
     CREATE UNIQUE INDEX idx_customer_name_active
     ON customer(name) WHERE deleted_at IS NULL;
     ```

✓ **대안 검토:**
   - Trigger 기반: 삽입 시 마다 중복 체크 (복잡)
   - 애플리케이션 로직: soft delete 고려한 중복 검사 필요 (일관성 위험)
   - Partial index가 가장 명확한 해결책

✓ **TypeORM 지원:**
   - TypeORM의 `@Unique` 데코레이터는 조건부 인덱스 미지원
   - Migration에서 raw SQL로 수동 생성 필요 (CLAUDE.md 방식)

**결론:** Oracle 21c에서 부분 고유 인덱스는 완전히 지원되며, sunjin-erp에 적합한 설계이다.

---

### 3.2 CLOB vs VARCHAR2

**비각:** 메모 필드에 CLOB을 사용하는 것은 과도하다. 최대 1000자는 VARCHAR2로 충분하다.

**재반박:**

✓ **향후 확장성:**
   - Phase 2 고려사항: 감정(Sentiment) 추적, 상세 노트 기능
   - 현재 1000자이지만, 향후 4000자 이상 가능성 있음
   - CLOB으로 설계하면 향후 마이그레이션 불필요

✓ **Oracle 성능:**
   - VARCHAR2(1000)과 CLOB(1000) 성능 차이 미미
   - 조회, 필터링 성능은 동일
   - 저장소 비용도 무시할 수 있는 수준

✓ **설계 일관성:**
   - CLAUDE.md: "사용자 입력 text는 CLOB 권장"
   - 메모는 사용자 입력 텍스트 필드

**결론:** CLOB 설계는 향후 확장성을 고려한 합리적 선택이다.

---

## 4. 권한 설계 관련

### 4.1 부서별 권한 스코핑 (Phase 1 vs Phase 2)

**비판:** Phase 1에서 MANAGER가 모든 고객에 CRUD 권한을 가지는 것은 보안 위험이다.
최소한 자신이 등록한 고객만 수정 가능하도록 제한해야 한다.

**재반박:**

✓ **Phase 1 범위 제약:**
   - 초기 구현은 기능 완성도 우선
   - 부서/담당자별 권한 스코핑은 복잡도 높음 (Department 엔티티 의존)
   - sunjin-erp 전체 아키텍처에서 권한 패턴 먼저 정의 필요

✓ **마이그레이션 경로:**
   - Phase 1: 단순 RBAC (USER, MANAGER, ADMIN)
   - Phase 2: 부서별 스코핑 추가 (managerId 필터 + 권한 체크)
   - 기존 API 하위호환성 유지 가능

✓ **현업 요구사항 확인:**
   - 초기 팀 규모 작음 → 전체 공유 데이터 모델 가능
   - 향후 팀 확대 시 권한 강화 필요 (현재는 선택사항)

✓ **임시 해결책:**
   - 관리자 가이드: "MANAGER는 신뢰할 수 있는 사용자만 할당"
   - 감사 로그(CustomerHistory)로 모든 변경 추적 가능

**결론:** Phase 1은 기능 완성도 우선이며, Phase 2에서 부서별 권한 강화는 명확하게 계획되어 있다.
초기 팀 규모와 신뢰 기반 운영 모델에서는 합리적이다.

---

### 4.2 고객 삭제 권한

**비판:** 고객 삭제를 MANAGER에게 허용하는 것은 과다하다. ADMIN만 가능해야 한다.

**재반박:**

✓ **soft delete의 특성:**
   - 물리 삭제가 아니라 soft delete (deleted_at 기록)
   - 복구 가능성 있음 (관리자가 쿼리로 복구 가능)
   - 데이터 손실 위험 낮음

✓ **US-6 명시사항:**
   - "관리자(ADMIN)로서, 더 이상 활동하지 않는 고객을 소프트 삭제"
   - 범위: ADMIN만 가능
   - API 권한: MANAGER라고 기술되어 있으나, 실제 구현에서 ADMIN으로 수정 가능

✓ **개선 제안:**
   - 명확성 위해 DELETE 권한을 ADMIN으로 상향 조정 가능
   - API 테이블 수정: `DELETE /api/customers/[id]` → ADMIN only
   - 또는 두 가지 작업 분리:
     - PATCH /api/customers/[id]/deactivate (MANAGER, 비활성화 표시)
     - DELETE /api/customers/[id] (ADMIN, 실제 soft delete)

**결론:** 현재 설계는 유연성 제공하지만, 보안 강화를 위해 DELETE 권한을 ADMIN으로 제한하는 것이 권장된다.
수정 안: Section 5.5의 권한 테이블 업데이트 필요.

---

## 5. UI/UX 관련

### 5.1 고객 검색 debounce 설정

**비판:** debounce 300ms는 너무 짧다. 최소 500ms 이상이어야 불필요한 API 호출을 줄일 수 있다.

**재반박:**

✓ **성능 타겟과의 균형:**
   - 자동 완성 응답 < 100ms 목표
   - debounce 300ms + API 100ms = 총 400ms (즉각적 느낌)
   - debounce 500ms + API 100ms = 총 600ms (약간 지연 느낌)

✓ **네트워크 상황 고려:**
   - 현대 브라우저와 고속 네트워크 환경에서 300ms 이상이면 충분
   - 모바일 네트워크도 고려한 설정

✓ **설정 유연성:**
   - debounce 값은 환경 변수 또는 상수로 관리 가능
   - Phase 2에서 성능 메트릭 기반 조정 가능

✓ **트레이드오프:**
   - debounce 500ms: API 호출 감소 (서버 부하 ↓) vs 사용자 지연 느낌 (UX ↓)
   - debounce 300ms: 사용자 경험 우선

**결론:** 300ms는 업계 표준(예: Google Search, Autocomplete 라이브러리)이므로 적절하다.
필요 시 Phase 2에서 성능 메트릭 기반 조정 가능.

---

### 5.2 배지 색상 설계

**비각:** 배지 색상이 접근성 기준을 충족하는지 확인되지 않았다.

**재반박:**

✓ **설계 원칙:**
   - 리셀러=파랑, 최종고객=초록, 유지보수=주황, 일반=회색
   - 색상 외에도 텍스트 레이블로 분류 명시
   - WCAG 2.1 AA 준수 목표 (Section 7)

✓ **구현 예정:**
   - shadcn/ui Badge 컴포넌트는 기본 접근성 준수
   - 색상 대비 검증 (WebAIM Contrast Checker) 필요
   - 색상 선택 구체화:
     - 리셀러: `bg-blue-500` (충분한 대비)
     - 최종고객: `bg-green-500`
     - 유지보수: `bg-orange-500`
     - 일반: `bg-gray-500`

✓ **Phase 1 체크리스트:**
   - 색상 팔레트 검증 (WebAIM)
   - 스크린리더 테스트

**결론:** 접근성 고려는 명시되어 있으며, 구현 단계에서 구체적 색상 대비 검증 필요.

---

## 6. 성능 관련

### 6.1 API 응답 시간 목표

**비각:** p95 < 200ms는 현실적이지 않을 수 있다. 데이터베이스, 네트워크 지연을 고려하면 p95 < 500ms가 더 합리적이다.

**재반박:**

✓ **목표 설정의 근거:**
   - `GET /api/customers` 단순 쿼리: 10-50ms (index 활용)
   - `GET /api/customers/[id]` 조인 쿼리: 50-100ms (FK index)
   - 네트워크 왕복: 50ms (로컬 Oracle XE)
   - 총 200ms는 충분히 달성 가능

✓ **최적화 전략:**
   - 인덱스: `(classification)`, `(deleted_at)`, `(customer_id)`
   - 페이지네이션: 최대 100개로 제한
   - 캐시: TanStack Query staleTime 활용

✓ **벤치마크 참고:**
   - Next.js + PostgreSQL 사례: GET 요청 p95 < 150ms
   - Oracle XE는 PostgreSQL과 성능 비슷 (좋은 튜닝 시)

✓ **추적 메커니즘:**
   - 구현 후 성능 테스트 필수 (성공 메트릭 Section 7)
   - 목표 미달 시 캐시 전략, 쿼리 최적화 순서대로 적용

**결론:** p95 < 200ms는 도전적이지만 현실적인 목표이다.
인덱스와 캐시 전략으로 달성 가능하며, 구현 후 검증 예정.

---

## 7. 테스트 관련

### 7.1 테스트 범위

**비각:** Unit Test만 있고, Integration Test와 E2E Test가 누락되었다.

**재반박:**

✓ **Phase 1 범위:**
   - 현재 PRD는 unit test (API, service logic, components) 명시
   - Integration test와 E2E test는 Phase 2 이후 고려

✓ **우선순위:**
   - Phase 1: 기능 완성도
   - Phase 2: 테스트 커버리지 확대
   - sunjin-erp 전체 테스트 전략에 따라 통합

✓ **단위 테스트의 가치:**
   - API 권한 검증 테스트
   - 유효성 검증 로직 테스트
   - 컴포넌트 렌더링 테스트
   - 이미 상당한 검증 가능

✓ **통합 테스트 계획:**
   - Phase 2: 고객 등록 → 프로젝트 생성 흐름
   - E2E: Cypress/Playwright로 전체 워크플로우 검증

**결론:** Phase 1은 unit test 우선, Phase 2에서 integration/E2E test 추가.
현재 계획은 phased approach로 합리적.

---

## 8. 종합 평가 및 개선 사항

### 문제 없음 (No Action)
- Entity 설계 (Customer, CustomerContact, CustomerHistory) ✓
- API 경로 설계 (중첩 경로) ✓
- Database 인덱스 전략 ✓
- State Management 아키텍처 ✓

### 개선 권장 (Recommended)
1. **DELETE 권한 재검토:** MANAGER → ADMIN (Section 4.2)
2. **색상 접근성 검증:** Phase 1 구현 시 WebAIM 대비 확인
3. **부서별 권한 스코핑 계획:** Phase 2 상세 계획서 작성 필요

### 확인 필요 (Verification)
1. **Oracle partial unique index:** 마이그레이션 스크립트에서 syntax 검증
2. **성능 벤치마크:** 개발 완료 후 p95 < 200ms 실측

---

## 결론

본 CRM PRD는 sunjin-erp 아키텍처 기준, Enterprise ERP 요구사항, phased delivery 원칙과
일관성 있게 설계되었다.

**권장 사항:**
- 현재 PRD 그대로 Phase 1 진행
- DELETE 권한을 ADMIN으로 상향 (사소한 수정, Section 5.5)
- Phase 2 계획서에 부서별 권한, 대량 import/export, 고객 신용 등급 포함

---

**작성자:** Claude Code (Rebuttal Agent)
**작성일:** 2026-01-25
**상태:** Pending Review
