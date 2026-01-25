<!-- Generated: 2026-01-25 21:30:00 KST -->

# 필터 컴포넌트

**문서 번호**: 2051_15_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 6.2, US-10)
**PRD 참조**: 필터 영역 레이아웃
**구현 범위**: 고객사, 상태, 심각도, 담당자, 날짜 범위
**복잡도**: M
**의존성**: 2051_12_Types

---

## 구현 목표

AND 조합으로 여러 필터를 동시에 적용할 수 있는 필터 컴포넌트를 구현한다.

---

## 구현 내용

### IssueFilters.tsx (Client Component)

**필터 항목**
1. 고객사 - Combobox (검색 가능)
2. 상태 - Multi-select 또는 Checkbox (INTAKE, IN_PROGRESS, COMPLETED)
3. 심각도 - Multi-select (CRITICAL, HIGH, MEDIUM, LOW)
4. 담당자 - Select (드롭다운)
5. 기간 - DateRange Picker (date_from, date_to)

**기능**
- 필터 초기화 버튼 (모든 필터 삭제)
- 검색 버튼 (쿼리 파라미터 업데이트)
- 필터 state 관리: Zustand `useIssueFilterStore`
- AND 조합으로 쿼리 생성

**변경 시 동작**
1. 필터 state 업데이트
2. URL 쿼리 파라미터 동기화
3. React Query 캐시 키 변경 → 데이터 재조회

---

## Acceptance Criteria

- [ ] IssueFilters.tsx 생성 완료
- [ ] 모든 필터 입력 필드 구현
- [ ] 초기화 버튼 동작
- [ ] 필터 state 관리
- [ ] URL 동기화
- [ ] AND 필터 조합 정확

---

**다음 문서**: 2051_16_Table_Issue.md
