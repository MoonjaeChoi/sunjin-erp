<!-- Generated: 2026-01-24 22:30:00 KST -->

# Critical Review: 2011_대시보드_및_일정관리_prd.md

**문서번호:** 2011
**리뷰 일시:** 2026-01-24
**리뷰 방법:** Architecture Compliance Check (sunjin-erp 표준)

---

## Executive Summary

대시보드 및 일정관리 PRD는 업무 캘린더의 핵심 기능을 체계적으로 정의하고 있으나, 다음 영역에서 보완이 필요하다:
1. 캘린더 라이브러리 선택 미결정 (구현 복잡도에 직접 영향)
2. Phase 2 의존성이 Phase 1 미구현 모듈에 전면 의존
3. 시간 데이터 타입 설계의 Oracle 호환성 문제
4. 팀 캘린더 쿼리 성능 우려
5. TechSupport 통합 조회의 조인 전략 미정의
6. Optimistic Update 실패 시 롤백 전략 부재

---

## Discussion Points

### DP-1: 캘린더 라이브러리 선택 미결정
**Priority:** HIGH
**Category:** Architecture / Open Questions

**문제:** Open Questions Q1에서 "자체 구현 (CSS Grid) vs `@fullcalendar/react` vs 경량 대안?"이 미결정 상태이다. 이 결정은 구현 복잡도, 번들 사이즈, 유지보수성에 직접 영향을 미치는 핵심 아키텍처 결정이다.

**우려사항:**
- CSS Grid 자체 구현: 월/주/일 3개 뷰를 모두 자체 구현하면 상당한 공수 소요 (특히 주간 뷰의 시간대별 블록 배치)
- `@fullcalendar/react`: 번들 사이즈가 크고 (gzipped ~45KB+), 커스터마이징이 제한적이며, 스타일링이 shadcn/ui와 충돌 가능
- 월간 뷰에서 업무 건수만 표시하는 단순한 요구사항이므로 FullCalendar는 과도할 수 있음
- 주간 뷰의 시간대별 블록 표시는 자체 구현 시 복잡도가 급증

**제안:**
- 월간 뷰: CSS Grid 자체 구현 (날짜 셀 + 건수/색상 표시로 충분)
- 주간/일간 뷰: 시간축 기반 레이아웃은 `date-fns` + CSS Grid로 커스텀 구현하되, 초기 버전은 월간 뷰 우선 구현 후 점진적 추가
- 또는 주간/일간 뷰를 리스트 형태로 단순화 (Out-of-Scope의 드래그 앤 드롭이 없으므로 타임라인 블록이 필수는 아님)

---

### DP-2: Phase 1 미구현 의존성으로 인한 개발 블로킹
**Priority:** HIGH
**Category:** Dependencies

**문제:** Phase 2에 해당하는 본 모듈이 Phase 1의 Auth, Employee, Customer, TechSupport 엔티티에 전면 의존하나, 모두 "미구현" 상태이다. 병렬 개발이 불가능한 경우 Phase 2 착수 자체가 지연된다.

**우려사항:**
- `employee_id` FK가 필수(NOT NULL)이므로 Employee Entity 없이는 Task 테이블 생성 불가
- NextAuth session에서 `employee_id`, `role`, `department` 제공이 필요하지만 Auth 모듈 미구현
- TechSupport Entity 미구현으로 daily-summary API의 통합 조회 불가
- 실질적으로 UI만 먼저 구현하고 API/DB는 대기해야 하는 상황

**제안:**
- Mock 데이터 기반 UI 개발을 명시 (MSW 또는 TanStack Query의 placeholder data 활용)
- Phase 1과의 인터페이스 계약(Interface Contract)을 정의: Employee 엔티티의 최소 필드, session 객체 구조
- TechSupport 통합 조회는 Phase 3 구현 후 활성화로 단계 분리

---

### DP-3: 시간 데이터 타입 설계 부적절
**Priority:** HIGH
**Category:** Database Design

