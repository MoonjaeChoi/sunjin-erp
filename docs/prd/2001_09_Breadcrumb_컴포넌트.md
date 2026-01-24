<!-- Generated: 2026-01-24 21:00:00 KST -->

# Breadcrumb 컴포넌트

**문서 번호**: 2001_09
**원본 PRD**: 2001_전체_레이아웃_설정_prd_v2.md
**PRD 참조**: 원본 PRD의 'US-7, Section 5.7 Breadcrumb 구현 전략' 참조
**구현 범위**: Breadcrumb 컴포넌트 (정적 경로 매핑 + 동적 세그먼트 resolver)
**복잡도**: M
**의존성**: 2001_01 (breadcrumb-config)

---

## 구현 목표

DT-4 결정에 따라 정적 라우트 설정 파일과 동적 resolver를 조합하여 현재 위치를 표시하는 Breadcrumb 컴포넌트를 구현한다. shadcn/ui Breadcrumb 컴포넌트를 활용한다.

---

## 구현 내용

### 파일 구조

```
src/
├── components/layout/
│   └── Breadcrumb.tsx             # Breadcrumb UI 컴포넌트
├── stores/
│   └── breadcrumb-store.ts        # 동적 세그먼트 레이블 관리
└── lib/
    └── breadcrumb-config.ts       # (2001_01에서 생성됨)
```

### 1. Breadcrumb Store (`src/stores/breadcrumb-store.ts`)

```typescript
// Generated: YYYY-MM-DD HH:MM:SS KST

import { create } from 'zustand';

interface BreadcrumbState {
  /** 동적 세그먼트의 커스텀 레이블 (예: { '/customers/123': '삼성전자' }) */
  dynamicLabels: Record<string, string>;
  /** 동적 세그먼트 레이블 설정 */
  setLabel: (path: string, label: string) => void;
  /** 레이블 초기화 */
  clearLabels: () => void;
}

export const useBreadcrumbStore = create<BreadcrumbState>((set) => ({
  dynamicLabels: {},
  setLabel: (path, label) =>
    set((state) => ({
      dynamicLabels: { ...state.dynamicLabels, [path]: label },
    })),
  clearLabels: () => set({ dynamicLabels: {} }),
}));
```

### 2. Breadcrumb 컴포넌트 (`src/components/layout/Breadcrumb.tsx`)

```typescript
// Generated: YYYY-MM-DD HH:MM:SS KST

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb as BreadcrumbUI,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { breadcrumbMap, dynamicSegmentLabels } from '@/lib/breadcrumb-config';
import { useBreadcrumbStore } from '@/stores/breadcrumb-store';
import { Fragment } from 'react';

export function Breadcrumb() {
  const pathname = usePathname();
  const { dynamicLabels } = useBreadcrumbStore();
  const segments = buildBreadcrumbs(pathname, dynamicLabels);

  if (segments.length === 0) return null;

  return (
    <BreadcrumbUI>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;

          return (
            <Fragment key={segment.path}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={segment.path}>{segment.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </BreadcrumbUI>
  );
}

interface BreadcrumbSegmentData {
  path: string;
  label: string;
}

/**
 * pathname을 분석하여 Breadcrumb 세그먼트 배열 생성
 *
 * 예:
 * - "/dashboard" → [{ path: "/dashboard", label: "대시보드" }]
 * - "/customers/123" → [
 *     { path: "/customers", label: "고객 관리" },
 *     { path: "/customers/123", label: "삼성전자" (동적) 또는 "123" }
 *   ]
 * - "/customers/new" → [
 *     { path: "/customers", label: "고객 관리" },
 *     { path: "/customers/new", label: "등록" }
 *   ]
 */
function buildBreadcrumbs(
  pathname: string,
  dynamicLabels: Record<string, string>
): BreadcrumbSegmentData[] {
  const parts = pathname.split('/').filter(Boolean);
  const segments: BreadcrumbSegmentData[] = [];

  let currentPath = '';

  for (const part of parts) {
    currentPath += `/${part}`;

    // 1. 정적 경로 매핑 확인
    if (breadcrumbMap[currentPath]) {
      segments.push({ path: currentPath, label: breadcrumbMap[currentPath] });
      continue;
    }

    // 2. 공통 동적 세그먼트 (new, edit 등)
    if (dynamicSegmentLabels[part]) {
      segments.push({ path: currentPath, label: dynamicSegmentLabels[part] });
      continue;
    }

    // 3. 동적 세그먼트 resolver 확인
    if (dynamicLabels[currentPath]) {
      segments.push({ path: currentPath, label: dynamicLabels[currentPath] });
      continue;
    }

    // 4. Fallback: 세그먼트 그대로 표시
    segments.push({ path: currentPath, label: part });
  }

  return segments;
}
```

