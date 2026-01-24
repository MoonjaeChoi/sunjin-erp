<!-- Generated: 2026-01-25 02:15:00 KST -->

# Critical Review: 업무 검색 (통합 조회) PRD

**대상 문서:** 2021_업무_검색_prd.md
**리뷰 일자:** 2026-01-25
**리뷰 유형:** Architecture & Completeness Review

---

## Summary

전반적으로 잘 구성된 PRD이나, API 호환성, 검색 트리거 메커니즘, Phase 2-A의 RBAC 범위, 성능 보호 장치에 대한 명확화가 필요하다.

---

## Critical Points

### CP-1: 기존 API 호환성 파괴 위험 [HIGH]

**문제:** `GET /api/tasks` 확장 시 기존 대시보드(2011)에서 사용하는 API 계약이 깨질 수 있다.

- 현재 대시보드 API는 `{ tasks, total }` 형태로 응답하며 `getManyAndCount()`를 사용
- 페이지네이션 파라미터(`page`, `page_size`) 추가 시, 대시보드는 전체 데이터를 받아야 하지만 검색 페이지는 페이지 단위로 받아야 함
- `sort_by`, `sort_order` 추가가 기존 정렬 로직(`task_date ASC, start_time ASC`)에 영향

**Recommendation:**
- 별도 엔드포인트 `/api/tasks/search`를 사용하거나
- `page` 파라미터 미지정 시 기존 동작 유지 (전체 반환)하는 하위 호환 설계

---

### CP-2: 검색 트리거 메커니즘 모호성 [HIGH]

**문제:** US-1에서 "검색 버튼 클릭 또는 필터 변경 시 결과 갱신"이라고 명시하나, 두 방식은 UX와 성능에 큰 차이가 있다.

- **필터 변경 즉시 검색:** Select/DatePicker 변경마다 API 호출 → 과도한 요청
- **검색 버튼 클릭 시만:** 사용자가 여러 필터를 설정한 후 한 번에 검색 → 효율적

키워드 입력의 경우 debounce 처리도 명시되지 않았다.

**Recommendation:**
- 명시적으로 "검색 버튼 클릭" 트리거로 통일하거나
- 즉시 검색 시 debounce 시간(300~500ms) 명시

---

### CP-3: Phase 2-A MANAGER 권한 범위 과도 [HIGH]

**문제:** Phase 2-A에서 "MANAGER/ADMIN: 전체 조회"로 정의하나, 이는 RBAC Goals(G3: MANAGER는 부서 내 업무)와 모순된다.

- MANAGER에게 전체 직원 업무 접근 권한을 임시로라도 부여하면, Phase 1 완료 후 권한을 축소해야 하는 역행이 발생
- 보안 관점에서 일시적으로라도 과도한 권한 부여는 위험

**Recommendation:**
- Phase 2-A에서 MANAGER도 본인 업무만 조회하도록 제한
- Phase 1 완료 후 부서 범위로 확장 (권한 확장은 자연스러움)

---

### CP-4: CSV 내보내기 크기 제한 미정의 [MEDIUM]

**문제:** ADMIN이 전체 데이터를 검색 후 CSV 내보내기 시 데이터 크기 제한이 없다.

- 수년간의 업무 데이터가 누적되면 수만~수십만 건 가능
- 서버 메모리에 전체 데이터를 적재하여 CSV 생성 시 OOM 위험
- 응답 시간 초과 (Next.js Route Handler 기본 타임아웃)

**Recommendation:**
- 최대 내보내기 건수 제한 명시 (예: 10,000건)
- 초과 시 에러 메시지 또는 날짜 범위 축소 안내
- Streaming response 또는 background job 고려 (향후)

---

### CP-5: 날짜 범위 검증 부재 [MEDIUM]

**문제:** 날짜 범위에 대한 최대 기간 제한이 없다.

- 사용자가 1년, 5년 범위를 검색하면 대량 데이터 조회로 성능 저하
- 기존 `GET /api/tasks`에서도 날짜 범위 제한은 없었으나, 대시보드는 월 단위로 사용하여 문제 없었음
- 검색 페이지는 사용자가 임의 범위를 설정 가능하므로 보호 장치 필요

