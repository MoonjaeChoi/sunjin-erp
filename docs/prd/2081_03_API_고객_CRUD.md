<!-- Generated: 2026-01-27 22:45:00 KST -->

# API: 고객 CRUD (목록, 상세, 등록, 수정)

**문서 번호**: 2081_03
**원본 PRD**: docs/prd/2081_고객_등록_및_조회_prd_v2.md
**PRD 참조**: 원본 PRD의 "5.2 API Route Handlers" 섹션 참조
**구현 범위**: GET /api/customers, GET /api/customers/[id], POST /api/customers, PUT /api/customers/[id] (MANAGER+)
**복잡도**: M (1~2일)
**의존성**: 2081_02 완료 (Database schema 준비)

---

## 구현 목표

고객 목록 조회(필터, 정렬, 페이지네이션), 상세 조회, 신규 등록, 수정의 4개 API 엔드포인트를 구현합니다. 모든 엔드포인트에서 RBAC 검증(USER는 GET만, MANAGER+는 POST/PUT), 고유성 검증, 변경 이력 기록을 수행합니다.

---

## 파일 구조

```
src/app/api/customers/
├── route.ts (GET /api/customers, POST /api/customers)
└── [id]/
    └── route.ts (GET /api/customers/[id], PUT /api/customers/[id])
```

---

## 구현 상세

### 1. GET /api/customers (목록 조회)

**권한**: USER+ (모든 인증 사용자)
**쿼리 파라미터**:
- `page`: number (default: 1, 1-indexed)
- `limit`: number (default: 20, max: 100)
- `search`: string (고객명 또는 코드)
- `classification`: string (다중 선택 가능, query 배열 형식)
- `managerId`: number (담당자 ID)
- `includeDeleted`: boolean (삭제된 고객 포함, ADMIN만 가능)
- `sortBy`: "name" | "createdAt" | "updatedAt" | "manager" (default: name)
- `sortOrder`: "ASC" | "DESC" (default: ASC)

**응답 형식**:

```json
{
  "data": [
    {
      "id": 1,
      "name": "삼성전자",
      "code": "CUST-00001",
      "classification": "END_USER",
      "phone": "02-1234-5678",
      "email": "contact@samsung.com",
      "memo": "주의: 매월 2주차 미팅",
      "managerId": 5,
      "managerName": "이영업",
      "createdAt": "2026-01-20T10:00:00Z",
      "updatedAt": "2026-01-25T15:30:00Z",
      "deletedAt": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**구현 로직**:

1. 세션 검증 (USER+)
2. 쿼리 파라미터 파싱 (필터, 정렬, 페이지네이션)
3. SQL 쿼리 구성 (WHERE, ORDER BY, OFFSET/LIMIT)
   - `deleted_at IS NULL` 필터 (ADMIN은 includeDeleted 옵션으로 제어)
   - 검색: name 또는 code LIKE 검색 (대소문자 무시)
   - 필터: classification, manager_id
   - 정렬: createdAt, name 등
4. 총 개수 조회 (COUNT)
5. 목록 조회 (페이지네이션)
6. 응답 반환

**SQL 예시**:

```sql
SELECT
  c.id, c.name, c.code, c.classification, c.phone, c.email, c.memo,
  c.created_by_id as managerId, e.name as managerName,
  c.created_at, c.updated_at, c.deleted_at
FROM CUSTOMER c
LEFT JOIN EMPLOYEE e ON c.created_by_id = e.id
WHERE c.deleted_at IS NULL
  AND (c.name LIKE '%:search%' OR c.code LIKE '%:search%')
  AND c.classification IN (:classification)
  AND c.created_by_id = :managerId
