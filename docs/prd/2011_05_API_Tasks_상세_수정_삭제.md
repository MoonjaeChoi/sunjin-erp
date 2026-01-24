<!-- Generated: 2026-01-24 22:50:00 KST -->

# API Tasks 상세/수정/삭제

**문서 번호**: 2011_05
**원본 PRD**: 2011_대시보드_및_일정관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.2', 'US-3', 'US-6' 참조
**구현 범위**: GET/PUT/DELETE /api/tasks/[id]
**복잡도**: M
**의존성**: 2011_01, 2011_02

---

## 구현 목표

업무 상세 조회, 수정, 삭제 API Route Handler를 구현한다. 수정 시 `completed_at` 자동 처리, 삭제 시 soft delete를 적용하며, 권한(본인/ADMIN)을 검증한다.

---

## 구현 내용

### 파일 구조

```
src/
└── app/
    └── api/
        └── tasks/
            └── [id]/
                └── route.ts    # GET, PUT, DELETE
```

### 구현 상세

**GET /api/tasks/[id]** — 업무 상세 조회
- 인증 필수
- `deleted_at IS NULL` 확인
- 본인 업무 또는 MANAGER(부서 내) 또는 ADMIN만 조회 가능
- 404: 존재하지 않거나 삭제된 업무

**PUT /api/tasks/[id]** — 업무 수정
- 본인 업무만 수정 가능 (ADMIN은 모든 업무 수정 가능)
- `completed_at` 자동 처리:
  - status → DONE: `completed_at = new Date()` (서버 시간)
  - status → 다른 값: `completed_at = null`
- 클라이언트에서 `completed_at` 필드 직접 수정 불가
- `updated_at` 자동 갱신

**DELETE /api/tasks/[id]** — 업무 삭제 (soft delete)
- 본인 업무만 삭제 가능 (ADMIN은 모든 업무 삭제 가능)
- `deleted_at = new Date()` 설정 (physical delete 금지)
- 200: 삭제 성공

### 핵심 인터페이스

```typescript
interface UpdateTaskDto {
  title?: string;
  description?: string;
  task_date?: string;
  start_time?: number | null;
  end_time?: number | null;
  task_type?: TaskType;
  work_type?: WorkType;
  status?: TaskStatus;
  customer_id?: number | null;
}

// GET /api/tasks/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const task = await taskRepository.findOne({
    where: { id: Number(params.id), deleted_at: IsNull() },
  });

  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  // 권한 확인
  if (session.user.role === 'USER' && task.employee_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(task);
}

// PUT /api/tasks/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const task = await taskRepository.findOne({
    where: { id: Number(params.id), deleted_at: IsNull() },
  });

  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  // 권한: 본인 또는 ADMIN
  if (session.user.role !== 'ADMIN' && task.employee_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body: UpdateTaskDto = await request.json();
  const errors = validateUpdateTask(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
  }

  // completed_at 자동 처리
  if (body.status === TaskStatus.DONE && task.status !== TaskStatus.DONE) {
    task.completed_at = new Date();
  }
  if (body.status && body.status !== TaskStatus.DONE) {
    task.completed_at = null;
  }

  // completed_at은 클라이언트에서 직접 수정 불가 (무시)
  Object.assign(task, { ...body, completed_at: task.completed_at });

  const updated = await taskRepository.save(task);
  return NextResponse.json(updated);
}

// DELETE /api/tasks/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const task = await taskRepository.findOne({
    where: { id: Number(params.id), deleted_at: IsNull() },
  });

  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  // 권한: 본인 또는 ADMIN
  if (session.user.role !== 'ADMIN' && task.employee_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Soft delete
  await taskRepository.softDelete(task.id);
  return NextResponse.json({ message: 'Task deleted' });
}
```

---

## Acceptance Criteria

- [ ] GET /api/tasks/[id] 구현 (상세 조회)
- [ ] PUT /api/tasks/[id] 구현 (수정)
- [ ] DELETE /api/tasks/[id] 구현 (soft delete)
- [ ] 인증 체크 (401)
- [ ] 권한 체크: 본인 또는 ADMIN (403)
- [ ] 존재하지 않는 업무 (404)
- [ ] PUT: completed_at 자동 처리 (DONE→설정, 비DONE→null)
- [ ] PUT: completed_at 클라이언트 수정 무시
- [ ] DELETE: soft delete (deleted_at 설정, physical delete 금지)
- [ ] Input Validation (PUT body 검증)

---

## 테스트 전략

### 단위 테스트

**테스트 파일 위치**: `src/__tests__/api/tasks/[id]/route.test.ts`

```typescript
describe('GET /api/tasks/[id]', () => {
  it('should return task by id', async () => {});
  it('should return 404 for non-existent task', async () => {});
  it('should return 404 for soft-deleted task', async () => {});
  it('should return 403 for other user task (USER role)', async () => {});
  it('should allow ADMIN to view any task', async () => {});
});

describe('PUT /api/tasks/[id]', () => {
  it('should update task fields', async () => {});
  it('should set completed_at when status changes to DONE', async () => {});
  it('should clear completed_at when status changes from DONE', async () => {});
  it('should ignore client-sent completed_at', async () => {});
  it('should return 403 for non-owner (USER role)', async () => {});
  it('should allow ADMIN to update any task', async () => {});
  it('should validate input fields', async () => {});
});

describe('DELETE /api/tasks/[id]', () => {
  it('should soft delete task (set deleted_at)', async () => {});
  it('should not physically delete', async () => {});
  it('should return 403 for non-owner', async () => {});
  it('should allow ADMIN to delete any task', async () => {});
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] GET/PUT/DELETE 모두 구현
- [ ] 인증/인가 처리 완료
- [ ] completed_at 자동 처리 로직
- [ ] Soft delete 적용 (physical delete 금지)
- [ ] 단위 테스트 통과

---

**다음 문서**: 2011_06_API_Dashboard_Daily_Summary.md
