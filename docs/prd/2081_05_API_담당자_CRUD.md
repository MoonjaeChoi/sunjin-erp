<!-- Generated: 2026-01-27 22:45:00 KST -->

# API: 담당자 CRUD

**문서 번호**: 2081_05
**원본 PRD**: docs/prd/2081_고객_등록_및_조회_prd_v2.md
**PRD 참조**: 원본 PRD의 "5.2 API Route Handlers" 섹션 및 US-4 참조, Decision 8 (담당자 삭제는 MANAGER 가능)
**구현 범위**: POST/PUT/DELETE /api/customers/[id]/contacts (MANAGER+)
**복잡도**: M (1~2일)
**의존성**: 2081_04 완료 (고객 CRUD 완료)

---

## 구현 목표

고객 담당자의 CRUD 작업(추가, 수정, 삭제)을 구현합니다. 모든 작업은 MANAGER 이상 권한이 필요하며, 담당자 삭제는 soft delete 처리되고 이력에 기록됩니다. Primary Contact는 고객당 최대 1명 제약을 적용합니다.

---

## 파일 구조

```
src/app/api/customers/[id]/contacts/
├── route.ts (GET 담당자 목록, POST 담당자 추가)
└── [contactId]/
    └── route.ts (PUT 담당자 수정, DELETE 담당자 삭제)
```

---

## 구현 상세

### 1. GET /api/customers/[id]/contacts (담당자 목록)

**권한**: USER+ (모든 인증 사용자)
**경로 파라미터**:
- `id`: number (고객 ID)

**응답**:

```json
{
  "data": [
    {
      "id": 1,
      "customerId": 1,
      "name": "김고객",
      "title": "과장",
      "department": "영업팀",
      "email": "kim@samsung.com",
      "phone": "010-1234-5678",
      "description": "주 담당자",
      "primaryContact": true,
      "createdAt": "2026-01-20T10:00:00Z",
      "updatedAt": "2026-01-20T10:00:00Z"
    }
  ]
}
```

**구현 로직**:

```sql
SELECT id, customer_id, name, title, department, email, phone, description,
       primary_contact, created_at, updated_at
FROM CUSTOMER_CONTACT
WHERE customer_id = :customerId AND deleted_at IS NULL
ORDER BY primary_contact DESC, created_at ASC
```

---

### 2. POST /api/customers/[id]/contacts (담당자 추가)

**권한**: MANAGER+ (MANAGER, ADMIN)
**경로 파라미터**:
- `id`: number (고객 ID)

**요청 본문**:

```json
{
  "name": "박담당",
  "title": "대리",
  "department": "기술팀",
  "email": "park@samsung.com",
  "phone": "010-5678-1234",
  "description": "기술 담당자",
  "primaryContact": false
}
```

**응답** (201 Created):

```json
{
  "data": {
    "id": 2,
    "customerId": 1,
    "name": "박담당",
    "title": "대리",
    "department": "기술팀",
    "email": "park@samsung.com",
    "phone": "010-5678-1234",
    "description": "기술 담당자",
    "primaryContact": false,
    "createdAt": "2026-01-27T14:30:00Z"
  },
  "message": "담당자가 추가되었습니다."
}
```

**구현 로직**:

1. 세션 검증 (MANAGER+)
2. 고객 존재 여부 확인 (deleted_at IS NULL)
3. 요청 본문 파싱
4. 필수 필드 검증 (name, title, email, phone)
5. 이메일/전화 형식 검증
6. Primary Contact 검증
   - primaryContact=true인데 이미 존재하는 경우 기존 값을 false로 변경
   - 또는 에러 반환 (구현 선택사항)
7. 담당자 등록
8. 이력 기록 (type=CONTACT_ADD)
9. 응답 반환

---

### 3. PUT /api/customers/[id]/contacts/[contactId] (담당자 수정)

**권한**: MANAGER+ (MANAGER, ADMIN)
**경로 파라미터**:
- `id`: number (고객 ID)
- `contactId`: number (담당자 ID)

**요청 본문** (일부 필드만 수정 가능):

```json
{
  "title": "과장",
  "email": "park.new@samsung.com",
  "primaryContact": true
}
```

**응답**:

```json
{
  "data": {
    "id": 2,
    "customerId": 1,
    "name": "박담당",
    "title": "과장",
    "email": "park.new@samsung.com",
    "phone": "010-5678-1234",
    "primaryContact": true,
    "updatedAt": "2026-01-27T15:00:00Z"
  },
  "message": "담당자가 수정되었습니다."
}
```

**구현 로직**:

1. 세션 검증 (MANAGER+)
2. 고객 존재 여부 확인
3. 담당자 존재 여부 확인 (deleted_at IS NULL, customer_id 매칭)
4. 요청 본문 파싱
5. 필드 값 검증 (제공된 필드만)
6. Primary Contact 검증
   - primaryContact=true로 변경하는 경우, 기존 primary contact 제거
7. 담당자 수정
8. 이력 기록 (type=CONTACT_ADD or UPDATE) - 필드 변경 내용 기록
9. 응답 반환

---

### 4. DELETE /api/customers/[id]/contacts/[contactId] (담당자 삭제)

