<!-- Generated: 2026-01-25 05:10:00 KST -->

# 기술지원 CRUD API

**문서 번호**: 2031_04
**원본 PRD**: 2031_기술지원_관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.2 — API Route Handlers (CRUD)' 참조
**구현 범위**: GET(목록/상세), POST, PUT, DELETE API Route Handlers
**복잡도**: L
**의존성**: 2031_01, 2031_03

---

## 구현 목표

기술지원 CRUD + 검색 API를 구현한다. 페이지네이션, 복합 필터링, 정렬, RBAC, 상태 전이 매트릭스 검증을 포함한다.

---

## 구현 내용

### 파일 구조

```
src/app/api/support/
├── route.ts              # GET (목록), POST (등록)
└── [id]/
    └── route.ts          # GET (상세), PUT (수정), DELETE (삭제)
```

### 구현 상세

#### GET /api/support — 목록 조회

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| date_from | string (YYYY-MM-DD) | Y | 시작일 |
| date_to | string (YYYY-MM-DD) | Y | 종료일 |
| customer_id | number | N | 고객사 ID |
| support_type | SupportType | N | 지원 유형 |
| support_method | SupportMethod | N | 지원 방법 |
| status | SupportStatus | N | 상태 |
| keyword | string (2자+) | N | 제목 LIKE 검색 |
| page | number | N (default: 1) | 페이지 번호 |
| page_size | number | N (default: 20) | 페이지 크기 |
| sort_by | string | N (default: support_date) | 정렬 컬럼 |
| sort_order | ASC/DESC | N (default: DESC) | 정렬 순서 |

**RBAC:**
- USER/MANAGER: `WHERE employee_id = session.user.id`
- ADMIN: 전체 조회

**응답:**
```json
{
  "supports": [...],
  "total": 50,
  "page": 1,
  "page_size": 20
}
```

**날짜 범위 검증:** date_to - date_from ≤ 365일

**JOIN:** Customer 테이블과 JOIN하여 customer_name 포함

#### POST /api/support — 등록

**Request Body:**
```typescript
{
  title: string;           // 필수, 1~200자
  customer_id: number;     // 필수
  support_type: SupportType;  // 필수
  support_date: string;    // 필수, YYYY-MM-DD
  support_method?: SupportMethod;
  start_time?: number;     // 0~1439
  end_time?: number;       // 0~1439, > start_time
  description?: string;
}
```

- employee_id: session.user.id에서 자동 설정
- status: 'RECEIVED'로 고정
- 응답: 201 Created, `{ id: number }`

#### GET /api/support/[id] — 상세 조회

- RBAC: 본인 건 또는 ADMIN만 조회
- JOIN: Customer(name, category) 포함
- 404: 존재하지 않거나 deleted_at != null

#### PUT /api/support/[id] — 수정

- RBAC: 본인 건만 수정 (ADMIN은 담당자 변경 가능)
- **상태 전이 검증:**
  - 현재 상태 → 새 상태가 전이 매트릭스에 허용되는지 확인
  - ADMIN: 모든 전이 허용
  - USER: RECEIVED→IN_PROGRESS, IN_PROGRESS→COMPLETED, COMPLETED→IN_PROGRESS만 허용
  - 허용되지 않은 전이: 400 Bad Request (`{ error: 'Invalid status transition' }`)
- **completed_at 자동 처리:**
  - → COMPLETED: `completed_at = new Date()`
  - COMPLETED → IN_PROGRESS: `completed_at = null`
- title XSS sanitize

#### DELETE /api/support/[id] — Soft Delete

- RBAC: 본인 건 또는 ADMIN
- `deleted_at = new Date()`
- 첨부 파일이 있는 경우 파일도 삭제 (물리 삭제)

### 핵심 인터페이스

```typescript
// 상태 전이 매트릭스
const STATUS_TRANSITIONS: Record<SupportStatus, SupportStatus[]> = {
  RECEIVED: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: ['IN_PROGRESS'],
};

function isValidTransition(
  from: SupportStatus,
  to: SupportStatus,
  role: string
): boolean {
  if (role === 'ADMIN') return true;
  if (from === to) return true;
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
```

---

## Acceptance Criteria

- [ ] GET /api/support: 페이지네이션 동작 (page, page_size, total)
- [ ] GET /api/support: 날짜 범위 필터 동작 (365일 제한)
- [ ] GET /api/support: customer_id, support_type, support_method, status 필터 동작
- [ ] GET /api/support: keyword LIKE 검색 동작 (2자 이상)
- [ ] GET /api/support: 정렬 동작 (support_date, title, status)
- [ ] GET /api/support: RBAC — USER는 본인 건만, ADMIN은 전체
- [ ] GET /api/support: customer_name JOIN 포함
- [ ] POST /api/support: 필수 필드 검증 (title, customer_id, support_type, support_date)
- [ ] POST /api/support: employee_id 자동 설정, status = RECEIVED 고정
- [ ] POST /api/support: 시간 범위 CHECK 검증 (start_time < end_time)
- [ ] GET /api/support/[id]: 상세 조회 + Customer 정보 포함
- [ ] GET /api/support/[id]: RBAC (본인 건/ADMIN)
- [ ] PUT /api/support/[id]: 상태 전이 매트릭스 검증
- [ ] PUT /api/support/[id]: completed_at 자동 처리
- [ ] PUT /api/support/[id]: ADMIN 담당자 변경 가능
- [ ] DELETE /api/support/[id]: soft delete (deleted_at 설정)
- [ ] 모든 route: 미인증 시 401

---

## 테스트 전략

### 단위 테스트

**테스트 파일**: `src/__tests__/api/support/route.test.ts`

```typescript
describe('GET /api/support', () => {
  it('should return 401 when not authenticated');
  it('should return paginated results');
  it('should filter by date range');
  it('should reject date range > 365 days');
  it('should filter by customer_id');
  it('should filter by support_type');
  it('should filter by status');
  it('should search by keyword (2+ chars)');
  it('should sort by support_date DESC by default');
  it('should return only own records for USER role');
  it('should return all records for ADMIN role');
  it('should include customer_name in response');
});

describe('POST /api/support', () => {
  it('should create new record with status RECEIVED');
  it('should set employee_id from session');
  it('should validate required fields');
  it('should validate time range');
  it('should return 201 with id');
});

describe('PUT /api/support/[id]', () => {
  it('should update record fields');
  it('should validate status transition (RECEIVED → IN_PROGRESS)');
  it('should reject invalid transition (RECEIVED → COMPLETED)');
  it('should set completed_at when transitioning to COMPLETED');
  it('should clear completed_at when transitioning from COMPLETED');
  it('should allow ADMIN to bypass transition rules');
  it('should reject non-owner update');
});

describe('DELETE /api/support/[id]', () => {
  it('should soft delete record');
  it('should reject non-owner delete');
  it('should allow ADMIN to delete any record');
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] CRUD 동작 확인 (dev 서버)
- [ ] RBAC 권한 검증 (서버)
- [ ] 상태 전이 매트릭스 검증
- [ ] Soft delete 적용
- [ ] SQL Injection 방지 (parameterized query)
- [ ] XSS sanitize (title)

---

**다음 문서**: 2031_05_파일_첨부_API.md
