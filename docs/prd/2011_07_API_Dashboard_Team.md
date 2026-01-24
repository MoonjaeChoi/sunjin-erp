<!-- Generated: 2026-01-24 22:50:00 KST -->

# API Dashboard Team

**문서 번호**: 2011_07
**원본 PRD**: 2011_대시보드_및_일정관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.2', 'US-5' 참조
**구현 범위**: GET /api/dashboard/team — 팀 캘린더 데이터 (MANAGER 이상)
**복잡도**: S
**의존성**: 2011_01, 2011_02

---

## 구현 목표

MANAGER 이상 역할의 사용자가 부서원 전체의 업무 일정을 조회하는 API를 구현한다. 기간 내 전체 업무를 직원별로 그룹화하여 반환한다.

---

## 구현 내용

### 파일 구조

```
src/
└── app/
    └── api/
        └── dashboard/
            └── team/
                └── route.ts    # GET
```

### 구현 상세

**GET /api/dashboard/team**

| Query Param | Type | Required | Description |
|-------------|------|----------|-------------|
| date_from | string (ISO) | ✅ | 시작 날짜 |
| date_to | string (ISO) | ✅ | 종료 날짜 |
| employee_id | number | ❌ | 특정 직원 필터 |

**접근 권한:**
- USER: 403 (접근 불가)
- MANAGER: 본인 부서원만 조회
- ADMIN: 전체 직원 조회

**응답 구조:**
```typescript
interface TeamCalendarResponse {
  employees: TeamEmployeeData[];
}

interface TeamEmployeeData {
  employee_id: number;
  employee_name: string;
  tasks: TeamTaskItem[];
}

interface TeamTaskItem {
  id: number;
  title: string;
  task_date: string;
  start_time: number | null;
  end_time: number | null;
  task_type: TaskType;
  work_type: WorkType;
  status: TaskStatus;
}
```

### 핵심 인터페이스

```typescript
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // MANAGER 이상만 접근 가능
  if (session.user.role === 'USER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const employeeId = searchParams.get('employee_id');

  if (!dateFrom || !dateTo) {
    return NextResponse.json({ error: 'date_from and date_to are required' }, { status: 400 });
  }

  // 쿼리 구성 (IDX_TASK_EMPLOYEE_DATE 인덱스 활용)
  const queryBuilder = taskRepository
    .createQueryBuilder('task')
    .where('task.deleted_at IS NULL')
    .andWhere('task.task_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

  // MANAGER: 부서 내 직원만 (Phase 1 Employee 연동 후)
  // ADMIN: 전체
  if (employeeId) {
    queryBuilder.andWhere('task.employee_id = :employeeId', { employeeId });
  }

  queryBuilder.orderBy('task.employee_id', 'ASC').addOrderBy('task.task_date', 'ASC');

  const tasks = await queryBuilder.getMany();

  // 직원별 그룹화
  const grouped = groupByEmployee(tasks);
  return NextResponse.json({ employees: grouped });
}
```

---

## Acceptance Criteria

- [ ] GET /api/dashboard/team 구현
- [ ] USER 역할 접근 시 403 반환
- [ ] MANAGER: 부서 내 직원만 (Phase 1 후 활성화)
- [ ] ADMIN: 전체 직원
- [ ] date_from, date_to 필수 검증
- [ ] employee_id 선택 필터 동작
- [ ] 직원별 그룹화된 응답 구조
- [ ] soft delete 필터 적용
- [ ] `IDX_TASK_EMPLOYEE_DATE` 인덱스 활용 쿼리

---

## 테스트 전략

### 단위 테스트

```typescript
describe('GET /api/dashboard/team', () => {
  it('should return 403 for USER role', async () => {});
  it('should return 400 when date params missing', async () => {});
  it('should return grouped tasks by employee', async () => {});
  it('should filter by employee_id when provided', async () => {});
  it('should allow ADMIN to access all employees', async () => {});
  it('should exclude soft-deleted tasks', async () => {});
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] RBAC 접근 제어 (USER 차단)
- [ ] 직원별 그룹화 로직
- [ ] Soft delete 필터
- [ ] 단위 테스트 통과

---

**다음 문서**: 2011_08_TypeScript_타입_유틸리티.md
