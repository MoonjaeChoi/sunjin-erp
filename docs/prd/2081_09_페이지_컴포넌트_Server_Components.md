<!-- Generated: 2026-01-27 22:45:00 KST -->

# 페이지 컴포넌트 (Server Components)

**문서 번호**: 2081_09
**원본 PRD**: docs/prd/2081_고객_등록_및_조회_prd_v2.md
**구현 범위**: Page.tsx Server Components (권한 검증, 초기 로딩)
**복잡도**: S (0.5~1일)
**의존성**: 2081_08 완료 (Hooks)

---

## 구현 목표

Next.js App Router 페이지 컴포넌트(Server Component)를 구현합니다. 권한 검증, 초기 데이터 로딩, 클라이언트 컴포넌트 조합을 담당합니다.

---

## 파일 구조

```
src/app/(main)/customers/
├── page.tsx (목록 페이지)
├── new/
│   └── page.tsx (등록 페이지)
└── [id]/
    └── page.tsx (상세 페이지)
```

---

## 구현 상세

### 1. `/customers/page.tsx` (목록 페이지)

```typescript
// Server Component
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CustomerListClient from '@/components/features/customers/CustomerListClient';

export const metadata = {
  title: '고객 관리',
  description: '고객 목록 조회 및 관리'
};

export default async function CustomersPage() {
  // 권한 검증 (USER+)
  const session = await getServerSession(authOptions);
  if (!session || !['USER', 'MANAGER', 'ADMIN'].includes(session.user.role)) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">고객 관리</h1>
            <p className="mt-1 text-sm text-gray-500">고객 정보를 관리하고 조회합니다.</p>
          </div>
        </div>

        {/* Client Component로 위임 */}
        <CustomerListClient />
      </div>
    </div>
  );
}
```

### 2. `/customers/new/page.tsx` (등록 페이지)

```typescript
// Server Component
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CustomerFormClient from '@/components/features/customers/CustomerFormClient';

export const metadata = {
  title: '고객 등록',
  description: '새 고객 등록'
};

export default async function CreateCustomerPage() {
  // 권한 검증 (MANAGER+)
  const session = await getServerSession(authOptions);
  if (!session || !['MANAGER', 'ADMIN'].includes(session.user.role)) {
    redirect('/customers');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">고객 등록</h1>
        </div>

        <CustomerFormClient isNew />
      </div>
    </div>
  );
}
```

### 3. `/customers/[id]/page.tsx` (상세 페이지)

```typescript
// Server Component
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CustomerDetailClient from '@/components/features/customers/CustomerDetailClient';

export const metadata = {
  title: '고객 상세',
  description: '고객 상세 정보'
};

interface CustomerDetailPageProps {
  params: { id: string };
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  // 권한 검증 (USER+)
  const session = await getServerSession(authOptions);
  if (!session || !['USER', 'MANAGER', 'ADMIN'].includes(session.user.role)) {
    redirect('/login');
  }

  const customerId = parseInt(params.id);
  if (isNaN(customerId)) {
    redirect('/customers');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-8">
        {/* Client Component로 위임 */}
        <CustomerDetailClient customerId={customerId} />
      </div>
    </div>
  );
}
```

---

## Acceptance Criteria

- [ ] `/customers/page.tsx` 생성 (목록 페이지)
  - [ ] 권한 검증 (USER+)
  - [ ] 레이아웃 정의
  - [ ] ClientComponent 조합

- [ ] `/customers/new/page.tsx` 생성 (등록 페이지)
  - [ ] 권한 검증 (MANAGER+)
  - [ ] 폼 렌더링

- [ ] `/customers/[id]/page.tsx` 생성 (상세 페이지)
  - [ ] 권한 검증 (USER+)
  - [ ] ID 파라미터 검증
  - [ ] 상세 뷰 렌더링

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] 페이지 파일 생성
- [ ] 권한 검증 구현
- [ ] 메타데이터 설정

---

**다음 문서**: 2081_10_목록_컴포넌트_CustomerList_Filters.md
