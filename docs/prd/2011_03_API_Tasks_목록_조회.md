<!-- Generated: 2026-01-24 22:50:00 KST -->

# API Tasks 목록 조회

**문서 번호**: 2011_03
**원본 PRD**: 2011_대시보드_및_일정관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.2 API Route Handlers' 참조
**구현 범위**: GET /api/tasks — 업무 목록 조회 (필터링, 기간 검색)
**복잡도**: M
**의존성**: 2011_01, 2011_02

---

## 구현 목표

기간별 업무 목록을 조회하는 API Route Handler를 구현한다. 날짜 범위, 직원, 업무 유형, 상태별 필터링을 지원하며, 인증된 사용자만 접근 가능하다.

---

## 구현 내용

### 파일 구조

```
src/
└── app/
    └── api/
        └── tasks/
            └── route.ts    # GET (목록) + POST (생성)
```

### 구현 상세

**GET /api/tasks**

| Query Param | Type | Required | Description |
|-------------|------|----------|-------------|
| date_from | string (ISO) | ✅ | 시작 날짜 |
| date_to | string (ISO) | ✅ | 종료 날짜 |
| employee_id | number | ❌ | 직원 ID (팀 캘린더용) |
| type | TaskType | ❌ | 업무 유형 필터 |
| status | TaskStatus | ❌ | 상태 필터 |

**응답 구조:**
```typescript
interface TaskListResponse {
  tasks: TaskListItem[];
  total: number;
}

interface TaskListItem {
  id: number;
  title: string;
  task_date: string;        // ISO date
  start_time: number | null;
  end_time: number | null;
  task_type: TaskType;
  work_type: WorkType;
  status: TaskStatus;
  employee_id: number;
  employee_name: string;    // JOIN
  customer_id: number | null;
  customer_name: string | null; // JOIN
  completed_at: string | null;
}
```

**권한 처리:**
- USER: 본인 업무만 조회 (employee_id === session.user.id)
- MANAGER: 부서 내 전체 조회 (department_id 기반)
- ADMIN: 전체 조회

**쿼리 조건:**
- `WHERE deleted_at IS NULL` (soft delete 필터 필수)
- `AND task_date BETWEEN :date_from AND :date_to`
- 추가 필터: employee_id, task_type, status

### 핵심 인터페이스

```typescript
// GET /api/tasks handler
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const employeeId = searchParams.get('employee_id');
  const type = searchParams.get('type');
  const status = searchParams.get('status');

  // Validation
  if (!dateFrom || !dateTo) {
    return NextResponse.json({ error: 'date_from and date_to are required' }, { status: 400 });
  }

  // 권한 기반 쿼리 조건 구성
  const queryBuilder = taskRepository
    .createQueryBuilder('task')
    .where('task.deleted_at IS NULL')
    .andWhere('task.task_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

  // RBAC 필터링
  if (session.user.role === 'USER') {
    queryBuilder.andWhere('task.employee_id = :userId', { userId: session.user.id });
  } else if (session.user.role === 'MANAGER') {
    // 부서 내 직원만 (employee_id IN (부서원 IDs))
    // Phase 1 완료 후 구현
  }

  // 추가 필터
  if (employeeId) queryBuilder.andWhere('task.employee_id = :employeeId', { employeeId });
  if (type) queryBuilder.andWhere('task.task_type = :type', { type });
  if (status) queryBuilder.andWhere('task.status = :status', { status });

  queryBuilder.orderBy('task.task_date', 'ASC').addOrderBy('task.start_time', 'ASC');

  const [tasks, total] = await queryBuilder.getManyAndCount();
  return NextResponse.json({ tasks, total });
}
```

---

## Acceptance Criteria

- [ ] `GET /api/tasks` Route Handler 구현
- [ ] date_from, date_to 필수 파라미터 검증 (400 반환)
- [ ] 인증 체크 (401 반환)
- [ ] RBAC 필터링 (USER: 본인만, MANAGER: 부서 내, ADMIN: 전체)
- [ ] soft delete 필터 (`deleted_at IS NULL`)
- [ ] 선택 필터 동작 (employee_id, type, status)
- [ ] 결과 정렬: task_date ASC, start_time ASC
- [ ] `npm run type-check` 통과

---

## 테스트 전략

### 단위 테스트

**테스트 파일 위치**: `src/__tests__/api/tasks/route.test.ts`

```typescript
describe('GET /api/tasks', () => {
  it('should return 401 when not authenticated', async () => {});
  it('should return 400 when date_from or date_to missing', async () => {});
  it('should return tasks within date range', async () => {});
  it('should filter by task_type', async () => {});
  it('should filter by status', async () => {});
  it('should exclude soft-deleted tasks', async () => {});
  it('should only return own tasks for USER role', async () => {});
  it('should return department tasks for MANAGER role', async () => {});
  it('should return all tasks for ADMIN role', async () => {});
  it('should order by task_date ASC, start_time ASC', async () => {});
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] 인증/인가 처리 완료
- [ ] Input Validation 구현
- [ ] Soft delete 필터 적용
- [ ] TypeORM parameterized query 사용 (SQL Injection 방지)
- [ ] 단위 테스트 통과

---

**다음 문서**: 2011_04_API_Tasks_등록.md
