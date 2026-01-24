<!-- Generated: 2026-01-24 22:50:00 KST -->

# TeamCalendar 컴포넌트

**문서 번호**: 2011_16
**원본 PRD**: 2011_대시보드_및_일정관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'US-5', 'Section 5.5 Authorization' 참조
**구현 범위**: 팀 캘린더 (MANAGER/ADMIN 전용, 데스크톱 전용)
**복잡도**: L
**의존성**: 2011_09, 2011_10, 2011_11

---

## 구현 목표

MANAGER 이상 역할의 사용자가 부서원 전체의 업무 일정을 통합 조회하는 팀 캘린더 탭을 구현한다. 직원별 필터링, 색상 구분을 포함하며, 768px 미만에서는 데스크톱 전용 안내를 표시한다.

---

## 구현 내용

### 파일 구조

```
src/
└── components/
    └── features/
        └── dashboard/
            └── TeamCalendar.tsx    # 팀 캘린더 (MANAGER+)
```

### 구현 상세

**접근 제어:**
- `session.user.role === 'USER'` → 탭 자체를 숨김
- MANAGER: 부서 내 직원만 표시
- ADMIN: 전체 직원 표시

**레이아웃:**
- 직원 필터: Select 드롭다운 (전체 / 개별 직원)
- 월간 캘린더 그리드 (MonthView와 유사하지만 직원별 색상)
- 각 날짜 셀: 직원별 업무 건수 배지 (직원마다 다른 색상)

**직원별 색상 팔레트:**
```typescript
const employeeColors = [
  'bg-blue-200 text-blue-800',
  'bg-green-200 text-green-800',
  'bg-purple-200 text-purple-800',
  'bg-pink-200 text-pink-800',
  'bg-cyan-200 text-cyan-800',
  'bg-amber-200 text-amber-800',
  'bg-indigo-200 text-indigo-800',
  'bg-rose-200 text-rose-800',
];
```

**반응형:**
- 768px 미만: "팀 캘린더는 데스크톱에서 이용해주세요" 안내 표시
- 768px 이상: 정상 표시

**데이터 조회:**
- `useTeamTasksQuery(dateFrom, dateTo)` 훅 사용
- 직원별 그룹화된 응답을 캘린더에 매핑
- `selectedEmployeeFilter` (Zustand)로 특정 직원 필터링

### 핵심 인터페이스

```typescript
export function TeamCalendar() {
  const { selectedEmployeeFilter, setEmployeeFilter } = useCalendarStore();
  const searchParams = useSearchParams();
  const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const currentDate = new Date(dateStr);

  const { dateFrom, dateTo } = getMonthRange(currentDate);
  const { data, isLoading } = useTeamTasksQuery(dateFrom, dateTo);

  // 768px 미만 체크
  const isDesktop = useMediaQuery('(min-width: 768px)');
  if (!isDesktop) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-gray-500">팀 캘린더는 데스크톱에서 이용해주세요.</p>
      </Card>
    );
  }

  // 직원 목록 (API 응답에서 추출)
  const employees = data?.employees || [];
  const filteredEmployees = selectedEmployeeFilter
    ? employees.filter(e => e.employee_id === selectedEmployeeFilter)
    : employees;

  return (
    <div className="space-y-4">
      {/* 직원 필터 */}
      <div className="flex items-center gap-4">
        <Select
          value={selectedEmployeeFilter?.toString() || 'all'}
          onValueChange={(v) => setEmployeeFilter(v === 'all' ? null : Number(v))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="전체 직원" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 직원</SelectItem>
            {employees.map(emp => (
              <SelectItem key={emp.employee_id} value={emp.employee_id.toString()}>
                {emp.employee_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 팀 캘린더 그리드 */}
      <TeamMonthGrid
        date={currentDate}
        employees={filteredEmployees}
      />
    </div>
  );
}
```

---

## Acceptance Criteria

- [ ] TeamCalendar 컴포넌트 구현
- [ ] MANAGER/ADMIN만 접근 가능 (탭 표시 제어)
- [ ] 직원 필터 Select (전체/개별)
- [ ] 월간 그리드에 직원별 색상 배지
- [ ] useTeamTasksQuery 훅 연동
- [ ] selectedEmployeeFilter (Zustand) 연동
- [ ] 768px 미만: "데스크톱에서 이용해주세요" 안내
- [ ] 직원별 색상 팔레트 적용 (8색)
- [ ] 로딩/에러 상태 처리

---

## 테스트 전략

### 컴포넌트 테스트

```typescript
describe('TeamCalendar', () => {
  it('should show desktop-only message on mobile', () => {});
  it('should render employee filter select', () => {});
  it('should filter by selected employee', () => {});
  it('should render team month grid with employee badges', () => {});
  it('should apply different colors per employee', () => {});
  it('should call setEmployeeFilter on select change', () => {});
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] RBAC 접근 제어
- [ ] 직원 필터 + 색상 구분
- [ ] 반응형 (모바일 차단)
- [ ] TanStack Query + Zustand 연동
- [ ] 컴포넌트 테스트 통과

---

**다음 문서**: 2011_17_단위_테스트.md
