// Generated: 2026-01-27 23:50:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeUpdate } from '@/lib/db-direct';

export const dynamic = 'force-dynamic';

// ============================================================
// GET /api/positions/[id] - 직급 상세 조회
// ============================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const positionId = parseInt(id, 10);

    if (isNaN(positionId)) {
      return NextResponse.json({ message: 'Invalid position ID' }, { status: 400 });
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

    // 2. 직급 조회
    const result = await executeQuery<{
      ID: number;
      NAME: string;
      CODE: string;
      LVL: number;
      CREATED_AT: Date;
      UPDATED_AT: Date;
    }>(
      `SELECT ID, NAME, CODE, LVL, CREATED_AT, UPDATED_AT
       FROM POSITION
       WHERE ID = :id AND DELETED_AT IS NULL`,
      { id: positionId }
    );

    const rows = result.rows || [];
    if (rows.length === 0) {
      return NextResponse.json({ message: '직급을 찾을 수 없습니다.' }, { status: 404 });
    }

    const pos = rows[0];

    // 3. 소속 직원 수 조회
    const countResult = await executeQuery<{ CNT: number }>(
      `SELECT COUNT(*) as CNT FROM EMPLOYEE WHERE POSITION_ID = :id AND DELETED_AT IS NULL`,
      { id: positionId }
    );
    const employeeCount = countResult.rows[0]?.CNT || 0;

    return NextResponse.json({
      data: {
        id: pos.ID,
        name: pos.NAME,
        code: pos.CODE,
        level: pos.LVL,
        createdAt: pos.CREATED_AT?.toISOString() || '',
        updatedAt: pos.UPDATED_AT?.toISOString() || '',
        employeeCount,
      },
    });

  } catch (error) {
    console.error('GET /api/positions/[id] error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT /api/positions/[id] - 직급 수정
// ============================================================

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const positionId = parseInt(id, 10);

    if (isNaN(positionId)) {
      return NextResponse.json({ message: 'Invalid position ID' }, { status: 400 });
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

    // 2. 기존 직급 조회
    const existing = await executeQuery(
      `SELECT ID FROM POSITION WHERE ID = :id AND DELETED_AT IS NULL`,
      { id: positionId }
    );
    if ((existing.rows || []).length === 0) {
      return NextResponse.json({ message: '직급을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 3. 요청 본문 파싱
    let body: { name?: string; level?: number };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const { name, level } = body;

    // 4. 유효성 검증
    const errors: Record<string, string> = {};
    if (level !== undefined && (level < 1 || level > 10)) {
      errors.level = '직급 레벨은 1~10 사이여야 합니다.';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
    }

    // 5. 직급명 중복 검증 (자기 제외)
    if (name !== undefined && name !== null) {
      const existingName = await executeQuery(
        `SELECT ID FROM POSITION WHERE NAME = :name AND ID != :id AND DELETED_AT IS NULL`,
        { name: name.trim(), id: positionId }
      );
      if ((existingName.rows || []).length > 0) {
        return NextResponse.json(
          { message: 'Validation failed', errors: { name: '이미 존재하는 직급명입니다.' } },
          { status: 400 }
        );
      }
    }

    // 6. 업데이트 쿼리 구성
    const updates: string[] = [];
    const updateParams: Record<string, any> = { id: positionId, now: new Date() };

    if (name !== undefined && name !== null) {
      updates.push('NAME = :name');
      updateParams.name = name.trim();
    }
    if (level !== undefined) {
      updates.push('LVL = :lvl');
      updateParams.lvl = level;
    }
    updates.push('UPDATED_AT = :now');

    await executeUpdate(
      `UPDATE POSITION SET ${updates.join(', ')} WHERE ID = :id`,
      updateParams
    );

    // 7. 수정된 직급 조회
    const updated = await executeQuery<{
      ID: number;
      NAME: string;
      CODE: string;
      LVL: number;
      CREATED_AT: Date;
      UPDATED_AT: Date;
    }>(
      `SELECT ID, NAME, CODE, LVL, CREATED_AT, UPDATED_AT
       FROM POSITION WHERE ID = :id`,
      { id: positionId }
    );

    const pos = (updated.rows || [])[0];

    return NextResponse.json({
      message: '직급이 수정되었습니다.',
      data: {
        id: pos.ID,
        name: pos.NAME,
        code: pos.CODE,
        level: pos.LVL,
        createdAt: pos.CREATED_AT?.toISOString() || '',
        updatedAt: pos.UPDATED_AT?.toISOString() || '',
      },
    });

  } catch (error) {
    console.error('PUT /api/positions/[id] error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE /api/positions/[id] - 직급 삭제 (Soft Delete)
// ============================================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const positionId = parseInt(id, 10);

    if (isNaN(positionId)) {
      return NextResponse.json({ message: 'Invalid position ID' }, { status: 400 });
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

    // 2. 직급 존재 확인
    const existing = await executeQuery<{ ID: number; NAME: string }>(
      `SELECT ID, NAME FROM POSITION WHERE ID = :id AND DELETED_AT IS NULL`,
      { id: positionId }
    );
    if ((existing.rows || []).length === 0) {
      return NextResponse.json({ message: '직급을 찾을 수 없습니다.' }, { status: 404 });
    }

    const posName = existing.rows[0].NAME;

    // 3. 소속 직원 확인
    const employees = await executeQuery<{ CNT: number }>(
      `SELECT COUNT(*) as CNT FROM EMPLOYEE WHERE POSITION_ID = :id AND DELETED_AT IS NULL`,
      { id: positionId }
    );
    const employeeCount = employees.rows[0]?.CNT || 0;
    if (employeeCount > 0) {
      return NextResponse.json(
        {
          message: '해당 직급을 가진 직원이 존재하여 삭제할 수 없습니다.',
          dependencies: [{ type: '소속 직원', count: employeeCount }],
        },
        { status: 400 }
      );
    }

    // 4. Soft delete 실행
    const now = new Date();
    await executeUpdate(
      `UPDATE POSITION SET DELETED_AT = :now, UPDATED_AT = :now WHERE ID = :id`,
      { id: positionId, now }
    );

    return NextResponse.json({
      message: `'${posName}' 직급이 삭제되었습니다.`,
    });

  } catch (error) {
    console.error('DELETE /api/positions/[id] error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
