<!-- Generated: 2026-01-28 05:00:00 KST -->

# API - 부서 CRUD

**문서 번호**: 2091_03
**원본 PRD**: 2091_직원_관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.2 API Route Handlers', 'US-1' 참조
**구현 범위**: `/api/departments` 엔드포인트 (GET, POST, PUT, DELETE)
**복잡도**: M (1-2일)
**의존성**: 2091_01, 2091_02

---

## 구현 목표

부서(Department) 관리를 위한 REST API를 구현합니다. 계층 구조(최대 5단계), 순환 참조 방지, 삭제 조건 검증(Decision #4, #7, #12)을 포함합니다.

---

## 구현 내용

### 파일 구조

```
src/app/api/
└── departments/
    ├── route.ts           # GET (list), POST (create)
    └── [id]/
        └── route.ts       # GET (detail), PUT (update), DELETE (soft delete)
```

### API 명세

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/departments` | 부서 목록 조회 (계층 구조) | ADMIN |
| POST | `/api/departments` | 부서 생성 | ADMIN |
| GET | `/api/departments/[id]` | 부서 상세 조회 | ADMIN |
| PUT | `/api/departments/[id]` | 부서 수정 | ADMIN |
| DELETE | `/api/departments/[id]` | 부서 삭제 (soft delete) | ADMIN |

### 구현 상세

#### 1. GET /api/departments - 부서 목록 조회

```typescript
// src/app/api/departments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery } from '@/lib/db-direct';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. 인증 검증
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 2. ADMIN 권한 검증
    const user = session.user as any;
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // 3. 쿼리 파라미터
    const searchParams = req.nextUrl.searchParams;
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    // 4. 부서 목록 조회 (계층 구조용 데이터)
    const whereClause = includeDeleted ? '1=1' : '"deleted_at" IS NULL';

    const result = await executeQuery<{
      ID: number;
      NAME: string;
      CODE: string;
      DESCRIPTION: string;
      PARENT_DEPARTMENT_ID: number;
      CREATEDAT: string;
      UPDATEDAT: string;
      DELETEDAT: string;
    }>(
      `SELECT
        "id" as ID, "name" as NAME, "code" as CODE, "description" as DESCRIPTION,
        PARENT_DEPARTMENT_ID, "created_at" as CREATEDAT, "updated_at" as UPDATEDAT,
        "deleted_at" as DELETEDAT
       FROM DEPARTMENT
       WHERE ${whereClause}
       ORDER BY "name" ASC`,
      {}
    );

    // 5. 계층 구조로 변환
    const departments = result.rows || [];
    const departmentTree = buildDepartmentTree(departments);

    // 6. 각 부서의 직원 수 조회
    const countResult = await executeQuery<{ DEPARTMENT_ID: number; CNT: number }>(
      `SELECT DEPARTMENT_ID, COUNT(*) as CNT
       FROM EMPLOYEE
       WHERE "deleted_at" IS NULL
       GROUP BY DEPARTMENT_ID`,
      {}
    );

    const countMap = new Map<number, number>();
    (countResult.rows || []).forEach(row => {
      countMap.set(row.DEPARTMENT_ID, row.CNT);
    });

    // 7. 직원 수 추가
    const addEmployeeCount = (depts: any[]): any[] => {
      return depts.map(dept => ({
        ...dept,
        employeeCount: countMap.get(dept.id) || 0,
        children: dept.children ? addEmployeeCount(dept.children) : [],
      }));
    };

    return NextResponse.json({
      data: addEmployeeCount(departmentTree),
    });

  } catch (error) {
    console.error('GET /api/departments error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 계층 구조 빌드 헬퍼
function buildDepartmentTree(departments: any[]): any[] {
  const map = new Map<number, any>();
  const roots: any[] = [];

  // 1. 맵 생성
  departments.forEach(dept => {
    map.set(dept.ID, {
      id: dept.ID,
      name: dept.NAME,
      code: dept.CODE,
      description: dept.DESCRIPTION,
      parentDepartmentId: dept.PARENT_DEPARTMENT_ID,
      createdAt: dept.CREATEDAT,
      updatedAt: dept.UPDATEDAT,
      deletedAt: dept.DELETEDAT,
      children: [],
    });
  });

  // 2. 부모-자식 연결
  map.forEach(dept => {
    if (dept.parentDepartmentId && map.has(dept.parentDepartmentId)) {
      map.get(dept.parentDepartmentId).children.push(dept);
    } else {
      roots.push(dept);
    }
  });

  return roots;
}
```

#### 2. POST /api/departments - 부서 생성

```typescript
// src/app/api/departments/route.ts (이어서)

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. 인증/권한 검증
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // 2. 요청 본문 파싱
    const body = await req.json();
    const { name, code, description, parentDepartmentId } = body;

    // 3. 필수 필드 검증
    const errors: Record<string, string> = {};
    if (!name || name.trim().length === 0) {
      errors.name = '부서명은 필수입니다.';
    }
    if (!code || code.trim().length === 0) {
      errors.code = '부서 코드는 필수입니다.';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
    }

    // 4. 부서명 중복 검증
    const existingName = await executeQuery(
      `SELECT "id" FROM DEPARTMENT WHERE "name" = :name AND "deleted_at" IS NULL`,
      { name: name.trim() }
    );
    if ((existingName.rows || []).length > 0) {
      return NextResponse.json(
        { message: 'Validation failed', errors: { name: '이미 존재하는 부서명입니다.' } },
        { status: 400 }
      );
    }

    // 5. 부서 코드 중복 검증
    const existingCode = await executeQuery(
      `SELECT "id" FROM DEPARTMENT WHERE "code" = :code AND "deleted_at" IS NULL`,
      { code: code.trim() }
    );
    if ((existingCode.rows || []).length > 0) {
      return NextResponse.json(
        { message: 'Validation failed', errors: { code: '이미 존재하는 부서 코드입니다.' } },
        { status: 400 }
      );
    }

    // 6. 상위 부서 검증 (Decision #4, #12: 최대 5단계)
    if (parentDepartmentId) {
      const depth = await getDepartmentDepth(parentDepartmentId);
      if (depth < 0) {
        return NextResponse.json(
          { message: 'Validation failed', errors: { parentDepartmentId: '존재하지 않는 상위 부서입니다.' } },
          { status: 400 }
        );
      }
      if (depth >= 4) { // 이미 4단계이면 자식은 5단계가 됨
        return NextResponse.json(
          { message: 'Validation failed', errors: { parentDepartmentId: '부서 계층은 최대 5단계까지 가능합니다.' } },
          { status: 400 }
        );
      }
    }

    // 7. 부서 생성
    const now = new Date();
    await executeUpdate(
      `INSERT INTO DEPARTMENT ("name", "code", "description", PARENT_DEPARTMENT_ID, "created_at", "updated_at")
       VALUES (:name, :code, :description, :parentDepartmentId, :now, :now)`,
      {
        name: name.trim(),
        code: code.trim(),
        description: description?.trim() || null,
        parentDepartmentId: parentDepartmentId || null,
        now,
      }
    );

    // 8. 생성된 부서 조회
    const created = await executeQuery(
      `SELECT "id" as ID, "name" as NAME, "code" as CODE, "description" as DESCRIPTION,
              PARENT_DEPARTMENT_ID, "created_at" as CREATEDAT, "updated_at" as UPDATEDAT
       FROM DEPARTMENT
       WHERE "code" = :code AND "deleted_at" IS NULL`,
      { code: code.trim() }
    );

    const dept = (created.rows || [])[0];

    return NextResponse.json(
      {
        message: '부서가 생성되었습니다.',
        data: {
          id: dept.ID,
          name: dept.NAME,
          code: dept.CODE,
          description: dept.DESCRIPTION,
          parentDepartmentId: dept.PARENT_DEPARTMENT_ID,
          createdAt: dept.CREATEDAT,
          updatedAt: dept.UPDATEDAT,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST /api/departments error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 부서 깊이 계산 헬퍼
async function getDepartmentDepth(departmentId: number): Promise<number> {
  let depth = 0;
  let currentId: number | null = departmentId;

  while (currentId && depth < 10) { // 무한 루프 방지
    const result = await executeQuery<{ ID: number; PARENT_DEPARTMENT_ID: number }>(
      `SELECT "id" as ID, PARENT_DEPARTMENT_ID FROM DEPARTMENT WHERE "id" = :id AND "deleted_at" IS NULL`,
      { id: currentId }
    );

    const rows = result.rows || [];
    if (rows.length === 0) {
      return depth === 0 ? -1 : depth; // 첫 번째면 존재하지 않음
    }

    currentId = rows[0].PARENT_DEPARTMENT_ID;
    depth++;
  }

  return depth;
}
```

#### 3. PUT /api/departments/[id] - 부서 수정

```typescript
// src/app/api/departments/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeUpdate } from '@/lib/db-direct';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const departmentId = parseInt(id, 10);

    if (isNaN(departmentId)) {
      return NextResponse.json({ message: 'Invalid department ID' }, { status: 400 });
    }

    // 1. 인증/권한 검증
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // 2. 기존 부서 조회
    const existing = await executeQuery(
      `SELECT "id" FROM DEPARTMENT WHERE "id" = :id AND "deleted_at" IS NULL`,
      { id: departmentId }
    );
    if ((existing.rows || []).length === 0) {
      return NextResponse.json({ message: '부서를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 3. 요청 본문 파싱
    const body = await req.json();
    const { name, code, description, parentDepartmentId } = body;

    // 4. 부서명 중복 검증 (자기 제외)
    if (name) {
      const existingName = await executeQuery(
        `SELECT "id" FROM DEPARTMENT WHERE "name" = :name AND "id" != :id AND "deleted_at" IS NULL`,
        { name: name.trim(), id: departmentId }
      );
      if ((existingName.rows || []).length > 0) {
        return NextResponse.json(
          { message: 'Validation failed', errors: { name: '이미 존재하는 부서명입니다.' } },
          { status: 400 }
        );
      }
    }

    // 5. 부서 코드 중복 검증 (자기 제외)
    if (code) {
      const existingCode = await executeQuery(
        `SELECT "id" FROM DEPARTMENT WHERE "code" = :code AND "id" != :id AND "deleted_at" IS NULL`,
        { code: code.trim(), id: departmentId }
      );
      if ((existingCode.rows || []).length > 0) {
        return NextResponse.json(
          { message: 'Validation failed', errors: { code: '이미 존재하는 부서 코드입니다.' } },
          { status: 400 }
        );
      }
    }

    // 6. 상위 부서 변경 검증 (Decision #4, #12)
    if (parentDepartmentId !== undefined) {
      // 6a. 자기 자신을 상위로 설정 불가
      if (parentDepartmentId === departmentId) {
        return NextResponse.json(
          { message: 'Validation failed', errors: { parentDepartmentId: '자기 자신을 상위 부서로 설정할 수 없습니다.' } },
          { status: 400 }
        );
      }

      // 6b. 순환 참조 검증
      if (parentDepartmentId) {
        const isCircular = await checkCircularReference(departmentId, parentDepartmentId);
        if (isCircular) {
          return NextResponse.json(
            { message: 'Validation failed', errors: { parentDepartmentId: '순환 참조가 발생합니다. 하위 부서를 상위로 설정할 수 없습니다.' } },
            { status: 400 }
          );
        }

        // 6c. 깊이 제한 검증 (최대 5단계)
        const parentDepth = await getDepartmentDepth(parentDepartmentId);
        const myMaxChildDepth = await getMaxChildDepth(departmentId);
        if (parentDepth + myMaxChildDepth + 1 > 5) {
          return NextResponse.json(
            { message: 'Validation failed', errors: { parentDepartmentId: '부서 계층은 최대 5단계까지 가능합니다.' } },
            { status: 400 }
          );
        }
      }
    }

    // 7. 업데이트
    const updates: string[] = [];
    const params: any = { id: departmentId, now: new Date() };

    if (name !== undefined) {
      updates.push('"name" = :name');
      params.name = name.trim();
    }
    if (code !== undefined) {
      updates.push('"code" = :code');
      params.code = code.trim();
    }
    if (description !== undefined) {
      updates.push('"description" = :description');
      params.description = description?.trim() || null;
    }
    if (parentDepartmentId !== undefined) {
      updates.push('PARENT_DEPARTMENT_ID = :parentDepartmentId');
      params.parentDepartmentId = parentDepartmentId || null;
    }
    updates.push('"updated_at" = :now');

    await executeUpdate(
      `UPDATE DEPARTMENT SET ${updates.join(', ')} WHERE "id" = :id`,
      params
    );

    // 8. 수정된 부서 조회
    const updated = await executeQuery(
      `SELECT "id" as ID, "name" as NAME, "code" as CODE, "description" as DESCRIPTION,
              PARENT_DEPARTMENT_ID, "created_at" as CREATEDAT, "updated_at" as UPDATEDAT
       FROM DEPARTMENT WHERE "id" = :id`,
      { id: departmentId }
    );

    const dept = (updated.rows || [])[0];

    return NextResponse.json({
      message: '부서가 수정되었습니다.',
      data: {
        id: dept.ID,
        name: dept.NAME,
        code: dept.CODE,
        description: dept.DESCRIPTION,
        parentDepartmentId: dept.PARENT_DEPARTMENT_ID,
        createdAt: dept.CREATEDAT,
        updatedAt: dept.UPDATEDAT,
      },
    });

  } catch (error) {
    console.error('PUT /api/departments/[id] error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 순환 참조 검증 헬퍼
async function checkCircularReference(departmentId: number, newParentId: number): Promise<boolean> {
  // departmentId의 모든 하위 부서를 조회하여 newParentId가 포함되어 있는지 확인
  const descendants = await getAllDescendants(departmentId);
  return descendants.includes(newParentId);
}

// 모든 하위 부서 ID 조회
async function getAllDescendants(departmentId: number): Promise<number[]> {
  const result: number[] = [];
  const queue = [departmentId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = await executeQuery<{ ID: number }>(
      `SELECT "id" as ID FROM DEPARTMENT WHERE PARENT_DEPARTMENT_ID = :id AND "deleted_at" IS NULL`,
      { id: currentId }
    );

    for (const child of (children.rows || [])) {
      result.push(child.ID);
      queue.push(child.ID);
    }
  }

  return result;
}

// 최대 자식 깊이 조회
async function getMaxChildDepth(departmentId: number): Promise<number> {
  let maxDepth = 0;

  async function traverse(id: number, depth: number) {
    maxDepth = Math.max(maxDepth, depth);

    const children = await executeQuery<{ ID: number }>(
      `SELECT "id" as ID FROM DEPARTMENT WHERE PARENT_DEPARTMENT_ID = :id AND "deleted_at" IS NULL`,
      { id }
    );

    for (const child of (children.rows || [])) {
      await traverse(child.ID, depth + 1);
    }
  }

  await traverse(departmentId, 0);
  return maxDepth;
}
```

#### 4. DELETE /api/departments/[id] - 부서 삭제

```typescript
// src/app/api/departments/[id]/route.ts (이어서)

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const departmentId = parseInt(id, 10);

    if (isNaN(departmentId)) {
      return NextResponse.json({ message: 'Invalid department ID' }, { status: 400 });
    }

    // 1. 인증/권한 검증
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // 2. 부서 존재 확인
    const existing = await executeQuery(
      `SELECT "id", "name" FROM DEPARTMENT WHERE "id" = :id AND "deleted_at" IS NULL`,
      { id: departmentId }
    );
    if ((existing.rows || []).length === 0) {
      return NextResponse.json({ message: '부서를 찾을 수 없습니다.' }, { status: 404 });
    }

    const deptName = (existing.rows || [])[0].NAME;

    // 3. 자식 부서 확인 (Decision #7)
    const childDepts = await executeQuery(
      `SELECT COUNT(*) as CNT FROM DEPARTMENT WHERE PARENT_DEPARTMENT_ID = :id AND "deleted_at" IS NULL`,
      { id: departmentId }
    );
    const childCount = (childDepts.rows || [])[0]?.CNT || 0;
    if (childCount > 0) {
      return NextResponse.json(
        {
          message: '하위 부서가 존재하여 삭제할 수 없습니다.',
          dependencies: [{ type: '하위 부서', count: childCount }],
        },
        { status: 400 }
      );
    }

    // 4. 활성 직원 확인 (Decision #7)
    const employees = await executeQuery(
      `SELECT COUNT(*) as CNT FROM EMPLOYEE WHERE DEPARTMENT_ID = :id AND "deleted_at" IS NULL`,
      { id: departmentId }
    );
    const employeeCount = (employees.rows || [])[0]?.CNT || 0;
    if (employeeCount > 0) {
      return NextResponse.json(
        {
          message: '소속 직원이 존재하여 삭제할 수 없습니다.',
          dependencies: [{ type: '소속 직원', count: employeeCount }],
        },
        { status: 400 }
      );
    }

    // 5. Soft delete 실행
    await executeUpdate(
      `UPDATE DEPARTMENT SET "deleted_at" = :now, "updated_at" = :now WHERE "id" = :id`,
      { id: departmentId, now: new Date() }
    );

    return NextResponse.json({
      message: `'${deptName}' 부서가 삭제되었습니다.`,
    });

  } catch (error) {
    console.error('DELETE /api/departments/[id] error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Acceptance Criteria

- [ ] GET /api/departments - 부서 목록 계층 구조로 반환
- [ ] GET /api/departments - 각 부서별 직원 수 포함
- [ ] POST /api/departments - 부서 생성 성공
- [ ] POST /api/departments - 부서명/코드 중복 검증
- [ ] POST /api/departments - 계층 깊이 제한 (5단계) 검증
- [ ] PUT /api/departments/[id] - 부서 수정 성공
- [ ] PUT /api/departments/[id] - 순환 참조 방지 검증
- [ ] PUT /api/departments/[id] - 깊이 제한 검증
- [ ] DELETE /api/departments/[id] - 자식 부서 존재 시 삭제 거부
- [ ] DELETE /api/departments/[id] - 활성 직원 존재 시 삭제 거부
- [ ] DELETE /api/departments/[id] - Soft delete 성공
- [ ] 모든 엔드포인트 ADMIN 권한 검증

---

## 테스트 전략

### 단위 테스트

```typescript
describe('GET /api/departments', () => {
  it('should return department tree structure', async () => { });
  it('should include employee count', async () => { });
  it('should reject non-ADMIN users', async () => { });
});

describe('POST /api/departments', () => {
  it('should create department successfully', async () => { });
  it('should validate name uniqueness', async () => { });
  it('should enforce max depth of 5', async () => { });
});

describe('PUT /api/departments/[id]', () => {
  it('should update department successfully', async () => { });
  it('should prevent circular reference', async () => { });
});

describe('DELETE /api/departments/[id]', () => {
  it('should prevent deletion with child departments', async () => { });
  it('should prevent deletion with active employees', async () => { });
});
```

---

## 완료 체크리스트

- [ ] GET /api/departments 구현
- [ ] POST /api/departments 구현
- [ ] PUT /api/departments/[id] 구현
- [ ] DELETE /api/departments/[id] 구현
- [ ] TypeScript 빌드 성공
- [ ] 단위 테스트 통과
- [ ] 스테이징 서버 검증

---

**다음 문서**: 2091_04_API_직급_CRUD.md