**문제:** `start_time`과 `end_time`이 `VARCHAR2(5)` (HH:MM 형식)로 정의되어 있다. 문자열 기반 시간 저장은 Oracle의 날짜/시간 연산 기능을 활용할 수 없다.

**우려사항:**
- `start < end` 비교가 문자열 비교가 됨 (의미상 정확하나 DB 레벨 제약조건 불가)
- 시간 범위 검색(예: 오전 9시~12시 사이 업무 조회)에 Oracle DATE 함수 사용 불가
- 향후 업무 시간 통계 계산 시 문자열→시간 변환 필요
- `task_date` + `start_time`을 합쳐 정확한 시점을 표현하려면 애플리케이션 레벨 조합 필요

**제안:**
- `start_time`/`end_time`을 `TIMESTAMP`로 변경하고 `task_date`와 통합 (start_datetime, end_datetime)
- 또는 Oracle의 `INTERVAL DAY TO SECOND` 타입 활용
- 최소한 CHECK 제약조건 추가: `REGEXP_LIKE(start_time, '^\d{2}:\d{2}$')`

---

### DP-4: 팀 캘린더 쿼리 성능 미고려
**Priority:** HIGH
**Category:** Performance

**문제:** Open Questions Q3에서 성능 우려를 언급했으나 해결책이 미정의이다. MANAGER가 월간 팀 캘린더를 조회할 때 부서원 N명 × 30일 × 업무 건수의 데이터를 한 번에 로딩해야 한다.

**우려사항:**
- 부서원 10명, 일평균 업무 3건 가정 시 월간 ~900건 조회 — 현재는 문제없으나 확장 시 이슈
- API 응답의 p95 < 200ms 목표와 팀 캘린더의 대량 데이터 로딩 간 충돌 가능
- Oracle에서 날짜 범위 + 부서 조인 쿼리의 실행 계획 미검토
- 현재 인덱스 `IDX_TASK_DATE_EMPLOYEE`는 (task_date, employee_id) 순서인데, 팀 캘린더는 employee_id 기반 필터가 먼저이므로 인덱스 효율 저하

**제안:**
- 팀 캘린더 전용 인덱스 추가: `IDX_TASK_EMPLOYEE_DATE` — (employee_id, task_date, deleted_at)
- 월간 뷰에서는 날짜별 건수만 조회하는 경량 API (`/api/dashboard/team/summary`) 분리
- 상세 데이터는 날짜 클릭 시 lazy loading

---

### DP-5: Optimistic Update 실패 시 롤백 전략 부재
**Priority:** HIGH
**Category:** State Management

**문제:** US-2에서 "등록 후 캘린더 뷰에 즉시 반영 (optimistic update)"을 명시하지만, 서버 응답 실패 시 UI 롤백 처리가 정의되지 않았다.

**우려사항:**
- 네트워크 오류 시 사용자에게 등록 성공으로 보이지만 실제로는 미저장
- TanStack Query의 `onMutate`/`onError` 콜백에서 이전 캐시 복원 전략 미정의
- 상태 변경(READY → IN_PROGRESS) 시 빠르게 연속 클릭하면 race condition 발생 가능
- 오프라인 상태에서의 동작 미정의

**제안:**
- TanStack Query mutation의 rollback 패턴 명시 (`onMutate`에서 snapshot, `onError`에서 복원)
- 실패 시 사용자에게 Toast 알림으로 에러 통지
- 상태 변경 API 호출 중에는 해당 항목 비활성화 (double-click 방지)

---

### DP-6: TechSupport 통합 조회의 조인 전략 미정의
**Priority:** MEDIUM
**Category:** Architecture / API Design

**문제:** `GET /api/dashboard/daily-summary` API가 업무(Task)와 기술지원(TechSupport) 건을 통합 조회하지만, TechSupport 엔티티의 스키마가 아직 정의되지 않았고, 조인 기준도 모호하다.

