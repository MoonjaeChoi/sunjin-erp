// Generated: 2026-01-27 23:45:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeUpdate } from '@/lib/db-direct';

export const dynamic = 'force-dynamic';

// ============================================================
// GET /api/departments/[id] - 부서 상세 조회
// ============================================================

export async function GET(
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

    // 2. 부서 조회
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
       WHERE ID = :id AND DELETED_AT IS NULL`,
      { id: departmentId }
    );

    if ((result.rows || []).length === 0) {
      return NextResponse.json({ message: '부서를 찾을 수 없습니다.' }, { status: 404 });
    }

    const dept = result.rows[0];

    // 3. 상위 부서 정보 조회
    let parentDepartment = null;
    if (dept.PARENT_DEPARTMENT_ID) {
      const parentResult = await executeQuery<{ ID: number; NAME: string; CODE: string }>(
        `SELECT ID, NAME, CODE FROM DEPARTMENT WHERE ID = :id AND DELETED_AT IS NULL`,
        { id: dept.PARENT_DEPARTMENT_ID }
      );
      if ((parentResult.rows || []).length > 0) {
        const parent = parentResult.rows[0];
        parentDepartment = {
          id: parent.ID,
          name: parent.NAME,
          code: parent.CODE,
        };
      }
    }

    // 4. 직원 수 조회
    const countResult = await executeQuery<{ CNT: number }>(
      `SELECT COUNT(*) as CNT FROM EMPLOYEE WHERE DEPARTMENT_ID = :id AND DELETED_AT IS NULL`,
      { id: departmentId }
    );
    const employeeCount = countResult.rows[0]?.CNT || 0;

    return NextResponse.json({
      data: {
        id: dept.ID,
        name: dept.NAME,
        code: dept.CODE,
        description: dept.DESCRIPTION || undefined,
        parentDepartmentId: dept.PARENT_DEPARTMENT_ID || undefined,
        parentDepartment,
        createdAt: dept.CREATED_AT?.toISOString() || '',
        updatedAt: dept.UPDATED_AT?.toISOString() || '',
        employeeCount,
      },
    });

  } catch (error) {
    console.error('GET /api/departments/[id] error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT /api/departments/[id] - 부서 수정
// ============================================================

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
    const existing = await executeQuery<{ ID: number }>(
      `SELECT ID FROM DEPARTMENT WHERE ID = :id AND DELETED_AT IS NULL`,
      { id: departmentId }
    );
    if ((existing.rows || []).length === 0) {
      return NextResponse.json({ message: '부서를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 3. 요청 본문 파싱
    let body: { name?: string; code?: string; description?: string | null; parentDepartmentId?: number | null };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const { name, code, description, parentDepartmentId } = body;

    // 4. 부서명 중복 검증 (자기 제외)
    if (name !== undefined && name !== null) {
      const existingName = await executeQuery(
        `SELECT ID FROM DEPARTMENT WHERE NAME = :name AND ID != :id AND DELETED_AT IS NULL`,
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
    if (code !== undefined && code !== null) {
      const existingCode = await executeQuery(
        `SELECT ID FROM DEPARTMENT WHERE CODE = :code AND ID != :id AND DELETED_AT IS NULL`,
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

      // 6b. 순환 참조 검증 및 깊이 제한
      if (parentDepartmentId !== null) {
        // 상위 부서 존재 확인
        const parentExists = await executeQuery(
          `SELECT ID FROM DEPARTMENT WHERE ID = :id AND DELETED_AT IS NULL`,
          { id: parentDepartmentId }
        );
        if ((parentExists.rows || []).length === 0) {
          return NextResponse.json(
            { message: 'Validation failed', errors: { parentDepartmentId: '존재하지 않는 상위 부서입니다.' } },
            { status: 400 }
          );
        }

        // 순환 참조 검증
        const isCircular = await checkCircularReference(departmentId, parentDepartmentId);
        if (isCircular) {
          return NextResponse.json(
            { message: 'Validation failed', errors: { parentDepartmentId: '순환 참조가 발생합니다. 하위 부서를 상위로 설정할 수 없습니다.' } },
            { status: 400 }
          );
        }

        // 깊이 제한 검증 (최대 5단계)
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

    // 7. 업데이트 쿼리 구성
    const updates: string[] = [];
    const updateParams: Record<string, any> = { id: departmentId, now: new Date() };

    if (name !== undefined && name !== null) {
      updates.push('NAME = :name');
      updateParams.name = name.trim();
    }
    if (code !== undefined && code !== null) {
      updates.push('CODE = :code');
      updateParams.code = code.trim();
    }
    if (description !== undefined) {
      updates.push('DESCRIPTION = :description');
      updateParams.description = description?.trim() || null;
    }
    if (parentDepartmentId !== undefined) {
      updates.push('PARENT_DEPARTMENT_ID = :parentDepartmentId');
      updateParams.parentDepartmentId = parentDepartmentId;
    }
    updates.push('UPDATED_AT = :now');

    await executeUpdate(
      `UPDATE DEPARTMENT SET ${updates.join(', ')} WHERE ID = :id`,
      updateParams
    );

    // 8. 수정된 부서 조회
    const updated = await executeQuery<{
      ID: number;
      NAME: string;
      CODE: string;
      DESCRIPTION: string | null;
      PARENT_DEPARTMENT_ID: number | null;
      CREATED_AT: Date;
      UPDATED_AT: Date;
    }>(
      `SELECT ID, NAME, CODE, DESCRIPTION, PARENT_DEPARTMENT_ID, CREATED_AT, UPDATED_AT
       FROM DEPARTMENT WHERE ID = :id`,
      { id: departmentId }
    );

    const dept = (updated.rows || [])[0];

    return NextResponse.json({
      message: '부서가 수정되었습니다.',
      data: {
        id: dept.ID,
        name: dept.NAME,
        code: dept.CODE,
        description: dept.DESCRIPTION || undefined,
        parentDepartmentId: dept.PARENT_DEPARTMENT_ID || undefined,
        createdAt: dept.CREATED_AT?.toISOString() || '',
        updatedAt: dept.UPDATED_AT?.toISOString() || '',
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

// ============================================================
// DELETE /api/departments/[id] - 부서 삭제 (Soft Delete)
// ============================================================

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
    const existing = await executeQuery<{ ID: number; NAME: string }>(
      `SELECT ID, NAME FROM DEPARTMENT WHERE ID = :id AND DELETED_AT IS NULL`,
      { id: departmentId }
    );
    if ((existing.rows || []).length === 0) {
      return NextResponse.json({ message: '부서를 찾을 수 없습니다.' }, { status: 404 });
    }

    const deptName = existing.rows[0].NAME;

    // 3. 자식 부서 확인 (Decision #7)
    const childDepts = await executeQuery<{ CNT: number }>(
      `SELECT COUNT(*) as CNT FROM DEPARTMENT WHERE PARENT_DEPARTMENT_ID = :id AND DELETED_AT IS NULL`,
      { id: departmentId }
    );
    const childCount = childDepts.rows[0]?.CNT || 0;
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
    const employees = await executeQuery<{ CNT: number }>(
      `SELECT COUNT(*) as CNT FROM EMPLOYEE WHERE DEPARTMENT_ID = :id AND DELETED_AT IS NULL`,
      { id: departmentId }
    );
    const employeeCount = employees.rows[0]?.CNT || 0;
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
    const now = new Date();
    await executeUpdate(
      `UPDATE DEPARTMENT SET DELETED_AT = :now, UPDATED_AT = :now WHERE ID = :id`,
      { id: departmentId, now }
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

// ============================================================
// Helper Functions
// ============================================================

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
      `SELECT ID FROM DEPARTMENT WHERE PARENT_DEPARTMENT_ID = :id AND DELETED_AT IS NULL`,
      { id: currentId }
    );

    for (const child of (children.rows || [])) {
      result.push(child.ID);
      queue.push(child.ID);
    }
  }

  return result;
}

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
      return depth === 0 ? -1 : depth;
    }

    currentId = deptRows[0].PARENT_DEPARTMENT_ID;
    depth++;
  }

  return depth;
}

// 최대 자식 깊이 조회
async function getMaxChildDepth(departmentId: number): Promise<number> {
  let maxDepth = 0;

  async function traverse(id: number, depth: number) {
    maxDepth = Math.max(maxDepth, depth);

    const children = await executeQuery<{ ID: number }>(
      `SELECT ID FROM DEPARTMENT WHERE PARENT_DEPARTMENT_ID = :id AND DELETED_AT IS NULL`,
      { id }
    );

    for (const child of (children.rows || [])) {
      await traverse(child.ID, depth + 1);
    }
  }

  await traverse(departmentId, 0);
  return maxDepth;
}
