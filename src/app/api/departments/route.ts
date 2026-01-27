// Generated: 2026-01-27 23:45:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeUpdate } from '@/lib/db-direct';
import type { DepartmentWithChildren } from '@/types/employee';

export const dynamic = 'force-dynamic';

// ============================================================
// GET /api/departments - 부서 목록 조회 (계층 구조)
// 권한: 모든 인증 사용자 (USER, MANAGER, ADMIN)
// ============================================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. 인증 검증
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 2. 쿼리 파라미터
    const searchParams = req.nextUrl.searchParams;
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    // 4. 부서 목록 조회 (계층 구조용 데이터)
    const whereClause = includeDeleted ? '1=1' : 'DELETED_AT IS NULL';

    const result = await executeQuery<{
      ID: number;
      NAME: string;
      CODE: string;
      DESCRIPTION: string | null;
      PARENT_DEPARTMENT_ID: number | null;
      CREATED_AT: Date;
      UPDATED_AT: Date;
      DELETED_AT: Date | null;
    }>(
      `SELECT ID, NAME, CODE, DESCRIPTION, PARENT_DEPARTMENT_ID,
              CREATED_AT, UPDATED_AT, DELETED_AT
       FROM DEPARTMENT
       WHERE ${whereClause}
       ORDER BY NAME ASC`,
      {}
    );

    // 5. 각 부서의 직원 수 조회
    const countResult = await executeQuery<{ DEPARTMENT_ID: number; CNT: number }>(
      `SELECT DEPARTMENT_ID, COUNT(*) as CNT
       FROM EMPLOYEE
       WHERE DELETED_AT IS NULL
       GROUP BY DEPARTMENT_ID`,
      {}
    );

    const countMap = new Map<number, number>();
    (countResult.rows || []).forEach(row => {
      countMap.set(row.DEPARTMENT_ID, row.CNT);
    });

    // 6. 계층 구조로 변환
    const departments = result.rows || [];
    const departmentTree = buildDepartmentTree(departments, countMap);

    return NextResponse.json({
      data: departmentTree,
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
function buildDepartmentTree(
  departments: Array<{
    ID: number;
    NAME: string;
    CODE: string;
    DESCRIPTION: string | null;
    PARENT_DEPARTMENT_ID: number | null;
    CREATED_AT: Date;
    UPDATED_AT: Date;
    DELETED_AT: Date | null;
  }>,
  countMap: Map<number, number>
): DepartmentWithChildren[] {
  const map = new Map<number, DepartmentWithChildren>();
  const roots: DepartmentWithChildren[] = [];

  // 1. 맵 생성
  departments.forEach(dept => {
    map.set(dept.ID, {
      id: dept.ID,
      name: dept.NAME,
      code: dept.CODE,
      description: dept.DESCRIPTION || undefined,
      parentDepartmentId: dept.PARENT_DEPARTMENT_ID || undefined,
      createdAt: dept.CREATED_AT?.toISOString() || '',
      updatedAt: dept.UPDATED_AT?.toISOString() || '',
      deletedAt: dept.DELETED_AT?.toISOString(),
      children: [],
      employeeCount: countMap.get(dept.ID) || 0,
    });
  });

  // 2. 부모-자식 연결
  map.forEach(dept => {
    if (dept.parentDepartmentId && map.has(dept.parentDepartmentId)) {
      const parent = map.get(dept.parentDepartmentId)!;
      if (!parent.children) parent.children = [];
      parent.children.push(dept);
    } else {
      roots.push(dept);
    }
  });

  return roots;
}

// ============================================================
// POST /api/departments - 부서 생성
// ============================================================

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
    let body: { name?: string; code?: string; description?: string; parentDepartmentId?: number };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

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
      `SELECT ID FROM DEPARTMENT WHERE NAME = :name AND DELETED_AT IS NULL`,
      { name: name!.trim() }
    );
    if ((existingName.rows || []).length > 0) {
      return NextResponse.json(
        { message: 'Validation failed', errors: { name: '이미 존재하는 부서명입니다.' } },
        { status: 400 }
      );
    }

    // 5. 부서 코드 중복 검증
    const existingCode = await executeQuery(
      `SELECT ID FROM DEPARTMENT WHERE CODE = :code AND DELETED_AT IS NULL`,
      { code: code!.trim() }
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
      `INSERT INTO DEPARTMENT (NAME, CODE, DESCRIPTION, PARENT_DEPARTMENT_ID, CREATED_AT, UPDATED_AT)
       VALUES (:name, :code, :description, :parentDepartmentId, :now, :now)`,
      {
        name: name!.trim(),
        code: code!.trim(),
        description: description?.trim() || null,
        parentDepartmentId: parentDepartmentId || null,
        now,
      }
    );

    // 8. 생성된 부서 조회
    const created = await executeQuery<{
      ID: number;
      NAME: string;
      CODE: string;
      DESCRIPTION: string | null;
      PARENT_DEPARTMENT_ID: number | null;
      CREATED_AT: Date;
      UPDATED_AT: Date;
    }>(
      `SELECT ID, NAME, CODE, DESCRIPTION, PARENT_DEPARTMENT_ID, CREATED_AT, UPDATED_AT
       FROM DEPARTMENT
       WHERE CODE = :code AND DELETED_AT IS NULL`,
      { code: code!.trim() }
    );

    const dept = (created.rows || [])[0];

    return NextResponse.json(
      {
        message: '부서가 생성되었습니다.',
        data: {
          id: dept.ID,
          name: dept.NAME,
          code: dept.CODE,
          description: dept.DESCRIPTION || undefined,
          parentDepartmentId: dept.PARENT_DEPARTMENT_ID || undefined,
          createdAt: dept.CREATED_AT?.toISOString() || '',
          updatedAt: dept.UPDATED_AT?.toISOString() || '',
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

// ============================================================
// Helper Functions
// ============================================================

// 부서 깊이 계산 헬퍼 (1-based: 루트 부서 = 1단계)
async function getDepartmentDepth(departmentId: number): Promise<number> {
  let depth = 0;
  let currentId: number | null = departmentId;

  while (currentId !== null && depth < 10) { // 무한 루프 방지
    const queryResult = await executeQuery<{ ID: number; PARENT_DEPARTMENT_ID: number | null }>(
      `SELECT ID, PARENT_DEPARTMENT_ID FROM DEPARTMENT WHERE ID = :id AND DELETED_AT IS NULL`,
      { id: currentId }
    );

    const deptRows: Array<{ ID: number; PARENT_DEPARTMENT_ID: number | null }> = queryResult.rows || [];
    if (deptRows.length === 0) {
      return depth === 0 ? -1 : depth; // 첫 번째면 존재하지 않음
    }

    currentId = deptRows[0].PARENT_DEPARTMENT_ID;
    depth++;
  }

  return depth;
}