### 동적 세그먼트 사용 예시

각 모듈의 상세 페이지에서 `useBreadcrumbStore`를 사용:

```typescript
// src/app/(main)/customers/[id]/page.tsx (CC 부분)
'use client';

import { useEffect } from 'react';
import { useBreadcrumbStore } from '@/stores/breadcrumb-store';

function CustomerDetailClient({ customer }: { customer: Customer }) {
  const { setLabel } = useBreadcrumbStore();

  useEffect(() => {
    setLabel(`/customers/${customer.id}`, customer.name);
  }, [customer.id, customer.name, setLabel]);

  return <div>...</div>;
}
```

### 핵심 설계 결정

1. **정적 + 동적 조합 (DT-4)**: `breadcrumbMap`으로 기본 경로, `useBreadcrumbStore`로 동적 세그먼트
2. **Zustand 사용**: 각 모듈 페이지에서 `setLabel()`로 동적 이름 설정
3. **shadcn/ui Breadcrumb**: 기본 UI 컴포넌트 활용
4. **공통 세그먼트**: `new` → "등록", `edit` → "수정" 자동 매핑
5. **Fallback**: 매핑 없으면 URL 세그먼트 그대로 표시 (ID 등)

---

## Acceptance Criteria

- [ ] `/dashboard` → "대시보드" Breadcrumb 표시
- [ ] `/customers` → "고객 관리" Breadcrumb 표시
- [ ] `/customers/new` → "고객 관리 > 등록" 표시
- [ ] `/customers/123` → "고객 관리 > 123" (기본) 또는 "고객 관리 > 삼성전자" (resolver 설정 시)
- [ ] 마지막 항목은 링크 없음 (현재 페이지)
- [ ] 중간 항목 클릭 시 해당 경로로 네비게이션
- [ ] shadcn/ui Breadcrumb 컴포넌트 사용
- [ ] `npm run build` 성공

---

## 테스트 전략

### 단위 테스트

**테스트 파일**: `src/__tests__/components/layout/Breadcrumb.test.tsx`

```typescript
describe('Breadcrumb', () => {
  it('should render static path label', () => {
    // pathname = "/customers" → "고객 관리"
  });

  it('should render multiple segments', () => {
    // pathname = "/customers/new" → "고객 관리 > 등록"
  });

  it('should use dynamic label from store', () => {
    // setLabel('/customers/123', '삼성전자')
    // pathname = "/customers/123" → "고객 관리 > 삼성전자"
  });

  it('should render last segment as non-link', () => {});

  it('should render intermediate segments as links', () => {});
});

describe('buildBreadcrumbs', () => {
  it('should parse static paths correctly', () => {});
  it('should handle new/edit segments', () => {});
  it('should fallback to raw segment name', () => {});
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] 단위 테스트 통과
- [ ] 정적 경로 매핑 동작
- [ ] 동적 세그먼트 resolver 동작
- [ ] shadcn/ui Breadcrumb 사용

---

**다음 문서**: 2001_10_Loading_UI_및_반응형_키보드_단축키.md
