<!-- Generated: 2026-01-25 KST -->

# ProjectFilters 컴포넌트

**문서 번호**: 2041_12
**원본 PRD**: 2041_프로젝트_관리_prd_v2.md
**구현 범위**: ProjectFilters 컴포넌트 - 고객사/상태/담당자/키워드 복합 필터 UI
**복잡도**: M
**의존성**: 2041_11

---

## 구현 목표

프로젝트 목록의 검색/필터링 UI를 구현한다. 고객사 Combobox, 상태 멀티셀렉트, 담당자 셀렉트, 키워드 검색 입력을 제공하며, 각 필터는 debounce를 적용하여 불필요한 API 호출을 방지한다.

---

## 구현 내용

### 파일 구조

```
src/components/features/projects/
└── ProjectFilters.tsx          # 필터 컴포넌트
```

### 구현 상세

#### 1. 컴포넌트 정의

```typescript
// src/components/features/projects/ProjectFilters.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, RotateCcw } from 'lucide-react';
import { useEmployeeListQuery } from '@/hooks/employees';
import { useCustomerListQuery } from '@/hooks/customers';
import { ProjectSearchParams, ProjectStatus, ProjectStatusLabel } from '@/types/project';
import { useDebouncedCallback } from '@/hooks/useDebounce'; // 또는 직접 구현

interface ProjectFiltersProps {
  params: ProjectSearchParams;
  onUpdate: (params: Partial<ProjectSearchParams>) => void;
}
```

#### 2. 내부 상태 및 Debounce

```typescript
export function ProjectFilters({ params, onUpdate }: ProjectFiltersProps) {
  // 키워드 입력 로컬 상태 (debounce 적용을 위해 분리)
  const [keyword, setKeyword] = useState(params.keyword || '');

  // Employee, Customer 목록 조회
  const { data: employeesData } = useEmployeeListQuery();
  const { data: customersData } = useCustomerListQuery();

  // 키워드 debounce (500ms)
  const debouncedKeywordUpdate = useDebouncedCallback((value: string) => {
    // 2자 이상일 때만 검색, 빈 문자열은 필터 해제
    if (value.length >= 2 || value.length === 0) {
      onUpdate({ keyword: value || undefined });
    }
  }, 500);

  // 필터 변경 debounce (300ms) - 고객사/상태/담당자
  const debouncedFilterUpdate = useDebouncedCallback((filterParams: Partial<ProjectSearchParams>) => {
    onUpdate(filterParams);
  }, 300);

  // 키워드 입력 핸들러
  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setKeyword(value);
    debouncedKeywordUpdate(value);
  };

  // params.keyword 외부 변경 시 동기화 (리셋 등)
  useEffect(() => {
    setKeyword(params.keyword || '');
  }, [params.keyword]);
}
```

#### 3. 고객사 Combobox

```tsx
// 고객사 필터 (Combobox 패턴)
const [customerOpen, setCustomerOpen] = useState(false);

<Popover open={customerOpen} onOpenChange={setCustomerOpen}>
  <PopoverTrigger asChild>
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={customerOpen}
      className="w-[200px] justify-between"
    >
      {params.customer_id
        ? customersData?.customers.find((c) => c.id === params.customer_id)?.name || '고객사'
        : '고객사 선택'}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-[200px] p-0">
    <Command>
      <CommandInput placeholder="고객사 검색..." />
      <CommandEmpty>검색 결과 없음</CommandEmpty>
      <CommandGroup>
        {customersData?.customers.map((customer) => (
          <CommandItem
            key={customer.id}
            value={customer.name}
            onSelect={() => {
              debouncedFilterUpdate({
                customer_id: params.customer_id === customer.id ? undefined : customer.id,
              });
              setCustomerOpen(false);
            }}
          >
            {customer.name}
          </CommandItem>
        ))}
      </CommandGroup>
    </Command>
  </PopoverContent>
</Popover>
```

#### 4. 상태 멀티셀렉트

```tsx
// 상태 필터 (복수 선택 가능)
const [statusOpen, setStatusOpen] = useState(false);
const allStatuses: ProjectStatus[] = ['PREPARING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'];

const handleStatusToggle = (status: ProjectStatus) => {
  const currentStatuses = params.status || [];
  const newStatuses = currentStatuses.includes(status)
    ? currentStatuses.filter((s) => s !== status)
    : [...currentStatuses, status];
  debouncedFilterUpdate({ status: newStatuses.length > 0 ? newStatuses : undefined });
};

<Popover open={statusOpen} onOpenChange={setStatusOpen}>
  <PopoverTrigger asChild>
    <Button variant="outline" className="w-[160px] justify-between">
      {params.status?.length
        ? `상태 (${params.status.length})`
        : '상태 선택'}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-[180px] p-2">
    <div className="space-y-2">
      {allStatuses.map((status) => (
        <label key={status} className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={params.status?.includes(status) || false}
            onCheckedChange={() => handleStatusToggle(status)}
          />
          <span className="text-sm">{ProjectStatusLabel[status]}</span>
        </label>
      ))}
    </div>
  </PopoverContent>
</Popover>
```

