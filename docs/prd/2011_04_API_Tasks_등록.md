<!-- Generated: 2026-01-24 22:50:00 KST -->

# API Tasks 등록

**문서 번호**: 2011_04
**원본 PRD**: 2011_대시보드_및_일정관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.2 API Route Handlers', 'US-2 업무 등록' 참조
**구현 범위**: POST /api/tasks — 업무 등록
**복잡도**: M
**의존성**: 2011_01, 2011_02

---

## 구현 목표

새 업무를 등록하는 API Route Handler를 구현한다. 필수/선택 필드 검증, Enum 값 검증, 시간 범위 검증, 인증 처리를 포함한다.

---

## 구현 내용

### 파일 구조

```
src/
└── app/
    └── api/
        └── tasks/
            └── route.ts    # GET + POST (이 파일에 추가)
```

### 구현 상세

**POST /api/tasks**

**Request Body:**
```typescript
interface CreateTaskDto {
  title: string;              // 필수, max 200자
  description?: string;       // 선택
  task_date: string;          // 필수, ISO date format
  start_time?: number;        // 선택, 0~1439
  end_time?: number;          // 선택, 0~1439
  task_type: TaskType;        // 필수, Enum
  work_type: WorkType;        // 필수, Enum
  status?: TaskStatus;        // 선택, 기본값 READY
  customer_id?: number;       // 선택
}
```

**검증 규칙:**
1. `title`: NOT NULL, 1~200자, XSS sanitize
2. `task_date`: 유효한 ISO 날짜
3. `task_type`: TaskType Enum 값만 허용
4. `work_type`: WorkType Enum 값만 허용
5. `status`: TaskStatus Enum 값만 허용 (미입력 시 READY)
6. `start_time`/`end_time`: 0~1439 범위, start < end
7. `customer_id`: 존재 시 Customer 테이블 확인 (Phase 1 후)

**응답:**
- 201: 생성된 Task 객체 반환
- 400: 검증 실패 (에러 메시지 포함)
- 401: 미인증
- 429: Rate limit 초과 (분당 30건)

### 핵심 인터페이스

```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: CreateTaskDto = await request.json();

  // Validation
  const errors = validateCreateTask(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
  }

  // Sanitize title (XSS 방지)
  const sanitizedTitle = sanitizeHtml(body.title);

  // Entity 생성
  const task = taskRepository.create({
    title: sanitizedTitle,
    description: body.description || null,
    task_date: new Date(body.task_date),
    start_time: body.start_time ?? null,
    end_time: body.end_time ?? null,
    task_type: body.task_type,
    work_type: body.work_type,
    status: body.status || TaskStatus.READY,
    employee_id: session.user.id,  // 등록자 = 현재 사용자
    customer_id: body.customer_id ?? null,
    completed_at: body.status === TaskStatus.DONE ? new Date() : null,
  });

  const saved = await taskRepository.save(task);
  return NextResponse.json(saved, { status: 201 });
}

function validateCreateTask(body: CreateTaskDto): string[] {
  const errors: string[] = [];
  if (!body.title || body.title.trim().length === 0) errors.push('title is required');
  if (body.title && body.title.length > 200) errors.push('title must be 200 chars or less');
  if (!body.task_date || isNaN(Date.parse(body.task_date))) errors.push('valid task_date is required');
  if (!Object.values(TaskType).includes(body.task_type)) errors.push('invalid task_type');
  if (!Object.values(WorkType).includes(body.work_type)) errors.push('invalid work_type');
  if (body.status && !Object.values(TaskStatus).includes(body.status)) errors.push('invalid status');
  if (body.start_time !== undefined && (body.start_time < 0 || body.start_time > 1439)) errors.push('start_time must be 0~1439');
  if (body.end_time !== undefined && (body.end_time < 0 || body.end_time > 1439)) errors.push('end_time must be 0~1439');
  if (body.start_time !== undefined && body.end_time !== undefined && body.start_time >= body.end_time) errors.push('start_time must be less than end_time');
  return errors;
}
```

---

## Acceptance Criteria

- [ ] `POST /api/tasks` Route Handler 구현
- [ ] 필수 필드 검증 (title, task_date, task_type, work_type)
- [ ] Enum 값 검증 (task_type, work_type, status)
- [ ] 시간 범위 검증 (0~1439, start < end)
- [ ] XSS sanitize 적용 (title)
- [ ] 인증 체크 (401)
- [ ] employee_id = session.user.id 자동 설정
- [ ] status DONE 시 completed_at 자동 설정
- [ ] 생성된 객체 201 반환
- [ ] `npm run type-check` 통과

---

## 테스트 전략

### 단위 테스트

**테스트 파일 위치**: `src/__tests__/api/tasks/route.test.ts`

```typescript
describe('POST /api/tasks', () => {
  it('should return 401 when not authenticated', async () => {});
  it('should return 400 when title is missing', async () => {});
  it('should return 400 when task_date is invalid', async () => {});
  it('should return 400 when task_type is invalid enum', async () => {});
  it('should return 400 when start_time > end_time', async () => {});
  it('should return 400 when start_time out of range', async () => {});
  it('should create task with default status READY', async () => {});
  it('should set completed_at when status is DONE', async () => {});
  it('should set employee_id from session', async () => {});
  it('should sanitize title for XSS', async () => {});
  it('should return 201 with created task', async () => {});
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] Input Validation 완성 (필수, Enum, 범위)
- [ ] XSS sanitize 적용
- [ ] 인증/인가 처리
- [ ] TypeORM parameterized query 사용
- [ ] 단위 테스트 통과

---

**다음 문서**: 2011_05_API_Tasks_상세_수정_삭제.md
