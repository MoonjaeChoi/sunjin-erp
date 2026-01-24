<!-- Generated: 2026-01-25 KST -->

# ProjectDataTable 컴포넌트

**문서 번호**: 2041_13
**원본 PRD**: 2041_프로젝트_관리_prd_v2.md
**구현 범위**: 프로젝트 목록 데이터 테이블 (정렬, 페이지네이션, Badge, 행 클릭)
**복잡도**: M
**의존성**: 2041_11

---

## 구현 목표

프로젝트 목록을 표시하는 데이터 테이블을 구현한다. 정렬 가능한 열 헤더, 상태별 색상 Badge, 페이지네이션, 행 클릭 상세 보기를 포함한다.

---

## 구현 내용

### 파일 구조

```
src/components/features/projects/
└── ProjectDataTable.tsx    # 프로젝트 목록 테이블 컴포넌트
```

### 구현 상세

#### 열 구성

| 열 | Key | 정렬 가능 | 표시 규칙 |
|----|-----|-----------|-----------|
| 프로젝트 코드 | project_code | O | NULL이면 "-" 표시 |
| 프로젝트명 | project_name | O | - |
| 고객사 | customer_name | X | customer 관계에서 조회 |
| 상태 | status | O | 색상 Badge |
| 담당자 | employee_name | X | employee 관계에서 조회 |
| 계약 기간 | start_date ~ end_date | O (start_date 기준) | 둘 다 NULL이면 "-", 하나만 있으면 해당 날짜만 표시 |

#### 상태 Badge 색상 (PRD Section 6.4)

| 상태 | 한글 | Tailwind 클래스 |
|------|------|----------------|
| PREPARING | 준비 | `bg-blue-100 text-blue-800` |
| IN_PROGRESS | 진행중 | `bg-amber-100 text-amber-800` |
| COMPLETED | 완료 | `bg-green-100 text-green-800` |
| ON_HOLD | 보류 | `bg-gray-100 text-gray-800` |

#### 기능 목록

- **정렬**: 헤더 클릭으로 sortBy/sortOrder 토글 (ASC ↔ DESC)
- **정렬 표시**: 현재 정렬 열에 ArrowUp/ArrowDown 아이콘
- **페이지네이션**: 이전/다음 버튼 + 페이지 번호 버튼 + 총 건수 표시
- **행 클릭**: `onRowClick(projectId)` 호출하여 상세 Dialog 열기
- **빈 상태**: "검색 조건에 맞는 프로젝트가 없습니다." 메시지 표시
- **날짜 포맷**: `YYYY-MM-DD ~ YYYY-MM-DD` 형식

### 핵심 인터페이스

```typescript
interface ProjectDataTableProps {
  projects: ProjectListItem[];
  total: number;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string, sortOrder: 'ASC' | 'DESC') => void;
  onRowClick: (projectId: number) => void;
}

export function ProjectDataTable({
  projects,
  total,
  page,
  pageSize,
  sortBy,
  sortOrder,
  onPageChange,
  onSortChange,
  onRowClick,
}: ProjectDataTableProps) {
  // 정렬 핸들러
  const handleSort = (column: string) => {
    if (sortBy === column) {
      onSortChange(column, sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      onSortChange(column, 'DESC');
    }
  };

  // 총 페이지 수
  const totalPages = Math.ceil(total / pageSize);

  // 계약 기간 포맷
  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate && !endDate) return '-';
    if (startDate && endDate) return `${startDate} ~ ${endDate}`;
    return startDate || endDate || '-';
  };

  // 상태 Badge
  const getStatusBadge = (status: ProjectStatus) => {
    const map: Record<ProjectStatus, { label: string; className: string }> = {
      PREPARING: { label: '준비', className: 'bg-blue-100 text-blue-800' },
      IN_PROGRESS: { label: '진행중', className: 'bg-amber-100 text-amber-800' },
      COMPLETED: { label: '완료', className: 'bg-green-100 text-green-800' },
      ON_HOLD: { label: '보류', className: 'bg-gray-100 text-gray-800' },
    };
    return map[status];
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => handleSort('project_code')} className="cursor-pointer">
              프로젝트 코드 {sortBy === 'project_code' && (sortOrder === 'ASC' ? <ArrowUp /> : <ArrowDown />)}
            </TableHead>
            <TableHead onClick={() => handleSort('project_name')} className="cursor-pointer">
              프로젝트명 {/* sort indicator */}
            </TableHead>
            <TableHead>고객사</TableHead>
            <TableHead onClick={() => handleSort('status')} className="cursor-pointer">
              상태 {/* sort indicator */}
            </TableHead>
            <TableHead>담당자</TableHead>
            <TableHead onClick={() => handleSort('start_date')} className="cursor-pointer">
              계약 기간 {/* sort indicator */}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                검색 조건에 맞는 프로젝트가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            projects.map((project) => (
              <TableRow key={project.id} onClick={() => onRowClick(project.id)} className="cursor-pointer hover:bg-muted/50">
                <TableCell>{project.project_code || '-'}</TableCell>
                <TableCell>{project.project_name}</TableCell>
                <TableCell>{project.customer_name}</TableCell>
                <TableCell>
                  <Badge className={getStatusBadge(project.status).className}>
                    {getStatusBadge(project.status).label}
                  </Badge>
                </TableCell>
                <TableCell>{project.employee_name}</TableCell>
                <TableCell>{formatDateRange(project.start_date, project.end_date)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-muted-foreground">총 {total}건</span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
            이전
          </Button>
          {/* 페이지 번호 버튼 */}
          <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
            다음
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## Acceptance Criteria

- [ ] 6개 열 표시 (프로젝트 코드, 프로젝트명, 고객사, 상태, 담당자, 계약 기간)
- [ ] project_code NULL일 때 "-" 표시
- [ ] 상태 Badge 4종 색상 정확 적용 (blue, amber, green, gray)
- [ ] project_code, project_name, status, start_date 열 정렬 동작
- [ ] 정렬 방향 아이콘 표시 (ArrowUp/ArrowDown)
- [ ] 페이지네이션 동작 (이전/다음 + 페이지 번호)
- [ ] 첫 페이지에서 이전 버튼 disabled
- [ ] 마지막 페이지에서 다음 버튼 disabled
- [ ] 총 건수 표시
- [ ] 행 클릭 시 onRowClick 호출
- [ ] 빈 상태 메시지 표시 ("검색 조건에 맞는 프로젝트가 없습니다.")
- [ ] 계약 기간: 둘 다 NULL이면 "-", 하나만 있으면 해당 날짜만 표시

---

## 테스트 전략

### 단위 테스트

**테스트 파일**: `src/__tests__/components/features/projects/ProjectDataTable.test.tsx`

```typescript
describe('ProjectDataTable', () => {
  it('should render empty message when no projects');
  it('should render project rows with correct data');
  it('should show "-" for null project_code');
  it('should display correct status badge colors');
  it('should format date range correctly');
  it('should show "-" when both dates are null');
  it('should call onRowClick with project id on row click');
  it('should toggle sort order on active column click');
  it('should set new sort column on different column click');
  it('should render pagination with total count');
  it('should disable prev button on first page');
  it('should disable next button on last page');
  it('should call onPageChange on page button click');
});
```

---

**다음 문서**: 2041_14_ProjectCreateDialog_컴포넌트.md
