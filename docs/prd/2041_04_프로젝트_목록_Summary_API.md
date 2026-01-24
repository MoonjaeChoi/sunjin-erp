<!-- Generated: 2026-01-25 KST -->

# 프로젝트 목록 + Summary API

**문서 번호**: 2041_04
**원본 PRD**: 2041_프로젝트_관리_prd_v2.md
**구현 범위**: GET /api/projects (목록 조회), GET /api/projects/summary (상태별 카운트)
**복잡도**: L
**의존성**: 2041_02

---

## 구현 목표

프로젝트 목록 조회 API(페이지네이션, 복합 필터링, 정렬, RBAC)와 상태별 카운트 Summary API를 구현한다. 두 API 모두 동일한 RBAC 규칙과 필터 조건을 공유한다.

---

## 구현 내용

### 파일 구조

```
src/
├── app/
│   └── api/
│       └── projects/
│           ├── route.ts            # GET (목록 조회)
│           └── summary/
│               └── route.ts        # GET (상태별 카운트)
```

### 구현 상세

#### 1. GET /api/projects - 목록 조회

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | number | N | 1 | 페이지 번호 (1-based) |
| page_size | number | N | 20 | 페이지 크기 (max: 100) |
| sort_by | string | N | created_at | 정렬 컬럼 |
| sort_order | ASC/DESC | N | DESC | 정렬 순서 |
| customer_id | number | N | - | 고객사 필터 |
| status | string | N | - | 상태 필터 (단일값) |
| employee_id | number | N | - | 담당자 필터 |
| keyword | string | N | - | 키워드 검색 (2자 이상, project_name/project_code LIKE) |

**허용 sort_by 값:** `created_at`, `project_name`, `project_code`, `status`, `start_date`, `end_date`, `contract_amount`

**RBAC 조회 범위:**
| 역할 | 조회 범위 | 조건 |
|------|----------|------|
| ADMIN | 전체 프로젝트 | - |
| MANAGER | 부서 내 프로젝트 | PROJECT.employee_id의 EMPLOYEE.department_id = 본인 department_id |
| USER | 본인 담당 프로젝트 | PROJECT.employee_id = session.user.id |

**WHERE 조건:**
- `deleted_at IS NULL` (필수)
- RBAC 조건 (역할별)
- customer_id, status, employee_id 필터 (선택)
- keyword: `project_name LIKE '%keyword%' OR project_code LIKE '%keyword%'` (2자 이상)

**JOIN:**
- CUSTOMER → customer_name
- EMPLOYEE → employee_name, department_id (RBAC용)

**응답:**
```json
{
  "projects": [
    {
      "id": 1,
      "project_code": "PJT-20260125-001",
      "project_name": "삼성전자 네트워크 구축",
      "customer_id": 1,
      "customer_name": "삼성전자",
      "employee_id": 3,
      "employee_name": "홍길동",
      "status": "IN_PROGRESS",
      "start_date": "2026-01-01",
      "end_date": "2026-06-30",
      "contract_amount": 50000000,
      "created_at": "2026-01-10T05:30:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "page_size": 20
}
```

**에러 응답:**
- 401: 미인증
- 400: 유효하지 않은 파라미터 (keyword 1자, page < 1, page_size > 100 등)

#### 2. GET /api/projects/summary - 상태별 카운트

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| customer_id | number | N | 고객사 필터 |
| employee_id | number | N | 담당자 필터 |

**RBAC:** 목록 API와 동일한 범위 적용

**WHERE 조건:**
- `deleted_at IS NULL`
- RBAC 조건 (역할별)
- customer_id, employee_id 필터 (선택)

**쿼리 로직:**
```sql
SELECT
  COUNT(CASE WHEN status = 'PREPARING' THEN 1 END) AS preparing,
  COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) AS in_progress,
  COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completed,
  COUNT(CASE WHEN status = 'ON_HOLD' THEN 1 END) AS on_hold
FROM PROJECT p
JOIN EMPLOYEE e ON p.employee_id = e.id
WHERE p.deleted_at IS NULL
  AND {RBAC 조건}
  AND {필터 조건};
```

**응답:**
```json
{
  "preparing": 5,
  "in_progress": 12,
  "completed": 8,
  "on_hold": 2
}
```

### 핵심 인터페이스

