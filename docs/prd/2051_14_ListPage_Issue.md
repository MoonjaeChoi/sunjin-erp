<!-- Generated: 2026-01-25 21:29:00 KST -->

# 목록 페이지

**문서 번호**: 2051_14_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 6.2)
**PRD 참조**: /issues 페이지 레이아웃
**구현 범위**: Server Component + Client Component 분리
**복잡도**: S
**의존성**: 2051_13_Hooks

---

## 구현 목표

장애 목록 페이지를 구현한다. Server Component에서 권한 검증을 하고, Client Component에서 필터/테이블/배지를 표시한다.

---

## 구현 내용

### 파일 구조

```
src/app/(main)/issues/
├── page.tsx              # Server Component
└── _components/
    └── IssueListClient.tsx   # Client Component
```

### page.tsx (Server Component)

```typescript
export default async function IssuesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  
  // 초기 데이터: 첫 페이지만 서버에서 pre-fetch (선택사항)
  
  return (
    <main>
      <Breadcrumb items={[{ label: '장애 현황' }]} />
      <IssueListClient />
    </main>
  );
}
```

### IssueListClient.tsx (Client Component)

**구조**
```
- IssueSummaryBadges (요약 카운트)
- IssueFilters (필터)
- IssueDataTable (테이블)
```

---

## Acceptance Criteria

- [ ] page.tsx 생성 완료
- [ ] IssueListClient.tsx 생성 완료
- [ ] 권한 검증 동작
- [ ] 브레드크럼 표시
- [ ] 초기 로딩 스켈레톤 표시

---

**다음 문서**: 2051_15_Filters_Issue.md
