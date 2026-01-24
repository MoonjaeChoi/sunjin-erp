<!-- Generated: 2026-01-25 KST -->

# Employee 목록 API

**문서 번호**: 2041_03
**원본 PRD**: 2041_프로젝트_관리_prd_v2.md
**구현 범위**: GET /api/employees/list - 담당자 필터용 Employee 목록 API
**복잡도**: S
**의존성**: 2041_02

---

## 구현 목표

프로젝트 등록/필터에서 담당자를 선택하기 위한 Employee 목록 API를 구현한다. 인증된 사용자만 접근 가능하며, 역할에 따라 조회 범위가 결정된다.

---

## 구현 내용

### 파일 구조

```
src/
├── app/
│   └── api/
│       └── employees/
│           └── list/
│               └── route.ts    # GET /api/employees/list
```

### 구현 상세

#### GET /api/employees/list

**인증**: NextAuth session 필수 (미인증 시 401)

**RBAC 조회 범위:**
| 역할 | 조회 범위 |
|------|----------|
| ADMIN | 전체 직원 목록 |
| MANAGER | 본인 부서(department_id) 소속 직원만 |
| USER | 전체 직원 목록 (read-only 필터용) |

**필터 조건:**
- `deleted_at IS NULL` (활성 직원만)

**JOIN:**
- EMPLOYEE → DEPARTMENT (department_name 포함)

**정렬:**
- `name ASC` (이름 오름차순)

**응답 형태:**
```json
{
  "employees": [
    { "id": 1, "name": "홍길동", "department_name": "영업팀" },
    { "id": 2, "name": "김철수", "department_name": "기술팀" }
  ]
}
```

**에러 응답:**
- 401: `{ error: "Unauthorized" }` — 미인증
- 500: `{ error: "Internal Server Error" }` — DB 조회 실패

### 핵심 인터페이스

```typescript
// src/app/api/employees/list/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

interface EmployeeListItem {
  id: number;
  name: string;
  department_name: string;
}

interface EmployeeListResponse {
  employees: EmployeeListItem[];
}

export async function GET(): Promise<NextResponse<EmployeeListResponse | { error: string }>> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // RBAC: MANAGER는 본인 부서만, ADMIN/USER는 전체
  // WHERE deleted_at IS NULL
  // JOIN DEPARTMENT ON employee.department_id = department.id
  // ORDER BY name ASC

  return NextResponse.json({ employees: [...] });
}
```

```sql
-- ADMIN/USER 쿼리
SELECT e.id, e.name, d.name AS department_name
FROM EMPLOYEE e
LEFT JOIN DEPARTMENT d ON e.department_id = d.id
WHERE e.deleted_at IS NULL
ORDER BY e.name ASC;

-- MANAGER 쿼리 (부서 제한)
SELECT e.id, e.name, d.name AS department_name
FROM EMPLOYEE e
LEFT JOIN DEPARTMENT d ON e.department_id = d.id
WHERE e.deleted_at IS NULL
  AND e.department_id = :managerDepartmentId
ORDER BY e.name ASC;
```

---

## Acceptance Criteria

- [ ] GET /api/employees/list 엔드포인트 동작
- [ ] 미인증 시 401 응답
- [ ] ADMIN: 전체 직원 목록 반환
- [ ] MANAGER: 본인 부서 직원만 반환
- [ ] USER: 전체 직원 목록 반환 (read-only)
- [ ] deleted_at IS NULL인 직원만 반환
- [ ] department_name JOIN 포함
- [ ] name 기준 오름차순 정렬
- [ ] 응답 형태: `{ employees: [{ id, name, department_name }] }`
- [ ] `npm run build` 성공

---

## 테스트 전략

### 단위 테스트

**테스트 파일**: `src/__tests__/api/employees/list.test.ts`

```typescript
describe('GET /api/employees/list', () => {
  it('should return 401 when not authenticated');
  it('should return all employees for ADMIN role');
  it('should return department-scoped employees for MANAGER role');
  it('should return all employees for USER role');
  it('should exclude soft-deleted employees (deleted_at IS NOT NULL)');
  it('should include department_name via JOIN');
  it('should sort by name ASC');
  it('should return empty array when no employees exist');
});
```

### 수동 검증

```bash
# 인증 후 API 호출
curl -H "Cookie: next-auth.session-token=..." \
  http://localhost:3000/api/employees/list
```

---

**다음 문서**: 2041_04_프로젝트_목록_Summary_API.md
