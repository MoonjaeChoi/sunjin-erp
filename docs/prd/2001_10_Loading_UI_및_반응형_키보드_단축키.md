<!-- Generated: 2026-01-24 21:00:00 KST -->

# Loading UI 및 반응형/키보드 단축키

**문서 번호**: 2001_10
**원본 PRD**: 2001_전체_레이아웃_설정_prd_v2.md
**PRD 참조**: 원본 PRD의 'US-8, Section 5.8, Section 6.3' 참조
**구현 범위**: 공통 스켈레톤 UI, 반응형 세부 조정, 키보드 단축키 마무리
**복잡도**: M
**의존성**: 2001_06 (MainShell)

---

## 구현 목표

DT-9 결정에 따라 `(main)/loading.tsx`에 공통 스켈레톤 UI를 정의하고, 반응형 동작의 세부 사항을 마무리한다. 키보드 단축키 관련 엣지 케이스를 처리한다.

---

## 구현 내용

### 파일 구조

```
src/app/(main)/
└── loading.tsx                    # 공통 스켈레톤 UI
```

### 1. Loading UI (`src/app/(main)/loading.tsx`)

```typescript
// Generated: YYYY-MM-DD HH:MM:SS KST

import { Skeleton } from '@/components/ui/skeleton';

/**
 * (main) Route Group 공통 로딩 UI
 *
 * 페이지 전환 시 사이드바/헤더는 유지되고,
 * 콘텐츠 영역만 이 스켈레톤으로 대체됨.
 *
 * 각 모듈에서 필요 시 모듈별 loading.tsx로 재정의 가능.
 *
 * PRD US-8, DT-9 참조
 */
export default function Loading() {
  return (
    <div className="space-y-6">
      {/* 페이지 제목 스켈레톤 */}
      <Skeleton className="h-8 w-48" />

      {/* 필터/액션 영역 스켈레톤 */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24 ml-auto" />
      </div>

      {/* 테이블 헤더 스켈레톤 */}
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />

        {/* 테이블 행 스켈레톤 (5행) */}
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>

      {/* 페이지네이션 스켈레톤 */}
      <div className="flex justify-center gap-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );
}
```

### 2. 반응형 Breakpoint 정리

| Breakpoint | CSS Query | 사이드바 | 헤더 |
|------------|-----------|---------|------|
| Desktop | 1280px+ | 고정, 확장 기본 | 전체 표시 |
| Tablet | 768px~1279px | 고정, 축소 기본 (확장 가능) | 전체 표시 |
| Small | < 768px | 숨김 (Sheet 오버레이) | 햄버거 메뉴 표시 |

**Tablet 기본 축소 동작** (2001_07 Sidebar에 추가할 수정사항):

```typescript
// Sidebar.tsx에 추가
const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1279px)');

// 첫 로드 시 Tablet이면 축소 상태로 시작 (localStorage에 저장된 값 없을 때)
useEffect(() => {
  if (isTablet && !localStorage.getItem('sidebar-state')) {
    useSidebarStore.setState({ isCollapsed: true });
  }
}, [isTablet]);
```

### 3. 키보드 단축키 엣지 케이스

MainShell (2001_06)의 키보드 핸들러에서 추가 고려사항:

```typescript
// 추가 비활성화 조건
function shouldIgnoreShortcut(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement;

  // input, textarea, contentEditable 포커스 시 비활성화
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return true;
  if (target.isContentEditable) return true;

  // Dialog/Modal 열려있을 때 비활성화 (optional)
  if (document.querySelector('[role="dialog"]')) return true;

  return false;
}
```

### 4. CLS 방지 전략

레이아웃 Shift를 방지하기 위한 CSS 조치:

```typescript
// MainShell.tsx의 사이드바 영역
<aside className={cn(
  'h-screen border-r bg-white flex flex-col',
  // 고정 너비로 CLS 방지 (transition은 시각적 효과만)
  'transition-[width] duration-200 ease-in-out',
  isCollapsed ? 'w-16' : 'w-64'
)}>
```

- `h-screen`: 사이드바 높이 고정
- 고정 `w-16` / `w-64`: 레이아웃 shift 없이 너비 전환
- `shrink-0` 암묵적 적용 (flex aside는 shrink하지 않음)

---

## Acceptance Criteria

- [ ] `(main)/loading.tsx`에 ERP 테이블 형태의 스켈레톤 UI 정의
- [ ] 페이지 전환 시 사이드바/헤더 유지, 콘텐츠만 스켈레톤 표시
- [ ] Skeleton 컴포넌트 (shadcn/ui) 사용
- [ ] CLS < 0.1 (레이아웃 shift 없음)
- [ ] 사이드바 width transition 200ms
- [ ] Dialog 열림 상태에서 단축키 비활성화
- [ ] `npm run build` 성공

---

## 테스트 전략

### 단위 테스트

**테스트 파일**: `src/__tests__/app/loading.test.tsx`

```typescript
describe('Loading', () => {
  it('should render skeleton elements', () => {
    render(<Loading />);
    const skeletons = screen.getAllByRole('generic');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render 5 table row skeletons', () => {
    render(<Loading />);
    // 5개 행 스켈레톤 확인
  });
});
```

### 검증 방법

1. `npm run dev`에서 페이지 전환 시 스켈레톤 표시 확인
2. Chrome DevTools Performance 탭에서 CLS 측정
3. Lighthouse에서 CLS < 0.1 확인
4. 사이드바 축소/확장 시 레이아웃 shift 없음 확인

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] 스켈레톤 UI 렌더링
- [ ] CLS < 0.1
- [ ] 반응형 breakpoint 동작
- [ ] 단축키 엣지 케이스 처리

---

**다음 문서**: 2001_11_Unit_Tests.md