**Recommendation:**
- 최대 검색 기간 제한 (예: 6개월 또는 1년)
- 초과 시 API에서 400 에러 반환

---

### CP-6: Task Detail Dialog vs 상세 페이지 URL [MEDIUM]

**문제:** 업무 상세를 Dialog로 구현하면 특정 업무에 대한 직접 URL 접근/북마크가 불가하다.

- 다른 사용자에게 특정 업무를 공유하려면 URL이 필요
- 기존 PRD에서 `/tasks/[id]` 상세 페이지는 Out-of-Scope에도 명시되지 않음

**Recommendation:**
- Dialog 방식 유지하되, Dialog 열림 시 URL에 `?detail=123` param 추가
- 또는 향후 `/tasks/[id]` 상세 페이지를 별도 구현 가능성 명시

---

### CP-7: TanStack Query keepPreviousData API [MEDIUM]

**문제:** `keepPreviousData: true` 옵션은 TanStack Query v5에서 deprecated이다.

- v5에서는 `placeholderData: keepPreviousData` (함수 import) 형태로 사용
- 프로젝트의 TanStack Query 버전에 따라 달라짐

**Recommendation:**
- 사용 중인 TanStack Query 버전 확인 후 올바른 API 명시
- 또는 구현 시 버전에 맞게 적용한다고 명시

---

### CP-8: keyword LIKE 검색 성능 [MEDIUM]

**문제:** `LIKE '%keyword%'` 패턴은 인덱스를 활용할 수 없어 Full Table Scan이 발생한다.

- PRD Q3에서 언급하지만 Phase 2-A에서의 구체적 대응책이 없음
- 데이터량이 적은 초기에는 문제없으나, 성장 시 병목

**Recommendation:**
- Phase 2-A에서는 현행 유지하되, keyword 최소 길이(2자 이상) 제한 명시
- 페이지네이션과 결합하면 LIMIT으로 어느 정도 완화 가능

---

### CP-9: 초기 페이지 로드 시 자동 검색 여부 [LOW]

**문제:** 페이지 최초 접근 시 기본 날짜 범위(현재 월)로 자동 검색할지, 빈 상태로 시작할지 명시되지 않음.

- 자동 검색: 사용자가 즉시 결과를 볼 수 있으나, 불필요한 API 호출 가능
- 빈 상태: 사용자가 명시적으로 조건 설정 후 검색 → 의도적 UX

**Recommendation:**
- 기본 날짜 범위(현재 월)로 자동 검색 실행하는 것이 자연스러움
- URL params가 있으면 해당 조건으로, 없으면 기본값으로 자동 검색

---

### CP-10: 정렬 기본값 및 다중 정렬 [LOW]

**문제:**
- `sort_by`, `sort_order`의 기본값이 명시되지 않음
- 다중 컬럼 정렬 지원 여부 불명확

**Recommendation:**
- 기본 정렬: `task_date DESC` (최신 순)
- 단일 컬럼 정렬만 지원 (다중 정렬은 복잡도 대비 가치 낮음)
- `sort_order` 기본값: `DESC`

---

## Priority Summary

| Priority | Count | Items |
|----------|-------|-------|
| HIGH | 3 | CP-1, CP-2, CP-3 |
| MEDIUM | 5 | CP-4, CP-5, CP-6, CP-7, CP-8 |
| LOW | 2 | CP-9, CP-10 |

---

## Architecture Compliance Check

| 항목 | 상태 | 비고 |
|------|------|------|
| Next.js App Router (SC/CC 분리) | PASS | Page SC → Client Component 패턴 적절 |
| Oracle XE 21c 규칙 | PASS | soft delete, RESTRICT FK 준수 |
| TypeORM Entity 활용 | PASS | 기존 Task Entity 재활용 |
| NextAuth.js RBAC | WARN | Phase 2-A MANAGER 범위 모순 |
| State Management | PASS | URL params + TanStack Query 적절 |
| shadcn/ui | PASS | 적절한 컴포넌트 선택 |
| Phase 의존성 | PASS | Phase 2-A/2-B 분리 전략 적절 |