**우려사항:**
- "TechSupport의 `support_date` 기준으로 조인하는 것이 적절한가?"가 Open Questions에 있음
- TechSupport가 다른 모듈에서 관리되므로, 해당 엔티티의 스키마 변경 시 본 API에 영향
- 한 API에서 두 개의 독립 엔티티를 조회하면 성능 이슈 (2개의 별도 쿼리 vs UNION)
- TechSupport에 `employee_id`가 있는지, 어떤 필드로 담당자를 식별하는지 미정의

**제안:**
- daily-summary API를 두 개의 병렬 쿼리로 구성 (Task 조회 + TechSupport 조회)하고 응답에서 구분
- TechSupport 엔티티의 최소 인터페이스 정의: `support_date`, `employee_id`, `customer_id`, `title`, `status`
- Phase 3(기술지원 모듈) 구현 전까지는 daily-summary에서 TechSupport 섹션을 빈 배열로 반환

---

### DP-7: URL Query Param 기반 상태 관리와 Zustand Store 중복
**Priority:** MEDIUM
**Category:** State Management

**문제:** US-1에서 "뷰 전환 시 URL query param으로 상태 유지 (`?view=month&date=2026-01-24`)"를 명시하고, 동시에 5.4에서 `useCalendarStore` (Zustand)가 "현재 뷰 모드, 선택된 날짜"를 관리한다고 정의한다. URL과 Zustand가 동일 상태를 관리하면 동기화 문제가 발생한다.

**우려사항:**
- URL과 Zustand store 간 불일치 발생 가능 (어느 것이 source of truth인지 불명확)
- 브라우저 뒤로가기 시 URL은 변경되지만 Zustand store는 업데이트되지 않을 수 있음
- 페이지 새로고침 시 URL에서 초기값을 복원해야 하므로 Zustand 초기화 로직 필요

**제안:**
- URL query param을 single source of truth로 사용하고, `useSearchParams()` 훅으로 직접 읽기
- Zustand store에서 뷰 모드/날짜 제거하고, 사이드바 상태 등 순수 UI 상태만 관리
- 또는 `nuqs` 같은 URL state 관리 라이브러리 활용

---

### DP-8: 업무 시간 겹침 검증 정책 미결정
**Priority:** MEDIUM
**Category:** Business Logic / Open Questions

**문제:** Open Questions Q4에서 "같은 시간대에 중복 업무 등록 허용할 것인가?"가 미결정이다. 이는 UI와 API 모두에 영향을 미치는 비즈니스 정책 결정이다.

**우려사항:**
- 허용 시: 시간 겹침으로 인한 혼란, 주간/일간 뷰에서 블록 중첩 표시 문제
- 금지 시: 등록/수정 시 시간 충돌 검증 로직 필요, API 응답 시간 증가
- 외근(FIELD)의 경우 시작/종료 시간이 선택 입력이므로, 시간 미지정 업무와 지정 업무 간 겹침 판단 불가

**제안:**
- 시간 겹침 허용하되, UI에서 경고 표시 (확인 후 등록 가능)
- 시간 미지정 업무는 겹침 검증 대상에서 제외
- 주간/일간 뷰에서 겹침 발생 시 나란히 표시 (column stacking)

---

### DP-9: 모바일 대응 전략의 구체성 부족
**Priority:** MEDIUM
**Category:** UI/UX / Responsive

**문제:** 6.3 Responsive Design에서 모바일 전략을 "일간 뷰 기본, 리스트 형태"로 간략히 기술하지만, 구체적인 인터랙션 차이가 정의되지 않았다.

**우려사항:**
- 모바일에서 업무 등록 폼(Dialog)의 UX가 데스크톱과 동일할 수 없음
- 날짜 이동(이전/다음)이 스와이프 제스처를 지원할 것인지
- 모바일에서 팀 캘린더(MANAGER)의 UX가 미정의
- DayDetailPanel이 모바일에서 어떻게 표시될지 (Full screen overlay vs Bottom sheet)

