<!-- Generated: 2026-01-27 22:45:00 KST -->

# API: 고객 삭제 (ADMIN 권한)

**문서 번호**: 2081_04
**원본 PRD**: docs/prd/2081_고객_등록_및_조회_prd_v2.md
**PRD 참조**: 원본 PRD의 "5.2 API Route Handlers", Decision 1, 8 참조 (DELETE 권한 ADMIN only)
**구현 범위**: DELETE /api/customers/[id] (ADMIN only, soft delete)
**복잡도**: M (1~2일)
**의존성**: 2081_03 완료 (기본 CRUD 엔드포인트 구현)

---

## 구현 목표

고객 삭제 API 엔드포인트를 구현합니다. **ADMIN만** 고객을 소프트 삭제할 수 있으며, 삭제 전 의존성(프로젝트, 기술지원, 유지보수 계약)을 검증합니다. Decision 1, 8에 따라 MANAGER는 접근 불가(403 Forbidden)입니다.

---

## 파일 구조

```
src/app/api/customers/[id]/
└── route.ts (DELETE 엔드포인트 추가)
```

**note**: POST/PUT/GET는 2081_03에서 이미 구현함. 이 문서는 DELETE 메서드만 추가.

---

## 구현 상세

### DELETE /api/customers/[id] (고객 소프트 삭제)

**권한**: ADMIN only
**경로 파라미터**:
- `id`: number (고객 ID)

**요청 본문** (옵션):

```json
{
  "reason": "활동 중단" // 삭제 사유 (선택사항, 이력 기록용)
}
```

**응답** (200 OK):

```json
{
  "message": "고객이 삭제되었습니다.",
  "data": {
    "id": 1,
    "name": "삼성전자",
    "deletedAt": "2026-01-27T15:00:00Z"
  }
}
```

**에러 응답** (400 Bad Request - 의존성 존재):

```json
{
  "error": "Dependency Error",
  "message": "이 고객과 관련된 프로젝트(3개), 기술지원(2개)이 존재하여 삭제할 수 없습니다.",
  "details": {
    "projects": 3,
    "techSupports": 2,
    "maintenanceContracts": 0
  }
}
```

---

## 구현 로직

### 1. 인증 및 권한 검증

```typescript
// 세션 검증
const session = await getServerSession(authOptions);
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// ADMIN 권한 검증 (Decision 1, 8)
const userRole = (session.user as any)?.role;
if (userRole !== 'ADMIN') {
  return NextResponse.json(
    { error: 'Forbidden', details: 'Only ADMIN can delete customers' },
    { status: 403 }
  );
}
```

### 2. 고객 조회

```sql
SELECT id, name, deleted_at
FROM CUSTOMER
WHERE id = :id AND deleted_at IS NULL
```

- 고객 미존재 시 404 반환
- 이미 삭제된 고객 시 400 반환 (중복 삭제 방지)

### 3. 의존성 검증

삭제 전 다음 관련 데이터 존재 여부 확인:

```sql
-- 프로젝트 확인
SELECT COUNT(*) as count
FROM PROJECT p
WHERE p.customer_id = :customerId AND p.deleted_at IS NULL

-- 기술지원 확인
SELECT COUNT(*) as count
FROM TECH_SUPPORT ts
WHERE ts.customer_id = :customerId AND ts.deleted_at IS NULL

-- 유지보수 계약 확인
SELECT COUNT(*) as count
FROM MAINTENANCE_CONTRACTS mc
WHERE mc.customer_id = :customerId AND mc.deleted_at IS NULL

-- 고객 담당자 확인 (존재해도 OK, 소프트 삭제되지 않음)
SELECT COUNT(*) as count
FROM CUSTOMER_CONTACT cc
WHERE cc.customer_id = :customerId AND cc.deleted_at IS NULL
```

**정책**:
- 프로젝트, 기술지원, 유지보수 계약이 **존재**하면 삭제 불가 (400 Bad Request)
- 고객 담당자가 존재해도 삭제 가능 (담당자는 소프트 삭제되지 않음)

**에러 응답**:

```json
{
  "error": "Dependency Error",
  "message": "이 고객과 관련된 업무가 존재하여 삭제할 수 없습니다.",
  "details": {
    "projects": 3,
    "techSupports": 2,
    "maintenanceContracts": 1
  }
}
```

### 4. 트랜잭션 처리

```typescript
const queryRunner = dataSource.createQueryRunner();
await queryRunner.startTransaction();

try {
  // 4.1. 고객 소프트 삭제
  await queryRunner.query(
    `UPDATE CUSTOMER
     SET deleted_at = CURRENT_TIMESTAMP, updated_by_id = :userId, updated_at = CURRENT_TIMESTAMP
     WHERE id = :customerId`,
    { customerId: id, userId }
  );

  // 4.2. 이력 기록 (type=DELETE)
  await queryRunner.query(
    `INSERT INTO CUSTOMER_HISTORY (id, customer_id, change_type, changed_fields, changed_by_id, changed_at)
     VALUES (SEQ_CUSTOMER_HISTORY.NEXTVAL, :customerId, 'DELETE',
             :changedFields, :userId, CURRENT_TIMESTAMP)`,
    {
      customerId: id,
      userId,
      changedFields: JSON.stringify({
        deleted_at: { before: null, after: new Date().toISOString() },
        ...(reason && { reason: { before: null, after: reason } })
      })
    }
  );

  // 4.3. 커밋
  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}
```

### 5. 응답 반환

삭제된 고객 정보 반환 (404 상태 코드 대신 200 사용):