```typescript
// src/app/api/projects/route.ts
interface ProjectListQuery {
  page?: number;
  page_size?: number;
  sort_by?: 'created_at' | 'project_name' | 'project_code' | 'status' | 'start_date' | 'end_date' | 'contract_amount';
  sort_order?: 'ASC' | 'DESC';
  customer_id?: number;
  status?: ProjectStatus;
  employee_id?: number;
  keyword?: string;
}

interface ProjectListItem {
  id: number;
  project_code: string | null;
  project_name: string;
  customer_id: number;
  customer_name: string;
  employee_id: number;
  employee_name: string;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  contract_amount: number | null;
  created_at: string;
}

interface ProjectListResponse {
  projects: ProjectListItem[];
  total: number;
  page: number;
  page_size: number;
}

// src/app/api/projects/summary/route.ts
interface ProjectSummaryQuery {
  customer_id?: number;
  employee_id?: number;
}

interface ProjectSummaryResponse {
  preparing: number;
  in_progress: number;
  completed: number;
  on_hold: number;
}
```

```typescript
// RBAC 조건 빌더 (공통 유틸)
function buildRbacCondition(session: Session): { where: string; params: Record<string, unknown> } {
  const role = session.user.role;
  if (role === 'ADMIN') return { where: '1=1', params: {} };
  if (role === 'MANAGER') {
    return {
      where: 'e.department_id = :deptId',
      params: { deptId: session.user.department_id }
    };
  }
  // USER
  return {
    where: 'p.employee_id = :userId',
    params: { userId: session.user.id }
  };
}
```

---

## Acceptance Criteria

- [ ] GET /api/projects: 페이지네이션 동작 (page, page_size, total)
- [ ] GET /api/projects: page_size 최대 100 제한
- [ ] GET /api/projects: sort_by + sort_order 정렬 동작
- [ ] GET /api/projects: 허용된 sort_by 값만 허용 (SQL injection 방지)
- [ ] GET /api/projects: customer_id 필터 동작
- [ ] GET /api/projects: status 필터 동작
- [ ] GET /api/projects: employee_id 필터 동작
- [ ] GET /api/projects: keyword 검색 동작 (2자 이상, project_name/project_code)
- [ ] GET /api/projects: keyword 1자 시 무시 또는 400 에러
- [ ] GET /api/projects: RBAC — ADMIN 전체, MANAGER 부서, USER 본인
- [ ] GET /api/projects: deleted_at IS NULL 조건 필수 적용
- [ ] GET /api/projects: customer_name, employee_name JOIN 포함
- [ ] GET /api/projects: 미인증 시 401
- [ ] GET /api/projects/summary: RBAC + 필터 적용된 상태별 카운트
- [ ] GET /api/projects/summary: customer_id, employee_id 필터 동작
- [ ] GET /api/projects/summary: 응답 형태 { preparing, in_progress, completed, on_hold }
- [ ] GET /api/projects/summary: 미인증 시 401
- [ ] `npm run build` 성공

---

## 테스트 전략

### 단위 테스트

**테스트 파일**: `src/__tests__/api/projects/route.test.ts`, `src/__tests__/api/projects/summary.test.ts`

```typescript
describe('GET /api/projects', () => {
  it('should return 401 when not authenticated');
  it('should return paginated results with default page=1, page_size=20');
  it('should limit page_size to max 100');
  it('should sort by created_at DESC by default');
  it('should sort by specified sort_by and sort_order');
  it('should reject invalid sort_by values');
  it('should filter by customer_id');
  it('should filter by status');
  it('should filter by employee_id');
  it('should search by keyword in project_name and project_code');
  it('should ignore keyword shorter than 2 characters');
  it('should return only own projects for USER role');
  it('should return department projects for MANAGER role');
  it('should return all projects for ADMIN role');
  it('should exclude soft-deleted projects');
  it('should include customer_name and employee_name in response');
  it('should return correct total count');
});

describe('GET /api/projects/summary', () => {
  it('should return 401 when not authenticated');
  it('should return status counts for all 4 statuses');
  it('should apply RBAC filter to counts');
  it('should filter counts by customer_id');
  it('should filter counts by employee_id');
  it('should return 0 for statuses with no matching projects');
  it('should exclude soft-deleted projects from counts');
});
```

---

**다음 문서**: 2041_05_프로젝트_등록_코드생성_API.md