**제안:**
- 모바일에서는 Dialog 대신 Full-screen 페이지 전환으로 업무 등록
- 날짜 이동은 스와이프 대신 DatePicker 활용
- 팀 캘린더 모바일: 직원 드롭다운 선택 후 해당 직원의 일간 뷰 표시

---

### DP-10: completed_at 자동 기록의 트리거 메커니즘 미정의
**Priority:** LOW
**Category:** Business Logic

**문제:** US-3에서 "완료 시 완료일시 자동 기록"이라 하지만, 이것이 API 레벨에서 처리되는지, 클라이언트에서 보내는지, DB 트리거인지 불명확하다.

**우려사항:**
- 클라이언트에서 `completed_at`을 보내면 시간 조작 가능
- API에서 status가 DONE으로 변경될 때 서버 시간으로 자동 설정해야 함
- DONE에서 다시 IN_PROGRESS로 변경 시 completed_at을 NULL로 리셋할 것인지

**제안:**
- API 레벨에서 status DONE 변경 감지 시 서버 TIMESTAMP로 `completed_at` 자동 설정
- 상태 역행(DONE → IN_PROGRESS) 시 `completed_at` NULL 처리
- 클라이언트에서 `completed_at` 필드는 읽기 전용

---

### DP-11: DELETE API 호출 전 의존성 확인 미정의
**Priority:** LOW
**Category:** Database Safety

**문제:** CLAUDE.md에서 "Check dependencies before delete — Verify no related records exist"를 강제하지만, Task 엔티티의 삭제 시 확인할 의존성이 정의되지 않았다.

**우려사항:**
- 현재 Task에 FK로 참조하는 하위 엔티티가 없지만, 향후 추가될 수 있음 (첨부파일, 코멘트 등)
- Soft delete이므로 CASCADE 이슈는 없으나, 정책적으로 완료 상태(DONE) 업무의 삭제 허용 여부

**제안:**
- 완료(DONE) 상태 업무 삭제 시 추가 확인 메시지 표시
- API에서 삭제 전 해당 Task의 하위 리소스(향후 확장) 존재 여부 확인 패턴 적용

---

## Summary Table

| ID | Priority | Category | 핵심 이슈 |
|----|----------|----------|-----------|
| DP-1 | HIGH | Architecture | 캘린더 라이브러리 선택 미결정 |
| DP-2 | HIGH | Dependencies | Phase 1 미구현으로 인한 개발 블로킹 |
| DP-3 | HIGH | Database | 시간 데이터 타입(VARCHAR2) 부적절 |
| DP-4 | HIGH | Performance | 팀 캘린더 쿼리 성능 미고려 |
| DP-5 | HIGH | State Management | Optimistic Update 롤백 전략 부재 |
| DP-6 | MEDIUM | Architecture/API | TechSupport 통합 조회 전략 미정의 |
| DP-7 | MEDIUM | State Management | URL param과 Zustand 상태 중복 |
| DP-8 | MEDIUM | Business Logic | 업무 시간 겹침 정책 미결정 |
| DP-9 | MEDIUM | UI/UX | 모바일 대응 구체성 부족 |
| DP-10 | LOW | Business Logic | completed_at 자동 기록 트리거 미정의 |
| DP-11 | LOW | Database Safety | 삭제 전 의존성 확인 미정의 |

---

## Conclusion

PRD 2011은 대시보드 및 일정관리의 기능 요구사항을 명확하게 정의하고 있으나, 구현 수준의 기술적 결정들이 다수 미해결 상태이다. 특히 캘린더 라이브러리 선택(DP-1)은 전체 프론트엔드 구현 전략에 직접 영향을 미치며, 시간 데이터 타입(DP-3)은 DB 스키마 설계 단계에서 반드시 확정해야 한다. Phase 1 의존성 문제(DP-2)는 병렬 개발을 위한 Mock 전략을 수립하면 해소할 수 있다. URL과 Zustand의 상태 중복(DP-7)은 CLAUDE.md의 State Management Philosophy와 직접 관련되므로 초기에 해결해야 한다.
