<!-- Generated: 2026-01-25 02:20:00 KST -->

# Rebuttal: 업무 검색 PRD Critical Review

**대상 문서:** 2021_업무_검색_prd_critical_review.md
**작성일:** 2026-01-25

---

## CP-1: 기존 API 호환성 파괴 위험 — 부분 수용

**Critical Point:** `GET /api/tasks` 확장 시 대시보드 API 계약 파괴 가능

**Rebuttal:**
- 유효한 우려. 그러나 별도 엔드포인트 `/api/tasks/search` 생성은 코드 중복을 초래함
- 현재 API는 `page` 파라미터 미지정 시 전체 반환하도록 설계하면 하위 호환 유지 가능
- TypeORM QueryBuilder의 조건부 pagination은 구현이 단순함
- 다만, 응답 형태가 달라지는 문제 (전체: `{tasks, total}` vs 페이지: `{tasks, total, page, page_size}`)가 있으므로 주의 필요

**Conclusion:** 하위 호환 방식으로 기존 API 확장. `page` 미지정 시 기존 동작 유지.

---

## CP-2: 검색 트리거 메커니즘 모호성 — 수용

**Critical Point:** 필터 변경 즉시 vs 버튼 클릭 방식 혼재

**Rebuttal:**
- 유효한 지적. 두 방식의 혼재는 UX 혼란 유발
- ERP 시스템 특성상 여러 조건을 설정한 후 한 번에 검색하는 패턴이 자연스러움
- 즉시 검색은 Select 변경마다 API 호출로 서버 부하 증가

**Conclusion:** "검색 버튼 클릭" 트리거로 통일. URL param은 검색 실행 시에만 업데이트.

---

## CP-3: Phase 2-A MANAGER 권한 범위 과도 — 수용

**Critical Point:** MANAGER에게 전체 조회 권한 부여는 RBAC 목표와 모순

**Rebuttal:**
- 보안 관점에서 올바른 지적
- 실제 회사 규모(소규모, 수십 명)를 고려하면 실질적 위험은 낮으나, 원칙에 어긋남
- Phase 1 완료 후 권한을 축소하는 것보다, 확장하는 것이 자연스러운 방향

**Conclusion:** Phase 2-A에서 MANAGER는 본인 업무만 조회. Phase 1 완료 후 부서 범위 확장.

---

## CP-4: CSV 내보내기 크기 제한 미정의 — 수용

**Critical Point:** 대량 데이터 내보내기 시 서버 리소스 문제

**Rebuttal:**
- 초기 데이터량(수백~수천 건)에서는 문제 없으나, 장기적으로 유효한 우려
- Next.js Route Handler의 기본 타임아웃(30초)을 고려하면 제한 필요

**Conclusion:** 최대 5,000건 제한. 초과 시 날짜 범위 축소 안내 에러 반환.

---

## CP-5: 날짜 범위 검증 부재 — 수용

**Critical Point:** 최대 검색 기간 미제한

**Rebuttal:**
- 업무 데이터 특성상 장기간 검색은 실무적으로 드물지만, 보호 장치는 필요
- 6개월 제한은 다소 짧을 수 있음 (연간 실적 조회 니즈)

**Conclusion:** 최대 1년(365일)으로 제한. API에서 검증.

---

## CP-6: Task Detail Dialog vs 상세 페이지 URL — 부분 수용

**Critical Point:** Dialog로는 직접 URL 접근 불가

**Rebuttal:**
- Dialog는 검색 결과 컨텍스트를 유지하면서 상세를 보여주는 데 최적
- 별도 상세 페이지는 현재 Phase에서 과도한 구현 범위
- `?detail=123` URL param으로 Dialog 상태를 반영하면 공유/북마크 가능

**Conclusion:** Dialog 유지하되, `?detail={id}` URL param으로 상태 동기화 추가.

---

## CP-7: TanStack Query keepPreviousData API — 수용

**Critical Point:** v5 deprecated API 사용 가능성

**Rebuttal:**
- 기술 세부사항으로, PRD에서 구현 API 수준까지 명시할 필요는 없음
- 구현 시 현재 설치된 버전에 맞게 적용하면 됨

**Conclusion:** PRD에서는 "페이지 전환 시 이전 데이터 유지" 동작만 명시. 구현 세부사항은 구현 단계에서 결정.

---

## CP-8: keyword LIKE 검색 성능 — 부분 수용

**Critical Point:** Full Table Scan 위험

**Rebuttal:**
- 현재 데이터 규모(수백~수천 건)에서는 문제 없음
- 페이지네이션과 결합하면 early return 가능 (COUNT는 여전히 full scan이나)
- 최소 길이 제한(2자)은 합리적

**Conclusion:** keyword 최소 2자 이상 제한 추가. Full-Text Index는 데이터 1만 건 초과 시 검토.

---

## CP-9: 초기 페이지 로드 시 자동 검색 여부 — 수용

**Critical Point:** 최초 접근 시 동작 미정의

**Rebuttal:**
- 자동 검색이 더 나은 UX. 빈 페이지는 사용자에게 "오류 아닌가?" 혼란 유발

**Conclusion:** 기본 날짜 범위(현재 월)로 자동 검색 실행. URL params 있으면 해당 조건 사용.

---

## CP-10: 정렬 기본값 및 다중 정렬 — 수용

**Critical Point:** 기본값 미정의

**Rebuttal:**
- 단순하지만 명시가 필요한 부분

**Conclusion:** 기본 정렬 `task_date DESC`, 단일 컬럼 정렬만 지원, `sort_order` 기본값 `DESC`.
