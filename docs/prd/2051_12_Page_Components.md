<!-- Generated: 2026-01-25 18:05:00 KST -->

# Page Components

**문서 번호**: 2051_12
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md ('10. Component File Structure')
**구현 범위**: 3개 페이지 컴포넌트 (목록, 신규, 상세)
**복잡도**: L (Large)
**의존성**: 2051_10 (Hooks), 2051_11 (Store)

---

## 구현 목표

3개 페이지 컴포넌트를 Next.js 14 App Router에 맞게 구현한다:

1. `src/app/(main)/issues/page.tsx` — 목록 페이지 (SC + Client Components)
2. `src/app/(main)/issues/new/page.tsx` — 신규 등록 페이지 (SC + Client Form)
3. `src/app/(main)/issues/[id]/page.tsx` — 상세 페이지 (SC + Client Components)

**구조**: Server Component로 세션/권한 검증 후, Client Components를 감싸기

---

## 구현 상세

### 1. 목록 페이지 (`src/app/(main)/issues/page.tsx`)

```typescript
// Generated: 2026-01-25 18:05:00 KST

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import IssueListPageClient from './page.client';

export const metadata = {
  title: '장애 현황 관리',
  description: '장애 현황을 관리합니다.',
};

export default async function IssueListPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  return <IssueListPageClient />;
}
```

### 1.1 목록 페이지 클라이언트 (`src/app/(main)/issues/page.client.tsx`)

```typescript
// Generated: 2026-01-25 18:05:00 KST

'use client';

import { useState } from 'react';
import { useIssueListWithSummary } from '@/hooks/issues';
import { useIssueFilterStore } from '@/stores/issueFilterStore';
import IssueFilters from '@/components/features/issues/IssueFilters';
import IssueSummaryBadges from '@/components/features/issues/IssueSummaryBadges';
import IssueDataTable from '@/components/features/issues/IssueDataTable';
import IssueCreateDialog from '@/components/features/issues/IssueCreateDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function IssueListPageClient() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Store에서 필터와 페이지네이션 가져오기
  const filters = useIssueFilterStore((state) => state.filters);
  const pagination = useIssueFilterStore((state) => state.pagination);
  const sort = useIssueFilterStore((state) => state.sort);

  // 쿼리 파라미터 조합
  const queryParams = {
    ...pagination,
    ...filters,
    sort_by: sort.sort_by,
    sort_order: sort.sort_order,
  };

  // 목록 + 요약 조회
  const { list, summary, isLoading, isError } = useIssueListWithSummary(queryParams);

  if (isLoading) return <IssueListSkeleton />;
  if (isError) return <div>오류가 발생했습니다.</div>;

  return (
    <div className="space-y-4 p-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">장애 현황</h1>
        <Button onClick={() => setIsCreateOpen(true)}>신규 등록</Button>
      </div>

      {/* 필터 */}
      <IssueFilters />

      {/* 요약 배지 */}
      {summary.data && <IssueSummaryBadges summary={summary.data} />}

      {/* 목록 테이블 */}
      {list.data && <IssueDataTable issues={list.data} pagination={list.data.pagination} />}

      {/* 신규 등록 다이얼로그 */}
      <IssueCreateDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}

function IssueListSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
```

### 2. 신규 등록 페이지 (`src/app/(main)/issues/new/page.tsx`)

```typescript
// Generated: 2026-01-25 18:05:00 KST

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import IssueCreatePageClient from './page.client';

export const metadata = {
  title: '신규 장애 등록',
  description: '새로운 장애를 등록합니다.',
};

export default async function IssueCreatePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  return <IssueCreatePageClient />;
}
```

### 2.1 신규 등록 페이지 클라이언트

```typescript
// Generated: 2026-01-25 18:05:00 KST

'use client';

import { useRouter } from 'next/navigation';
import IssueCreateForm from '@/components/features/issues/IssueCreateForm';

export default function IssueCreatePageClient() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/issues');
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">신규 장애 등록</h1>
      <IssueCreateForm onSuccess={handleSuccess} />
    </div>
  );
}
```

### 3. 상세 페이지 (`src/app/(main)/issues/[id]/page.tsx`)

```typescript
// Generated: 2026-01-25 18:05:00 KST

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import IssueDetailPageClient from './page.client';

interface IssueDetailPageProps {
  params: {
    id: string;
  };
}

export const metadata = {
  title: '장애 상세',
  description: '장애 상세 정보를 확인합니다.',
};

export default async function IssueDetailPage({ params }: IssueDetailPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  return <IssueDetailPageClient issueId={parseInt(params.id)} />;
}
```

### 3.1 상세 페이지 클라이언트

```typescript
// Generated: 2026-01-25 18:05:00 KST

'use client';

import { useIssueDetailQuery } from '@/hooks/issues';
import IssueDetail from '@/components/features/issues/IssueDetail';
import { Skeleton } from '@/components/ui/skeleton';

interface IssueDetailPageClientProps {
  issueId: number;
}

export default function IssueDetailPageClient({ issueId }: IssueDetailPageClientProps) {
  const { data, isLoading, isError } = useIssueDetailQuery(issueId);

  if (isLoading) return <IssueDetailSkeleton />;
  if (isError) return <div>오류가 발생했습니다.</div>;
  if (!data?.data) return <div>데이터를 찾을 수 없습니다.</div>;

  return <IssueDetail issue={data.data} />;
}

function IssueDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <Skeleton className="h-8 w-96" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
```

---

## 파일 구조 정리

```
src/app/(main)/issues/
├── page.tsx                    # Server Component (인증 검증)
├── page.client.tsx             # Client Component (목록)
├── loading.tsx                 # 로딩 스켈레톤
├── new/
│   ├── page.tsx               # Server Component
│   └── page.client.tsx        # Client Component (폼)
└── [id]/
    ├── page.tsx               # Server Component
    └── page.client.tsx        # Client Component (상세)
```

---

## Acceptance Criteria

- [ ] 3개 page.tsx 모두 Server Component로 구현
- [ ] 3개 page.client.tsx 모두 'use client' 적용
- [ ] 세션 검증 및 리다이렉트
- [ ] 목록 페이지: 필터 + 요약 + 테이블 표시
- [ ] 신규 페이지: 폼 표시 및 등록 기능
- [ ] 상세 페이지: 상세 정보 + 첨부파일 + 이력 표시
- [ ] 로딩 스켈레톤 표시
- [ ] 에러 처리
- [ ] TypeScript 빌드 성공
- [ ] ESLint 통과

---

**다음 문서**: 2051_13_IssueFilters_컴포넌트.md