ORDER BY c.name ASC
OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
```

---

### 2. POST /api/customers (신규 등록)

**권한**: MANAGER+ (MANAGER, ADMIN)
**요청 본문**:

```json
{
  "name": "삼성전자",
  "classification": "END_USER",
  "address": "서울시 강남구",
  "phone": "02-1234-5678",
  "email": "contact@samsung.com",
  "memo": "주의: 매월 2주차 미팅"
}
```

**응답** (201 Created):

```json
{
  "data": {
    "id": 1,
    "name": "삼성전자",
    "code": "CUST-00001",
    "classification": "END_USER",
    "address": "서울시 강남구",
    "phone": "02-1234-5678",
    "email": "contact@samsung.com",
    "memo": "주의: 매월 2주차 미팅",
    "createdAt": "2026-01-27T10:00:00Z",
    "updatedAt": "2026-01-27T10:00:00Z"
  },
  "message": "고객이 등록되었습니다."
}
```

**구현 로직**:

1. 세션 검증 (MANAGER+)
2. 요청 본문 파싱
3. 필수 필드 검증 (name, classification)
4. 필드 값 검증
   - name: 문자열, 200자 이내, XSS 방지 (sanitize)
   - classification: enum (RESELLER|END_USER|MAINTENANCE|GENERAL)
   - phone: 형식 검증 (선택, 있으면 검증)
   - email: 이메일 형식 검증 (선택, 있으면 검증)
5. 고유성 검증 (name 중복 체크, soft delete 제외)
6. 트랜잭션 시작
7. 고객 코드 생성 (SEQUENCE: CUST_CODE_SEQ)
8. 고객 등록
9. 이력 기록 (CUSTOMER_HISTORY: type=CREATE)
10. 트랜잭션 커밋
11. 등록된 고객 조회 및 반환

**SQL 예시**:

```sql
-- 고객명 중복 검사
SELECT id FROM CUSTOMER WHERE name = :name AND deleted_at IS NULL

-- 고객 코드 생성
SELECT TO_CHAR(CUST_CODE_SEQ.NEXTVAL, 'FM00000') as code FROM DUAL

-- 고객 등록
INSERT INTO CUSTOMER (id, name, code, classification, address, phone, email, memo,
                      created_by_id, updated_by_id, created_at, updated_at)
VALUES (SEQ_CUSTOMER.NEXTVAL, :name, :code, :classification, :address, :phone, :email, :memo,
        :userId, :userId, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)

-- 이력 기록
INSERT INTO CUSTOMER_HISTORY (id, customer_id, change_type, changed_fields, changed_by_id, changed_at)
VALUES (SEQ_CUSTOMER_HISTORY.NEXTVAL, :customerId, 'CREATE',
        '{"name": {"before": null, "after": "..."},...}',
        :userId, CURRENT_TIMESTAMP)
```

---

### 3. GET /api/customers/[id] (상세 조회)

**권한**: USER+ (모든 인증 사용자)
**경로 파라미터**:
- `id`: number (고객 ID)

**응답**:

```json
{
  "data": {
    "id": 1,
    "name": "삼성전자",
    "code": "CUST-00001",
    "classification": "END_USER",
    "address": "서울시 강남구",
    "phone": "02-1234-5678",
    "email": "contact@samsung.com",
    "memo": "주의: 매월 2주차 미팅",
    "managerId": 5,
    "managerName": "이영업",
    "createdAt": "2026-01-20T10:00:00Z",
    "updatedAt": "2026-01-25T15:30:00Z",
    "createdByName": "김등록",
    "updatedByName": "박수정"
  }
}
```

**구현 로직**:

1. 세션 검증 (USER+)
2. ID 파라미터 검증 (숫자)
3. 고객 조회 (deleted_at IS NULL)
4. 고객 미존재 시 404 반환
5. 응답 반환

**SQL 예시**:

```sql
SELECT
  c.id, c.name, c.code, c.classification, c.address, c.phone, c.email, c.memo,
  c.created_by_id as managerId, e.name as managerName,
  cb.name as createdByName, ub.name as updatedByName,
  c.created_at, c.updated_at
