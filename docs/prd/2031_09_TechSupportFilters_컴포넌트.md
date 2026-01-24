<!-- Generated: 2026-01-25 05:10:00 KST -->

# TechSupportFilters 컴포넌트

**문서 번호**: 2031_09
**원본 PRD**: 2031_기술지원_관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 3 — US-5' 및 'Section 6.2 — Component Library' 참조
**구현 범위**: 검색 필터 UI (날짜, 고객사 Combobox, 유형, 방법, 상태, 키워드)
**복잡도**: M
**의존성**: 2031_06, 2031_07, 2031_08

---

## 구현 목표

기술지원 목록 검색을 위한 필터 컴포넌트를 구현한다. 날짜 범위, 고객사 Combobox, 지원 유형/방법/상태 Select, 키워드 검색을 제공한다.

---

## 구현 내용

### 파일 구조

```
src/components/features/support/
└── TechSupportFilters.tsx    # 검색 필터 컴포넌트
```

### 구현 상세

#### 필터 항목

| 필터 | UI 컴포넌트 | debounce | 동작 |
|------|-------------|----------|------|
| 날짜 범위 | Input[type=date] x2 | 300ms | date_from, date_to URL 업데이트 |
| 고객사 | Command (Combobox) | 없음 | customer_id URL 업데이트 |
| 지원 유형 | Select | 없음 | support_type URL 업데이트 |
| 지원 방법 | Select | 없음 | support_method URL 업데이트 |
| 상태 | Select | 없음 | status URL 업데이트 |
| 키워드 | Input[text] | 500ms | keyword URL 업데이트 (2자 이상) |

#### Combobox 고객사 선택

- `useCustomerListQuery()` 로 목록 fetch
- shadcn/ui `Command` 컴포넌트 사용
- 검색 입력 시 클라이언트 필터링 (고객사 수가 적으므로)
- 선택 시 `customer_id` URL 업데이트
- 선택 해제("전체") 시 `customer_id` 제거

#### Responsive Layout

- Desktop: 4열 grid
- Tablet: 2열 grid
- Mobile: 1열 stack

### 핵심 인터페이스

```typescript
interface TechSupportFiltersProps {
  params: TechSupportSearchParams;
  onUpdate: (partial: Partial<TechSupportSearchParams>) => void;
}

export function TechSupportFilters({ params, onUpdate }: TechSupportFiltersProps) {
  // 로컬 상태 (debounce용)
  const [keyword, setKeyword] = useState(params.keyword || '');
  const [dateFrom, setDateFrom] = useState(params.date_from);
  const [dateTo, setDateTo] = useState(params.date_to);

  // 고객사 목록
  const { data: customerData } = useCustomerListQuery();
  const customers = customerData?.customers || [];

  // Combobox 상태
  const [comboOpen, setComboOpen] = useState(false);

  // Debounce: keyword (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword.length >= 2 || keyword === '') {
        onUpdate({ keyword: keyword || undefined, page: 1 });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword]);

  // Debounce: 날짜 (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      onUpdate({ date_from: dateFrom, date_to: dateTo, page: 1 });
    }, 300);
    return () => clearTimeout(timer);
  }, [dateFrom, dateTo]);

  // 초기화
  const handleReset = () => { /* 모든 필터 초기값으로 */ };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      {/* 날짜 범위 */}
      {/* 고객사 Combobox */}
      {/* 지원 유형 Select */}
      {/* 지원 방법 Select */}
      {/* 상태 Select */}
      {/* 키워드 Input */}
      {/* 초기화 Button */}
    </div>
  );
}
```

---

## Acceptance Criteria

- [ ] 날짜 범위 필터 동작 (300ms debounce)
- [ ] 날짜 유효성: date_to >= date_from, 범위 ≤ 365일
- [ ] 고객사 Combobox: 목록 표시, 검색 필터링, 선택/해제
- [ ] 지원 유형 Select: 5개 옵션 + "전체"
- [ ] 지원 방법 Select: 3개 옵션 + "전체"
- [ ] 상태 Select: 3개 옵션 + "전체"
- [ ] 키워드 Input: 500ms debounce, 2자 이상만 전송
- [ ] 초기화 버튼: 모든 필터 기본값으로 복원
- [ ] 필터 변경 시 page=1로 리셋
- [ ] Responsive: 4열 → 2열 → 1열
- [ ] params 외부 변경 시 로컬 상태 동기화

---

## 테스트 전략

### 단위 테스트

**테스트 파일**: `src/__tests__/components/features/support/TechSupportFilters.test.tsx`

```typescript
describe('TechSupportFilters', () => {
  it('should render all filter inputs');
  it('should debounce keyword input (500ms)');
  it('should debounce date changes (300ms)');
  it('should not send keyword shorter than 2 chars');
  it('should render customer combobox with options');
  it('should call onUpdate with customer_id on select');
  it('should show date validation error for invalid range');
  it('should reset all filters');
  it('should sync with external params change');
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] Combobox 동작 확인
- [ ] Debounce 동작 확인
- [ ] Responsive 레이아웃 확인
- [ ] 날짜 유효성 검증

---

**다음 문서**: 2031_10_TechSupportDataTable_컴포넌트.md
