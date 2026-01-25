<!-- Generated: 2026-01-25 21:28:00 KST -->

# TanStack Query Hooks

**문서 번호**: 2051_13_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 5.4)
**PRD 참조**: TanStack Query 패턴
**구현 범위**: useQuery 및 useMutation hook 7개
**복잡도**: M
**의존성**: 2051_12_Types

---

## 구현 목표

서버 상태 관리를 위한 TanStack Query hook을 구현한다.

---

## 구현 내용

### 파일: src/hooks/issues.ts

**Hooks 목록**
1. `useIssueListQuery` - 목록 조회
2. `useIssueDetailQuery` - 상세 조회
3. `useIssueSummaryQuery` - 요약 배지
4. `useCreateIssueMutation` - 생성
5. `useUpdateIssueMutation` - 수정
6. `useDeleteIssueMutation` - 삭제
7. `useRollbackIssueMutation` - 롤백

**Query Key Factory**
```typescript
const issueQueryKeys = {
  all: () => ['issues'] as const,
  lists: () => [...issueQueryKeys.all(), 'list'] as const,
  list: (params: IssueListParams) => [...issueQueryKeys.lists(), params] as const,
  details: () => [...issueQueryKeys.all(), 'detail'] as const,
  detail: (id: number) => [...issueQueryKeys.details(), id] as const,
  summaries: () => [...issueQueryKeys.all(), 'summary'] as const,
  summary: (params: IssueListParams) => [...issueQueryKeys.summaries(), params] as const,
};
```

**Mutation 캐시 무효화**
- 생성/수정/삭제 시: `queryClient.invalidateQueries({ queryKey: issueQueryKeys.lists() })`
- 삭제 시: 상세 데이터도 무효화
- 모든 변경 후: 요약 배지 무효화

---

## Acceptance Criteria

- [ ] 모든 hook 구현 완료
- [ ] Query key factory 생성
- [ ] 캐시 무효화 로직 정확
- [ ] 에러 핸들링 포함
- [ ] 로딩 상태 반환

---

**다음 문서**: 2051_14_ListPage_Issue.md
