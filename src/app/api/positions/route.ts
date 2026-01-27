// Generated: 2026-01-27 23:50:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeUpdate } from '@/lib/db-direct';
import type { Position } from '@/types/employee';

export const dynamic = 'force-dynamic';

// ============================================================
// GET /api/positions - 직급 목록 조회
// ============================================================

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

    // 4. 직급 목록 조회
    const whereClause = includeDeleted ? '1=1' : 'DELETED_AT IS NULL';

    const result = await executeQuery<{
      ID: number;
      NAME: string;
      CODE: string;
      LVL: number;
      CREATED_AT: Date;
      UPDATED_AT: Date;
      DELETED_AT: Date | null;
    }>(
      `SELECT ID, NAME, CODE, LVL, CREATED_AT, UPDATED_AT, DELETED_AT
       FROM POSITION
       WHERE ${whereClause}
       ORDER BY LVL ASC, NAME ASC`,
      {}
    );

    // 5. 응답 변환
    const positions: Position[] = (result.rows || []).map(row => ({
      id: row.ID,
      name: row.NAME,
      code: row.CODE,
      level: row.LVL,
      createdAt: row.CREATED_AT?.toISOString() || '',
      updatedAt: row.UPDATED_AT?.toISOString() || '',
      deletedAt: row.DELETED_AT?.toISOString(),
    }));

    return NextResponse.json({ data: positions });

  } catch (error) {
    console.error('GET /api/positions error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/positions - 직급 생성
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
    let body: { name?: string; level?: number };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const { name, level } = body;

    // 3. 필수 필드 검증
    const errors: Record<string, string> = {};
    if (!name || name.trim().length === 0) {
      errors.name = '직급명은 필수입니다.';
    }
    if (level === undefined || level === null) {
      errors.level = '직급 레벨은 필수입니다.';
    } else if (level < 1 || level > 10) {
      errors.level = '직급 레벨은 1~10 사이여야 합니다.';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
    }

    // 4. 직급명 중복 검증
    const existingName = await executeQuery(
      `SELECT ID FROM POSITION WHERE NAME = :name AND DELETED_AT IS NULL`,
      { name: name!.trim() }
    );
    if ((existingName.rows || []).length > 0) {
      return NextResponse.json(
        { message: 'Validation failed', errors: { name: '이미 존재하는 직급명입니다.' } },
        { status: 400 }
      );
    }

    // 5. 직급 코드 생성 (Decision #10: Oracle SEQUENCE)
    const seqResult = await executeQuery<{ NEXTVAL: number }>(
      `SELECT POSITION_CODE_SEQ.NEXTVAL as NEXTVAL FROM DUAL`,
      {}
    );
    const seqNum = (seqResult.rows || [])[0]?.NEXTVAL || 1;
    const code = `POS-${String(seqNum).padStart(5, '0')}`;

    // 6. 직급 생성
    const now = new Date();
    await executeUpdate(
      `INSERT INTO POSITION (NAME, CODE, LVL, CREATED_AT, UPDATED_AT)
       VALUES (:name, :code, :lvl, :now, :now)`,
      {
        name: name!.trim(),
        code,
        lvl: level,
        now,
      }
    );

    // 7. 생성된 직급 조회
    const created = await executeQuery<{
      ID: number;
      NAME: string;
      CODE: string;
      LVL: number;
      CREATED_AT: Date;
      UPDATED_AT: Date;
    }>(
      `SELECT ID, NAME, CODE, LVL, CREATED_AT, UPDATED_AT
       FROM POSITION
       WHERE CODE = :code AND DELETED_AT IS NULL`,
      { code }
    );

    const pos = (created.rows || [])[0];

    return NextResponse.json(
      {
        message: '직급이 생성되었습니다.',
        data: {
          id: pos.ID,
          name: pos.NAME,
          code: pos.CODE,
          level: pos.LVL,
          createdAt: pos.CREATED_AT?.toISOString() || '',
          updatedAt: pos.UPDATED_AT?.toISOString() || '',
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST /api/positions error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
