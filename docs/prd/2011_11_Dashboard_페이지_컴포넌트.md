<!-- Generated: 2026-01-24 22:50:00 KST -->

# Dashboard 페이지 컴포넌트

**문서 번호**: 2011_11
**원본 PRD**: 2011_대시보드_및_일정관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.1', 'Section 6.2 Layout Structure' 참조
**구현 범위**: Dashboard page.tsx (SC) + CalendarHeader (CC) + Loading UI
**복잡도**: M
**의존성**: 2011_09, 2011_10

---

## 구현 목표

대시보드 메인 페이지를 Server Component로 구현하고, CalendarHeader(뷰 전환, 날짜 이동)를 Client Component로 분리한다. URL query param을 활용하여 뷰 모드와 날짜를 관리한다.

---

## 구현 내용

### 파일 구조

```
src/
├── app/
│   └── (main)/
│       └── dashboard/
│           ├── page.tsx          # SC: 메타데이터 + Calendar CC 렌더링
│           └── loading.tsx       # 로딩 스켈레톤
└── components/
    └── features/
        └── dashboard/
            ├── Calendar.tsx          # CC: 메인 캘린더 (뷰 분기)
            └── CalendarHeader.tsx    # CC: 뷰 전환 + 날짜 이동 컨트롤
```

### 구현 상세

**1. page.tsx (Server Component)**
- 메타데이터 설정 (title: "대시보드")
- `<Calendar />` Client Component 렌더링

**2. Calendar.tsx (Client Component)**
- URL에서 `view` (month/week/day)와 `date` 읽기 (`useSearchParams()`)
- 뷰에 따라 MonthView / WeekView / DayView 조건부 렌더링
- `useTasksQuery()` 호출 (현재 뷰의 날짜 범위 계산)
- DayDetailPanel 하단 표시 (selectedDate가 있을 때)

**3. CalendarHeader.tsx (Client Component)**
- 이전/오늘/다음 버튼 → URL date 업데이트 (`router.push`)
- 뷰 모드 전환 탭 (월/주/일) → URL view 업데이트
- 현재 날짜 표시 ("2026년 1월" 형식)

**4. loading.tsx**
- 캘린더 스켈레톤 UI (7x6 Grid 구조)

### 핵심 인터페이스

```typescript
// page.tsx (SC)
import type { Metadata } from 'next';
import { Calendar } from '@/components/features/dashboard/Calendar';

export const metadata: Metadata = { title: '대시보드 - Sunjin ERP' };

export default function DashboardPage() {
  return <Calendar />;
}
```

```typescript
// Calendar.tsx (CC)
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { CalendarHeader } from './CalendarHeader';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { DayDetailPanel } from './DayDetailPanel';
import { useTasksQuery } from '@/hooks/dashboard';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { CalendarView } from '@/types/dashboard';

export function Calendar() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const view = (searchParams.get('view') as CalendarView) || 'month';
  const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const currentDate = new Date(dateStr);

  const { selectedDate } = useCalendarStore();

  // 뷰에 따른 날짜 범위 계산
  const { dateFrom, dateTo } = getDateRange(view, currentDate);
  const { data, isLoading } = useTasksQuery({ date_from: dateFrom, date_to: dateTo });

  const updateUrl = (newView?: CalendarView, newDate?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newView) params.set('view', newView);
    if (newDate) params.set('date', newDate);
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <CalendarHeader
        view={view}
        currentDate={currentDate}
        onViewChange={(v) => updateUrl(v)}
        onDateChange={(d) => updateUrl(undefined, d)}
      />

      {view === 'month' && <MonthView date={currentDate} tasks={data?.tasks || []} />}
      {view === 'week' && <WeekView date={currentDate} tasks={data?.tasks || []} />}
      {view === 'day' && <DayView date={currentDate} tasks={data?.tasks || []} />}

      {selectedDate && <DayDetailPanel date={selectedDate} />}
    </div>
  );
}
```

```typescript
// CalendarHeader.tsx (CC)
'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarView } from '@/types/dashboard';

interface CalendarHeaderProps {
  view: CalendarView;
  currentDate: Date;
  onViewChange: (view: CalendarView) => void;
  onDateChange: (date: string) => void;
}

export function CalendarHeader({ view, currentDate, onViewChange, onDateChange }: CalendarHeaderProps) {
  const navigate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      onDateChange(new Date().toISOString().split('T')[0]);
      return;
    }
    const fn = direction === 'prev'
      ? (view === 'month' ? subMonths : view === 'week' ? subWeeks : subDays)
      : (view === 'month' ? addMonths : view === 'week' ? addWeeks : addDays);
    onDateChange(fn(currentDate, 1).toISOString().split('T')[0]);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('today')}>오늘</Button>
        <Button variant="outline" size="icon" onClick={() => navigate('next')}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold ml-4">
          {format(currentDate, view === 'month' ? 'yyyy년 M월' : 'yyyy년 M월 d일', { locale: ko })}
        </h2>
      </div>
      <Tabs value={view} onValueChange={(v) => onViewChange(v as CalendarView)}>
        <TabsList>
          <TabsTrigger value="month">월</TabsTrigger>
          <TabsTrigger value="week">주</TabsTrigger>
          <TabsTrigger value="day">일</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
```

---

## Acceptance Criteria

- [ ] `page.tsx` Server Component (metadata + Calendar CC)
- [ ] `Calendar.tsx` Client Component (뷰 분기 + 데이터 조회)
- [ ] `CalendarHeader.tsx` Client Component (뷰 전환 + 날짜 이동)
- [ ] `loading.tsx` 스켈레톤 UI
- [ ] URL query param = source of truth (`?view=month&date=2026-01-24`)
- [ ] 이전/오늘/다음 버튼 동작
- [ ] 뷰 전환 탭 (월/주/일) 동작
- [ ] 날짜 표시: 한글 형식 ("2026년 1월")
- [ ] `npm run type-check` 통과

---

## 테스트 전략

### 컴포넌트 테스트

```typescript
describe('CalendarHeader', () => {
  it('should display current date in Korean format', () => {});
  it('should call onViewChange when tab clicked', () => {});
  it('should call onDateChange with next month on next button', () => {});
  it('should call onDateChange with today on today button', () => {});
});

describe('Calendar', () => {
  it('should render MonthView by default', () => {});
  it('should render WeekView when view=week', () => {});
  it('should render DayView when view=day', () => {});
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] SC/CC 분리 패턴 준수
- [ ] URL 기반 상태 관리
- [ ] date-fns 한국어 로케일 적용
- [ ] 컴포넌트 테스트 통과

---

**다음 문서**: 2011_12_MonthView_컴포넌트.md
