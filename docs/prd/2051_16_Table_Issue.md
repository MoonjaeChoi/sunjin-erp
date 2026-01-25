<!-- Generated: 2026-01-25 21:31:00 KST -->

# 목록 테이블 컴포넌트

**문서 번호**: 2051_16_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 6.2, US-5)
**PRD 참조**: 테이블 레이아웃
**구현 범위**: shadcn/ui Table, 정렬, 페이지네이션, 배지
**복잡도**: M
**의존성**: 2051_13_Hooks, 2051_25_StatusBadge

---

## 구현 목표

Issue 목록을 테이블로 표시하고, 정렬과 페이지네이션을 지원한다.

---

## 구현 내용

### IssueDataTable.tsx (Client Component)

**컬럼**
| 컬럼 | 콘텐츠 | 정렬 가능 |
|------|--------|---------|
| 제목 | 제목 (클릭 시 상세 페이지) | ✓ |
| 고객사 | 고객사명 | ✗ |
| 상태 | StatusBadge | ✓ |
| 심각도 | SeverityBadge | ✓ |
| 담당자 | 담당자명 또는 "미지정" | ✓ |
| 생성일 | YYYY-MM-DD | ✓ |

**기능**
- 행 클릭 시 `/issues/[id]` 상세 페이지 이동
- 정렬: sort_by, sort_order URL 파라미터 업데이트
- 페이지네이션: page_size 변경 옵션 (20, 50, 100)
- 로딩 상태: Skeleton rows 표시
- 공백 상태: "데이터가 없습니다" 메시지

---

## Acceptance Criteria

- [ ] IssueDataTable.tsx 생성 완료
- [ ] 모든 컬럼 표시
- [ ] 정렬 기능 동작
- [ ] 페이지네이션 동작
- [ ] 행 클릭 시 상세 페이지 이동
- [ ] 배지 색상 표시

---

**다음 문서**: 2051_17_Badges_Issue.md
