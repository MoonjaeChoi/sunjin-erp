<!-- Generated: 2026-01-25 05:10:00 KST -->

# TechSupportDataTable 컴포넌트

**문서 번호**: 2031_10
**원본 PRD**: 2031_기술지원_관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 6.4 — 테이블 열 구성' 및 'Section 6.5 — Badge Color Map' 참조
**구현 범위**: 데이터 테이블 (정렬, 페이지네이션, Badge, 반응형 열 숨김)
**복잡도**: M
**의존성**: 2031_06, 2031_08

---

## 구현 목표

기술지원 목록을 표시하는 데이터 테이블을 구현한다. 정렬, 페이지네이션, Badge 표시, 반응형 열 숨김, 행 클릭 상세 보기를 포함한다.

---

## 구현 내용

### 파일 구조

```
src/components/features/support/
└── TechSupportDataTable.tsx    # 데이터 테이블 컴포넌트
```

### 구현 상세

#### 열 구성 (PRD Section 6.4)

| 열 | Key | Mobile | Tablet | Desktop | 정렬 가능 |
|----|-----|--------|--------|---------|-----------|
| 지원일 | support_date | ○ | ○ | ○ | ○ |
| 제목 | title | ○ | ○ | ○ | ○ |
| 고객사 | customer_name | × | ○ | ○ | × |
| 지원 유형 | support_type | × | × | ○ | × |
| 지원 방법 | support_method | × | × | ○ | × |
| 상태 | status | ○ | ○ | ○ | ○ |
| 담당자 | employee_name | × | × | ○ | × |

#### 기능 목록

- **정렬**: 헤더 클릭으로 sort_by/sort_order 토글
- **페이지네이션**: 페이지 버튼 + 이전/다음 + 건수 표시
- **Badge**: SupportType, SupportMethod, SupportStatus에 색상 Badge
- **시간 표시**: start_time/end_time → "HH:MM~HH:MM" 포맷
- **행 클릭**: `onUpdate({ detail: id })` 호출
- **빈 상태**: "검색 조건에 맞는 기술지원 건이 없습니다."
- **로딩**: Skeleton rows
- **Placeholder overlay**: isPlaceholderData일 때 opacity overlay

### 핵심 인터페이스

```typescript
interface TechSupportDataTableProps {
  data: TechSupportSearchResponse | undefined;
  isLoading: boolean;
  isPlaceholderData: boolean;
  params: TechSupportSearchParams;
  onUpdate: (partial: Partial<TechSupportSearchParams> & { detail?: number }) => void;
}

export function TechSupportDataTable({
  data, isLoading, isPlaceholderData, params, onUpdate
}: TechSupportDataTableProps) {
  // 시간 포맷 함수
  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const formatTimeRange = (start: number | null, end: number | null) => {
    if (start === null || end === null) return '-';
    return `${formatTime(start)}~${formatTime(end)}`;
  };

  // 정렬 핸들러
  const handleSort = (column: string) => {
    if (params.sort_by === column) {
      onUpdate({ sort_order: params.sort_order === 'ASC' ? 'DESC' : 'ASC', page: 1 });
    } else {
      onUpdate({ sort_by: column, sort_order: 'DESC', page: 1 });
    }
  };

  // 페이지 변경
  const handlePage = (page: number) => onUpdate({ page });

  // 행 클릭
  const handleRowClick = (id: number) => onUpdate({ detail: id });

  // ...렌더링
}
```

---

## Acceptance Criteria

- [ ] 7개 열 표시 (반응형 숨김 적용)
- [ ] support_date, title, status 열 정렬 동작
- [ ] 정렬 방향 표시 (ArrowUp/ArrowDown 아이콘)
- [ ] 페이지네이션 동작 (페이지 버튼, 이전/다음)
- [ ] 총 건수 표시
- [ ] Badge 색상 적용 (SupportType, SupportMethod, SupportStatus)
- [ ] 시간 범위 포맷 (HH:MM~HH:MM 또는 "-")
- [ ] 행 클릭 시 detail Dialog 열기
- [ ] 빈 상태 메시지 표시
- [ ] 로딩 시 Skeleton 표시
- [ ] isPlaceholderData 시 overlay 표시
- [ ] Responsive: Desktop 7열, Tablet 4열, Mobile 3열

---

## 테스트 전략

### 단위 테스트

**테스트 파일**: `src/__tests__/components/features/support/TechSupportDataTable.test.tsx`

```typescript
describe('TechSupportDataTable', () => {
  it('should render skeleton when loading');
  it('should render empty message when no data');
  it('should render support records with badges');
  it('should format time range correctly');
  it('should show dash for null time');
  it('should display total count');
  it('should call onUpdate with detail id on row click');
  it('should toggle sort order on active column click');
  it('should set new sort column on different column click');
  it('should render pagination buttons');
  it('should disable prev on first page');
  it('should disable next on last page');
  it('should render placeholder overlay');
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] Badge 색상 정확성
- [ ] 정렬/페이지네이션 동작
- [ ] Responsive 열 숨김 확인
- [ ] TaskDataTable 패턴 일관성

---

**다음 문서**: 2031_11_TechSupportCreateDialog_컴포넌트.md