```typescript
return NextResponse.json(
  {
    message: '고객이 삭제되었습니다.',
    data: {
      id: customerId,
      name: customerName,
      deletedAt: new Date().toISOString()
    }
  },
  { status: 200 }
);
```

---

## 핵심 인터페이스

### TypeScript 타입 (src/types/customer.ts에 추가)

```typescript
export interface DeleteCustomerRequest {
  reason?: string; // 삭제 사유 (선택사항)
}

export interface DeleteCustomerResponse {
  message: string;
  data: {
    id: number;
    name: string;
    deletedAt: string;
  };
}

export interface DependencyError {
  error: string;
  message: string;
  details: {
    projects?: number;
    techSupports?: number;
    maintenanceContracts?: number;
  };
}
```

---

## Acceptance Criteria

- [ ] DELETE /api/customers/[id] 구현 완료
  - [ ] ADMIN 권한 검증 (MANAGER 시도 시 403)
  - [ ] 고객 조회 및 미존재 시 404 처리
  - [ ] 이중 삭제 방지 (이미 deleted_at 설정된 경우 처리)
  - [ ] 의존성 검증 (프로젝트, 기술지원, 유지보수 계약)
  - [ ] Soft delete (deleted_at 설정)
  - [ ] 이력 기록 (type=DELETE)
  - [ ] 트랜잭션 처리

- [ ] RBAC 검증
  - [ ] ADMIN: DELETE 가능
  - [ ] MANAGER: DELETE 시도 시 403 Forbidden
  - [ ] USER: DELETE 시도 시 403 Forbidden
  - [ ] 미인증: DELETE 시도 시 401 Unauthorized

- [ ] 에러 처리 검증
  - [ ] 존재하지 않는 고객: 404 Not Found
  - [ ] 의존성 존재: 400 Bad Request with dependency details
  - [ ] 이미 삭제된 고객: 400 Bad Request
  - [ ] 권한 없음: 403 Forbidden

---

## 테스트 전략

### TypeScript & Lint

```bash
npm run type-check
npm run lint
npm run format
```

### 단위 테스트 (2081_14에서 구현)

```typescript
describe('DELETE /api/customers/[id]', () => {
  it('should delete customer as ADMIN', async () => {
    const customer = await createCustomer('테스트회사');
    const res = await fetch(`/api/customers/${customer.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer admin-token' }
    });
    expect(res.status).toBe(200);
    expect(res.data.deletedAt).toBeDefined();
  });

  it('should return 403 if MANAGER tries to delete', async () => {
    const customer = await createCustomer('테스트회사');
    const res = await fetch(`/api/customers/${customer.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer manager-token' }
    });
    expect(res.status).toBe(403);
    expect(res.error).toContain('Only ADMIN');
  });

  it('should return 403 if USER tries to delete', async () => {
    const customer = await createCustomer('테스트회사');
    const res = await fetch(`/api/customers/${customer.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer user-token' }
    });
    expect(res.status).toBe(403);
  });

  it('should return 404 if customer not found', async () => {
    const res = await fetch('/api/customers/999999', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer admin-token' }
    });
    expect(res.status).toBe(404);
  });

  it('should return 400 if projects exist', async () => {
    const customer = await createCustomer('테스트회사');
    await createProject(customer.id); // 프로젝트 생성

    const res = await fetch(`/api/customers/${customer.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer admin-token' }
    });
    expect(res.status).toBe(400);
    expect(res.details.projects).toBe(1);
  });

  it('should record history on delete', async () => {
    const customer = await createCustomer('테스트회사');
    await fetch(`/api/customers/${customer.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer admin-token' }
    });

    const history = await fetch(`/api/customers/${customer.id}/history`);
    expect(history.data).toContainEqual(
      expect.objectContaining({
        changeType: 'DELETE'
      })
    );
  });

  it('should prevent duplicate deletion', async () => {
    const customer = await createCustomer('테스트회사');
    await fetch(`/api/customers/${customer.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer admin-token' }
    });

    // 두 번째 삭제 시도
    const res = await fetch(`/api/customers/${customer.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer admin-token' }
    });
    expect(res.status).toBe(400);
  });
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
  ```bash
  npm run build
  ✅ (에러 없음)
  ```

- [ ] TypeScript 검증 통과
  ```bash
  npm run type-check
  ✅ (에러 없음)
  ```

- [ ] ESLint 검증 통과
  ```bash
  npm run lint
  ✅ (경고 없음)
  ```

- [ ] DELETE 엔드포인트 구현
  - [ ] `src/app/api/customers/[id]/route.ts`에 DELETE 메서드 추가

- [ ] RBAC 검증
  - [ ] ADMIN: DELETE 가능 (200 OK)
  - [ ] MANAGER: DELETE 불가 (403 Forbidden)
  - [ ] USER: DELETE 불가 (403 Forbidden)

- [ ] 의존성 검증
  - [ ] 프로젝트 존재 시 삭제 불가 (400)
  - [ ] 기술지원 존재 시 삭제 불가 (400)
  - [ ] 유지보수 계약 존재 시 삭제 불가 (400)

- [ ] Soft delete 검증
  - [ ] deleted_at 설정됨
  - [ ] 이력 기록됨 (type=DELETE)

- [ ] 스테이징 배포 후 검증
  - [ ] DELETE /api/customers/[id] (ADMIN: 200 OK)
  - [ ] DELETE /api/customers/[id] (MANAGER: 403 Forbidden)

---

**다음 문서**: 2081_05_API_담당자_CRUD.md