FROM CUSTOMER c
LEFT JOIN EMPLOYEE e ON c.created_by_id = e.id
LEFT JOIN EMPLOYEE cb ON c.created_by_id = cb.id
LEFT JOIN EMPLOYEE ub ON c.updated_by_id = ub.id
WHERE c.id = :id AND c.deleted_at IS NULL
```

---

### 4. PUT /api/customers/[id] (수정)

**권한**: MANAGER+ (MANAGER, ADMIN)
**경로 파라미터**:
- `id`: number (고객 ID)

**요청 본문** (일부 필드만 업데이트 가능):

```json
{
  "address": "서울시 서초구",
  "phone": "02-5678-1234",
  "email": "newemail@samsung.com",
  "memo": "변경된 메모",
  "classification": "RESELLER"
}
```

**응답**:

```json
{
  "data": {
    "id": 1,
    "name": "삼성전자",
    "code": "CUST-00001",
    "classification": "RESELLER",
    "address": "서울시 서초구",
    "phone": "02-5678-1234",
    "email": "newemail@samsung.com",
    "memo": "변경된 메모",
    "updatedAt": "2026-01-27T14:30:00Z"
  },
  "message": "고객이 수정되었습니다."
}
```

**구현 로직**:

1. 세션 검증 (MANAGER+)
2. ID 파라미터 검증
3. 고객 조회 (deleted_at IS NULL)
4. 고객 미존재 시 404 반환
5. 요청 본문 파싱 (제공된 필드만 업데이트)
6. 필드 값 검증 (동일한 검증 규칙 적용)
7. 고유성 검증 (name 변경 시만, soft delete 제외)
8. 트랜잭션 시작
9. 고객 수정
10. 변경 이력 기록 (CUSTOMER_HISTORY: type=UPDATE, 변경된 필드만 기록)
11. 트랜잭션 커밋
12. 수정된 고객 조회 및 반환

**SQL 예시**:

```sql
-- 고객 조회
SELECT * FROM CUSTOMER WHERE id = :id AND deleted_at IS NULL

-- 고객 수정
UPDATE CUSTOMER
SET address = :address, phone = :phone, email = :email, memo = :memo,
    classification = :classification, updated_by_id = :userId, updated_at = CURRENT_TIMESTAMP
WHERE id = :id

-- 이력 기록 (변경된 필드만)
INSERT INTO CUSTOMER_HISTORY (id, customer_id, change_type, changed_fields, changed_by_id, changed_at)
VALUES (SEQ_CUSTOMER_HISTORY.NEXTVAL, :customerId, 'UPDATE',
        '{"address": {"before": "...", "after": "..."},...}',
        :userId, CURRENT_TIMESTAMP)
```

---

## 핵심 인터페이스

### TypeScript 타입 (src/types/customer.ts)

```typescript
// API 요청/응답 타입
export interface CreateCustomerRequest {
  name: string;
  classification: 'RESELLER' | 'END_USER' | 'MAINTENANCE' | 'GENERAL';
  address?: string;
  phone?: string;
  email?: string;
  memo?: string;
}

export interface UpdateCustomerRequest {
  address?: string;
  phone?: string;
  email?: string;
  memo?: string;
  classification?: 'RESELLER' | 'END_USER' | 'MAINTENANCE' | 'GENERAL';
}