#### 5. 담당자 Select

```tsx
// 담당자 필터
<Select
  value={params.employee_id ? String(params.employee_id) : 'all'}
  onValueChange={(value) => {
    debouncedFilterUpdate({
      employee_id: value === 'all' ? undefined : Number(value),
    });
  }}
>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="담당자 선택" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">전체 담당자</SelectItem>
    {employeesData?.employees.map((emp) => (
      <SelectItem key={emp.id} value={String(emp.id)}>
        {emp.name} ({emp.department_name})
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### 6. 키워드 검색

```tsx
// 키워드 입력 (debounce 500ms, 2자 이상)
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input
    placeholder="프로젝트명, 코드 검색 (2자 이상)"
    value={keyword}
    onChange={handleKeywordChange}
    className="pl-9 w-[250px]"
  />
</div>
```

#### 7. 리셋 버튼

```tsx
// 필터 초기화
const handleReset = () => {
  setKeyword('');
  onUpdate({
    customer_id: undefined,
    status: undefined,
    employee_id: undefined,
    keyword: undefined,
  });
};

// 필터가 하나라도 활성인지 확인
const hasActiveFilter = params.customer_id || params.status?.length || params.employee_id || params.keyword;

<Button
  variant="ghost"
  size="sm"
  onClick={handleReset}
  disabled={!hasActiveFilter}
  className="gap-1"
>
  <RotateCcw className="h-4 w-4" />
  초기화
</Button>
```

#### 8. 전체 레이아웃

```tsx
return (
  <div className="flex flex-wrap items-center gap-3">
    {/* 고객사 Combobox */}
    {/* 상태 멀티셀렉트 */}
    {/* 담당자 Select */}
    {/* 키워드 검색 */}
    {/* 리셋 버튼 */}
  </div>
);
```

#### 9. useDebouncedCallback 구현 (없는 경우)

```typescript
// src/hooks/useDebounce.ts (이미 존재하지 않는 경우 생성)
import { useRef, useCallback } from 'react';

export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: any[]) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    }) as T,
    [callback, delay]
  );
}
```

### 핵심 인터페이스

```typescript
// Props
interface ProjectFiltersProps {
  params: ProjectSearchParams;
  onUpdate: (params: Partial<ProjectSearchParams>) => void;
}

// Debounce 설정
const KEYWORD_DEBOUNCE_MS = 500;
const FILTER_DEBOUNCE_MS = 300;
const KEYWORD_MIN_LENGTH = 2;

// 의존 데이터
// - useCustomerListQuery() → 고객사 목록
// - useEmployeeListQuery() → 담당자 목록
```

---

## Acceptance Criteria

- [ ] ProjectFilters 컴포넌트가 정상 렌더링된다
- [ ] 고객사 Combobox가 검색 가능한 드롭다운으로 동작한다
- [ ] 고객사 선택/해제 시 onUpdate가 customer_id와 함께 호출된다
- [ ] 상태 필터가 복수 선택을 지원한다 (체크박스 기반)
- [ ] 상태 선택 변경 시 onUpdate가 status 배열과 함께 호출된다
- [ ] 담당자 Select가 Employee 목록을 표시한다 (이름 + 부서명)
- [ ] 담당자 선택/해제 시 onUpdate가 employee_id와 함께 호출된다
- [ ] 키워드 입력이 500ms debounce로 동작한다
- [ ] 키워드가 2자 미만일 때 검색이 실행되지 않는다 (빈 문자열은 필터 해제)
- [ ] 고객사/상태/담당자 필터 변경이 300ms debounce로 동작한다
- [ ] onUpdate 호출 시 page가 1로 리셋된다 (부모 컴포넌트에서 처리)
- [ ] 초기화 버튼 클릭 시 모든 필터가 해제된다
- [ ] 초기화 버튼은 활성 필터가 없을 때 비활성화된다
- [ ] 외부에서 params.keyword가 변경되면 Input 값이 동기화된다

---

## 테스트 전략

**단위 테스트:**
- 고객사 Combobox: 검색 입력 → 필터링된 목록 표시
- 고객사 선택: onUpdate 콜백에 customer_id 전달 확인
- 상태 멀티셀렉트: 체크박스 토글 → status 배열 업데이트 확인
- 담당자 Select: 선택 시 onUpdate에 employee_id 전달 확인
- 키워드 입력: debounce 동작 확인 (500ms 이전 호출 없음)
- 키워드 검증: 1자 입력 시 onUpdate 미호출, 2자 이상 시 호출
- 초기화: 모든 필터 파라미터가 undefined로 리셋됨 확인
- 초기화 버튼 disabled 상태: 필터 없을 때 비활성

**통합 테스트:**
- 필터 조합: 고객사 + 상태 + 키워드 복합 필터 동작
- debounce: 빠른 연속 입력 시 마지막 값만 전달됨
- 외부 리셋: params 변경 시 UI 동기화

---

**다음 문서**: 2041_13_ProjectDataTable_컴포넌트.md
