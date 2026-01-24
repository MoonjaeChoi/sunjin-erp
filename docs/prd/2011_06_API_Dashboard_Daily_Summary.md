<!-- Generated: 2026-01-24 22:50:00 KST -->

# API Dashboard Daily Summary

**문서 번호**: 2011_06
**원본 PRD**: 2011_대시보드_및_일정관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.2', 'US-4' 참조
**구현 범위**: GET /api/dashboard/daily-summary — 날짜별 통합 현황 (업무 + 기술지원)
**복잡도**: S
**의존성**: 2011_01, 2011_02

---

## 구현 목표

특정 날짜의 업무(Task) 목록과 기술지원(TechSupport) 건을 통합 조회하는 API를 구현한다. Phase 3 전까지 techSupports는 빈 배열로 반환한다.

---

## 구현 내용

### 파일 구조

```
src/
└── app/
    └── api/
        └── dashboard/
            └── daily-summary/
                └── route.ts    # GET
```

### 구현 상세

**GET /api/dashboard/daily-summary**

| Query Param | Type | Required | Description |
|-------------|------|----------|-------------|
| date | string (ISO) | ✅ | 조회할 날짜 |

**응답 구조:**
```typescript
interface DailySummaryResponse {
  date: string;
  tasks: TaskSummaryItem[];
  techSupports: TechSupportSummaryItem[];  // Phase 3 전까지 빈 배열
}

interface TaskSummaryItem {
  id: number;
  title: string;
  task_type: TaskType;
  work_type: WorkType;
  status: TaskStatus;
  start_time: number | null;
  end_time: number | null;
  customer_name: string | null;
}

interface TechSupportSummaryItem {
  id: number;
  title: string;
  customer_name: string;
  status: string;
  support_date: string;
}
```

**권한:**
- USER: 본인 업무만
- MANAGER: 부서 내 또는 특정 직원 (employee_id param)
- ADMIN: 전체

### 핵심 인터페이스

```typescript
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date || isNaN(Date.parse(date))) {
    return NextResponse.json({ error: 'valid date param is required' }, { status: 400 });
  }

  // Task 조회
  const tasks = await taskRepository.find({
    where: {
      task_date: new Date(date),
      employee_id: session.user.id,  // RBAC에 따라 조건 변경
      deleted_at: IsNull(),
    },
    order: { start_time: 'ASC' },
  });

  // TechSupport 조회 (Phase 3 전까지 빈 배열)
  const techSupports: TechSupportSummaryItem[] = [];

  return NextResponse.json({
    date,
    tasks: tasks.map(mapToTaskSummary),
    techSupports,
  });
}
```

---

## Acceptance Criteria

- [ ] GET /api/dashboard/daily-summary 구현
- [ ] date 파라미터 필수 검증
- [ ] Task 조회: 해당 날짜 + RBAC 필터 + soft delete 제외
- [ ] techSupports: 빈 배열 반환 (Phase 3 전)
- [ ] 응답 구조: `{ date, tasks, techSupports }` 형태
- [ ] tasks 정렬: start_time ASC
- [ ] 인증 체크 (401)

---

## 테스트 전략

### 단위 테스트

```typescript
describe('GET /api/dashboard/daily-summary', () => {
  it('should return 400 when date is missing', async () => {});
  it('should return tasks for the given date', async () => {});
  it('should return empty techSupports array', async () => {});
  it('should exclude soft-deleted tasks', async () => {});
  it('should order tasks by start_time ASC', async () => {});
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] 인증/인가 처리
- [ ] Soft delete 필터
- [ ] techSupports 빈 배열 (향후 Phase 3에서 구현)
- [ ] 단위 테스트 통과

---

**다음 문서**: 2011_07_API_Dashboard_Team.md