export interface CustomerResponse {
  id: number;
  name: string;
  code: string;
  classification: string;
  address?: string;
  phone?: string;
  email?: string;
  memo?: string;
  managerId: number;
  managerName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CustomersListResponse {
  data: CustomerResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

## Acceptance Criteria

- [ ] GET /api/customers 구현 완료
  - [ ] 필터링 (classification, managerId)
  - [ ] 검색 (name, code LIKE)
  - [ ] 정렬 (name, createdAt, updatedAt)
  - [ ] 페이지네이션 (offset/limit)
  - [ ] 삭제된 고객 제외 (soft delete)
  - [ ] RBAC 검증 (USER+)

- [ ] POST /api/customers 구현 완료
  - [ ] 필수 필드 검증 (name, classification)
  - [ ] 고유성 검증 (name 중복 체크)
  - [ ] 고객 코드 자동 생성 (SEQUENCE)
  - [ ] 이력 기록 (type=CREATE)
  - [ ] RBAC 검증 (MANAGER+)
  - [ ] 트랜잭션 처리

- [ ] GET /api/customers/[id] 구현 완료
  - [ ] 상세 조회 (직원 정보 JOIN)
  - [ ] 삭제된 고객 제외
  - [ ] 404 에러 처리
  - [ ] RBAC 검증 (USER+)

- [ ] PUT /api/customers/[id] 구현 완료
  - [ ] 부분 업데이트 지원
  - [ ] 필드 값 검증
  - [ ] 고유성 검증 (name 변경 시만)
  - [ ] 이력 기록 (type=UPDATE, 변경된 필드만)
  - [ ] RBAC 검증 (MANAGER+)
  - [ ] 트랜잭션 처리

---

## 테스트 전략

### TypeScript & Lint

```bash
npm run type-check
npm run lint
npm run format
```

### 단위 테스트 (후속 2081_14)

```typescript
describe('GET /api/customers', () => {
  it('should list customers with pagination', async () => {
    const res = await fetch('/api/customers?page=1&limit=20');
    expect(res.status).toBe(200);
    expect(res.data).toHaveLength(20);
  });

  it('should filter by classification', async () => {
    const res = await fetch('/api/customers?classification=RESELLER');
    expect(res.status).toBe(200);
    expect(res.data[0].classification).toBe('RESELLER');
  });

  it('should return 401 if not authenticated', async () => {
    const res = await fetch('/api/customers', { headers: { Cookie: '' } });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/customers', () => {
  it('should create customer with MANAGER role', async () => {
    const res = await fetch('/api/customers', {
      method: 'POST',
      body: JSON.stringify({ name: '테스트회사', classification: 'END_USER' })
    });
    expect(res.status).toBe(201);
    expect(res.data.code).toMatch(/^CUST-\d{5}$/);
  });

  it('should reject duplicate name', async () => {
    await createCustomer('테스트회사');
    const res = await fetch('/api/customers', {
      method: 'POST',
      body: JSON.stringify({ name: '테스트회사', classification: 'END_USER' })
    });
    expect(res.status).toBe(400);
  });

  it('should return 403 if not MANAGER', async () => {
    // USER 권한으로 요청
    const res = await fetch('/api/customers', {
      method: 'POST',
      body: JSON.stringify({ name: '테스트회사', classification: 'END_USER' })
    });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/customers/[id]', () => {
  it('should return customer detail', async () => {
    const customer = await createCustomer('테스트회사');
    const res = await fetch(`/api/customers/${customer.id}`);
    expect(res.status).toBe(200);
    expect(res.data.name).toBe('테스트회사');
  });

  it('should return 404 if customer not found', async () => {
    const res = await fetch('/api/customers/999999');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/customers/[id]', () => {
  it('should update customer', async () => {
    const customer = await createCustomer('테스트회사');
    const res = await fetch(`/api/customers/${customer.id}`, {
      method: 'PUT',
      body: JSON.stringify({ address: '새로운 주소' })
    });
    expect(res.status).toBe(200);
    expect(res.data.address).toBe('새로운 주소');
  });

  it('should record history on update', async () => {
    const customer = await createCustomer('테스트회사');
    await fetch(`/api/customers/${customer.id}`, {
      method: 'PUT',
      body: JSON.stringify({ classification: 'RESELLER' })
    });

    const history = await fetch(`/api/customers/${customer.id}/history`);
    expect(history.data).toContainEqual(
      expect.objectContaining({
        changeType: 'UPDATE',
        changedFields: expect.stringContaining('classification')
      })
    );
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

- [ ] 파일 생성 확인
  - [ ] `src/app/api/customers/route.ts` 존재
  - [ ] `src/app/api/customers/[id]/route.ts` 존재

- [ ] API 엔드포인트 검증 (로컬/스테이징)
  - [ ] GET /api/customers (200, 목록 반환)
  - [ ] POST /api/customers (201, 고객 생성, MANAGER+)
  - [ ] GET /api/customers/[id] (200, 상세 반환)
  - [ ] PUT /api/customers/[id] (200, 고객 수정, MANAGER+)

- [ ] RBAC 검증
  - [ ] USER: GET만 가능 (POST/PUT 403)
  - [ ] MANAGER: GET/POST/PUT 가능
  - [ ] ADMIN: GET/POST/PUT 가능

- [ ] 에러 처리 검증
  - [ ] 중복 고객명: 400 Bad Request
  - [ ] 존재하지 않는 고객: 404 Not Found
  - [ ] 권한 없음: 403 Forbidden
  - [ ] 미인증: 401 Unauthorized

---

**다음 문서**: 2081_04_API_고객_삭제_ADMIN권한.md
