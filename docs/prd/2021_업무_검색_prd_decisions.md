<!-- Generated: 2026-01-25 02:25:00 KST -->

# Decisions: 업무 검색 PRD Review

**대상 문서:** 2021_업무_검색_prd.md
**결정일:** 2026-01-25
**모드:** AI-Assisted

---

## Decision Summary

| Topic | 결정 | 근거 |
|-------|------|------|
| 1. API 엔드포인트 | A) 기존 API 확장 | 코드 중복 방지, page 미지정 시 하위 호환 유지 |
| 2. 검색 트리거 | B) 즉시 검색 (debounce) | 빠른 피드백 UX, 300ms debounce로 부하 제어 |
| 3. MANAGER 범위 | A) 본인 업무만 | 보안 원칙 준수, Phase 1 후 확장 |
| 4. CSV 제한 | A) 5,000건 | 일반 보고서 충분, 서버 보호 |
| 5. 날짜 범위 | B) 최대 1년 | 연간 실적 조회 가능 |
| 6. 상세 UI | A) Dialog + URL param | 검색 컨텍스트 유지 + URL 공유 |
| 7. 초기 로드 | A) 자동 검색 | 사용자 친화적 UX |
| 8. 정렬 기본값 | A) task_date DESC | 최신 업무 우선 표시 |

---

## Detailed Decisions

### Topic 1: API 엔드포인트 전략 → 기존 API 확장

- `GET /api/tasks` 확장
- `page` 미지정: 기존 동작 유지 (`{ tasks, total }`)
- `page` 지정: 페이지네이션 적용 (`{ tasks, total, page, page_size }`)
- 대시보드 호환성 유지

### Topic 2: 검색 트리거 방식 → 즉시 검색 (debounce)

- 모든 필터(Select, DatePicker) 변경 시 debounce 300ms 후 자동 검색
- 키워드 입력: debounce 500ms
- URL param 업데이트도 debounce 후 실행
- 검색 버튼 제거 (즉시 검색이므로 불필요)
- 초기화 버튼은 유지 (모든 필터를 기본값으로 리셋)

### Topic 3: Phase 2-A MANAGER 범위 → 본인 업무만

- Phase 2-A: USER와 MANAGER 모두 본인 업무만 조회
- Phase 2-B (Phase 1 완료 후): MANAGER는 부서 내 업무로 확장
- ADMIN: Phase 2-A에서도 전체 조회 (관리자 역할)

### Topic 4: CSV 내보내기 최대 건수 → 5,000건

- 검색 결과가 5,000건 초과 시 에러 반환
- 에러 메시지: "검색 결과가 5,000건을 초과합니다. 날짜 범위를 좁혀주세요."

### Topic 5: 날짜 범위 최대 기간 → 1년 (365일)

- `date_to - date_from > 365일` 시 API에서 400 에러 반환
- 에러 메시지: "검색 기간은 최대 1년입니다."

### Topic 6: 업무 상세 UI → Dialog + URL param

- 테이블 행 클릭 시 Dialog 표시
- URL에 `?detail={id}` param 추가
- 페이지 새로고침/직접 접근 시 해당 Dialog 자동 열림

### Topic 7: 초기 로드 동작 → 자동 검색

- 페이지 최초 접근 시 기본 날짜 범위(현재 월 1일~말일)로 자동 검색
- URL params 존재 시 해당 조건으로 검색

### Topic 8: 정렬 기본값 → task_date DESC

- 기본 정렬: `task_date DESC` (최신 순)
- 단일 컬럼 정렬만 지원
- `sort_order` 기본값: `DESC`
- 지원 정렬 컬럼: `task_date`, `title`, `status`