**권한**: MANAGER+ (MANAGER, ADMIN) — Decision 8: 담당자 삭제는 MANAGER도 가능
**경로 파라미터**:
- `id`: number (고객 ID)
- `contactId`: number (담당자 ID)

**응답** (200 OK):

```json
{
  "message": "담당자가 삭제되었습니다.",
  "data": {
    "id": 2,
    "customerId": 1,
    "name": "박담당",
    "deletedAt": "2026-01-27T15:30:00Z"
  }
}
```

**구현 로직**:

1. 세션 검증 (MANAGER+)
2. 고객 존재 여부 확인
3. 담당자 존재 여부 확인 (deleted_at IS NULL, customer_id 매칭)
4. 트랜잭션 시작
5. 담당자 소프트 삭제 (deleted_at 설정)
6. 이력 기록 (type=CONTACT_DELETE)
7. 트랜잭션 커밋
8. 응답 반환

**SQL 예시**:

```sql
-- 담당자 삭제
UPDATE CUSTOMER_CONTACT
SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
WHERE id = :contactId AND customer_id = :customerId AND deleted_at IS NULL

-- 이력 기록
INSERT INTO CUSTOMER_HISTORY (id, customer_id, change_type, changed_fields, changed_by_id, changed_at)
VALUES (SEQ_CUSTOMER_HISTORY.NEXTVAL, :customerId, 'CONTACT_DELETE',
        :changedFields, :userId, CURRENT_TIMESTAMP)
```

---

## Acceptance Criteria

- [ ] GET /api/customers/[id]/contacts 구현 완료
  - [ ] 담당자 목록 조회 (soft delete 제외)
  - [ ] Primary Contact 우선 정렬
  - [ ] RBAC 검증 (USER+)

- [ ] POST /api/customers/[id]/contacts 구현 완료
  - [ ] 필수 필드 검증 (name, title, email, phone)
  - [ ] 이메일/전화 형식 검증
  - [ ] Primary Contact 최대 1명 제약 (기존값 자동 제거 또는 에러)
  - [ ] 이력 기록 (type=CONTACT_ADD)
  - [ ] RBAC 검증 (MANAGER+)

- [ ] PUT /api/customers/[id]/contacts/[contactId] 구현 완료
  - [ ] 부분 수정 지원
  - [ ] Primary Contact 변경 시 기존값 제거
  - [ ] 이력 기록 (변경 필드)
  - [ ] RBAC 검증 (MANAGER+)

- [ ] DELETE /api/customers/[id]/contacts/[contactId] 구현 완료
  - [ ] Soft delete (deleted_at 설정)
  - [ ] 이력 기록 (type=CONTACT_DELETE)
  - [ ] RBAC 검증 (MANAGER+ — Decision 8)
  - [ ] 트랜잭션 처리

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
describe('POST /api/customers/[id]/contacts', () => {
  it('should add contact as MANAGER', async () => {
    const customer = await createCustomer();
    const res = await fetch(`/api/customers/${customer.id}/contacts`, {
      method: 'POST',
      body: JSON.stringify({
        name: '김담당',
        title: '과장',
        email: 'kim@example.com',
        phone: '010-1234-5678'
      })
    });
    expect(res.status).toBe(201);
    expect(res.data.name).toBe('김담당');
  });

  it('should enforce max 1 primary contact', async () => {
    const customer = await createCustomer();
    await addContact(customer.id, { primaryContact: true });
    const res = await addContact(customer.id, { primaryContact: true });
    // 자동으로 기존값 제거 또는 에러
    expect(res.status).toBe(201);
  });
});

describe('DELETE /api/customers/[id]/contacts/[contactId]', () => {
  it('should delete contact as MANAGER', async () => {
    const customer = await createCustomer();
    const contact = await addContact(customer.id);
    const res = await fetch(`/api/customers/${customer.id}/contacts/${contact.id}`, {
      method: 'DELETE'
    });
    expect(res.status).toBe(200);
    expect(res.data.deletedAt).toBeDefined();
  });

  it('should record history on delete', async () => {
    const customer = await createCustomer();
    const contact = await addContact(customer.id);
    await fetch(`/api/customers/${customer.id}/contacts/${contact.id}`, {
      method: 'DELETE'
    });

    const history = await getCustomerHistory(customer.id);
    expect(history).toContainEqual(
      expect.objectContaining({ changeType: 'CONTACT_DELETE' })
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

- [ ] API 엔드포인트 구현
  - [ ] `src/app/api/customers/[id]/contacts/route.ts` 생성
  - [ ] `src/app/api/customers/[id]/contacts/[contactId]/route.ts` 생성

- [ ] API 검증 (로컬/스테이징)
  - [ ] GET /api/customers/[id]/contacts (200, 목록)
  - [ ] POST /api/customers/[id]/contacts (201, 담당자 추가)
  - [ ] PUT /api/customers/[id]/contacts/[contactId] (200, 수정)
  - [ ] DELETE /api/customers/[id]/contacts/[contactId] (200, 삭제)

- [ ] RBAC 검증
  - [ ] USER: GET만 가능 (POST/PUT/DELETE 403)
  - [ ] MANAGER: 모든 작업 가능 (GET/POST/PUT/DELETE)
  - [ ] ADMIN: 모든 작업 가능

---

**다음 문서**: 2081_06_API_이력_조회_및_검색_최적화.md
