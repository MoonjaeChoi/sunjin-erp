<!-- Generated: 2026-01-25 02:20:00 KST -->

# Discussion Topics: 업무 검색 PRD

**대상 문서:** 2021_업무_검색_prd.md
**작성일:** 2026-01-25

---

## Topic 1: API 엔드포인트 전략 [HIGH]

**Context:** 기존 `GET /api/tasks` (대시보드용)를 확장할 것인가, 별도 `/api/tasks/search`를 만들 것인가?

**Options:**
- **A) 기존 API 확장 (하위 호환):** `page` 미지정 시 전체 반환, 지정 시 페이지네이션. 코드 중복 없으나 조건부 로직 복잡.
- **B) 별도 엔드포인트 `/api/tasks/search`:** 명확한 관심사 분리. 코드 중복 발생하나 각 엔드포인트가 단순.
- **C) 기존 API + response envelope 통일:** 항상 `{data, meta: {total, page, pageSize}}` 형태로 반환. 대시보드도 수정 필요.

**Recommendation:** A (하위 호환 확장)

---

## Topic 2: 검색 트리거 방식 [HIGH]

**Context:** 필터 변경 시 즉시 검색 vs 검색 버튼 클릭

**Options:**
- **A) 버튼 클릭 트리거:** 사용자가 조건 설정 후 명시적으로 검색. 서버 부하 최소화.
- **B) 즉시 검색 (debounce):** 필터 변경 300ms 후 자동 검색. 빠른 피드백이나 과도한 API 호출.
- **C) 하이브리드:** Select 변경은 즉시, 텍스트 입력은 버튼 클릭.

**Recommendation:** A (버튼 클릭 통일)

---

## Topic 3: Phase 2-A MANAGER 조회 범위 [HIGH]

**Context:** Employee 모듈 미완성 시 MANAGER의 조회 범위

**Options:**
- **A) 본인 업무만:** 보안 원칙 준수. 기능 축소.
- **B) 전체 조회:** 넓은 범위 제공. 보안 원칙 위반이나 소규모 회사에서 실용적.
- **C) ADMIN만 전체 조회, MANAGER는 본인만:** ADMIN에게만 임시 전체 권한.

**Recommendation:** A (본인 업무만)

---

## Topic 4: CSV 내보내기 최대 건수 [MEDIUM]

**Context:** 대량 데이터 내보내기 시 서버 보호

**Options:**
- **A) 5,000건 제한:** 일반적 업무 보고서에 충분.
- **B) 10,000건 제한:** 연간 데이터에도 대응 가능.
- **C) 제한 없음 + Streaming:** 기술적으로 복잡하나 제한 없는 UX.

**Recommendation:** A (5,000건)

---

## Topic 5: 날짜 범위 최대 기간 [MEDIUM]

**Context:** 검색 성능 보호를 위한 최대 기간 제한

**Options:**
- **A) 6개월:** 보수적. 반기 단위 조회.
- **B) 1년:** 연간 실적 조회 가능.
- **C) 제한 없음:** 자유도 최대화, 성능 위험.

**Recommendation:** B (1년)

---

## Topic 6: 업무 상세 UI 패턴 [MEDIUM]

**Context:** 검색 결과에서 업무 상세를 어떤 UI로 표시할 것인가?

**Options:**
- **A) Dialog + URL param:** Dialog로 표시, `?detail=123` URL 동기화. 검색 컨텍스트 유지.
- **B) Side Panel (Drawer):** 테이블 옆에 패널로 상세 표시. 비교 용이하나 화면 분할.
- **C) 별도 상세 페이지 `/tasks/[id]`:** 완전한 URL 지원이나 검색 컨텍스트 유실.

**Recommendation:** A (Dialog + URL param)

---

## Topic 7: 초기 로드 동작 [LOW]

**Context:** 페이지 최초 접근 시 자동 검색 여부

**Options:**
- **A) 자동 검색 (기본 날짜 범위):** 즉시 결과 표시. 사용자 친화적.
- **B) 빈 상태:** 사용자가 조건 설정 후 검색. 불필요한 API 호출 방지.

**Recommendation:** A (자동 검색)

---

## Topic 8: 정렬 기본값 [LOW]

**Context:** 기본 정렬 방향 및 다중 정렬 지원 여부

**Options:**
- **A) task_date DESC (최신 순):** 최근 업무부터 표시. 가장 자연스러운 기본값.
- **B) task_date ASC (오래된 순):** 시간순 정렬. 기존 대시보드와 동일.

**Recommendation:** A (DESC, 최신 순)

---

## Priority Summary

| Priority | Topics |
|----------|--------|
| HIGH | Topic 1, 2, 3 |
| MEDIUM | Topic 4, 5, 6 |
| LOW | Topic 7, 8 |
