<!-- Generated: 2026-01-28 05:00:00 KST -->

# API - 직급 CRUD

**문서 번호**: 2091_04
**원본 PRD**: 2091_직원_관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.2 API Route Handlers', 'US-2' 참조
**구현 범위**: `/api/positions` 엔드포인트 (GET, POST, PUT, DELETE)
**복잡도**: M (1-2일)
**의존성**: 2091_01, 2091_02, 2091_03

---

## 구현 목표

직급(Position) 관리를 위한 REST API를 구현합니다. Oracle SEQUENCE를 사용한 코드 자동 생성(Decision #10)을 포함합니다.

---

## 구현 내용

### 파일 구조

```
src/app/api/
└── positions/
    ├── route.ts           # GET (list), POST (create)
    └── [id]/
        └── route.ts       # GET (detail), PUT (update), DELETE (soft delete)
```

### API 명세

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/positions` | 직급 목록 조회 | ADMIN |
| POST | `/api/positions` | 직급 생성 | ADMIN |
| GET | `/api/positions/[id]` | 직급 상세 조회 | ADMIN |
| PUT | `/api/positions/[id]` | 직급 수정 | ADMIN |
| DELETE | `/api/positions/[id]` | 직급 삭제 (soft delete) | ADMIN |

### 구현 상세

#### 1. GET /api/positions - 직급 목록 조회

```typescript
// src/app/api/positions/route.ts

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

    // 4. 직급 목록 조회
    const whereClause = includeDeleted ? '1=1' : '"deleted_at" IS NULL';

    const result = await executeQuery<{
      ID: number;
      NAME: string;
      CODE: string;
      LEVEL: number;
      CREATEDAT: string;
      UPDATEDAT: string;
      DELETEDAT: string;
    }>(
      `SELECT
        "id" as ID, "name" as NAME, "code" as CODE, "level" as LEVEL,
        "created_at" as CREATEDAT, "updated_at" as UPDATEDAT, "deleted_at" as DELETEDAT
       FROM POSITION
       WHERE ${whereClause}
       ORDER BY "level" ASC, "name" ASC`,
      {}
    );

    // 5. 응답 변환
    const positions = (result.rows || []).map(row => ({
      id: row.ID,
      name: row.NAME,
      code: row.CODE,
      level: row.LEVEL,
      createdAt: row.CREATEDAT,
      updatedAt: row.UPDATEDAT,
      deletedAt: row.DELETEDAT,
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
```

#### 2. POST /api/positions - 직급 생성

```typescript
// src/app/api/positions/route.ts (이어서)

import { executeUpdate } from '@/lib/db-direct';

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
      `SELECT "id" FROM POSITION WHERE "name" = :name AND "deleted_at" IS NULL`,
      { name: name.trim() }
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
      `INSERT INTO POSITION ("name", "code", "level", "created_at", "updated_at")
       VALUES (:name, :code, :level, :now, :now)`,
      {
        name: name.trim(),
        code,
        level,
        now,
      }
    );

    // 7. 생성된 직급 조회
    const created = await executeQuery<{
      ID: number;
      NAME: string;
      CODE: string;
      LEVEL: number;
      CREATEDAT: string;
      UPDATEDAT: string;
    }>(
      `SELECT "id" as ID, "name" as NAME, "code" as CODE, "level" as LEVEL,
              "created_at" as CREATEDAT, "updated_at" as UPDATEDAT
       FROM POSITION
       WHERE "code" = :code AND "deleted_at" IS NULL`,
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
          level: pos.LEVEL,
          createdAt: pos.CREATEDAT,
          updatedAt: pos.UPDATEDAT,
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
```

#### 3. GET /api/positions/[id] - 직급 상세 조회

```typescript
// src/app/api/positions/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeUpdate } from '@/lib/db-direct';

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
      LEVEL: number;
      CREATEDAT: string;
      UPDATEDAT: string;
    }>(
      `SELECT "id" as ID, "name" as NAME, "code" as CODE, "level" as LEVEL,
              "created_at" as CREATEDAT, "updated_at" as UPDATEDAT
       FROM POSITION
       WHERE "id" = :id AND "deleted_at" IS NULL`,
      { id: positionId }
    );

    const rows = result.rows || [];
    if (rows.length === 0) {
      return NextResponse.json({ message: '직급을 찾을 수 없습니다.' }, { status: 404 });
    }

    const pos = rows[0];

    return NextResponse.json({
      data: {
        id: pos.ID,
        name: pos.NAME,
        code: pos.CODE,
        level: pos.LEVEL,
        createdAt: pos.CREATEDAT,
        updatedAt: pos.UPDATEDAT,
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
```

#### 4. PUT /api/positions/[id] - 직급 수정

```typescript
// src/app/api/positions/[id]/route.ts (이어서)

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
      `SELECT "id" FROM POSITION WHERE "id" = :id AND "deleted_at" IS NULL`,
      { id: positionId }
    );
    if ((existing.rows || []).length === 0) {
      return NextResponse.json({ message: '직급을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 3. 요청 본문 파싱
    const body = await req.json();
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
    if (name) {
      const existingName = await executeQuery(
        `SELECT "id" FROM POSITION WHERE "name" = :name AND "id" != :id AND "deleted_at" IS NULL`,
        { name: name.trim(), id: positionId }
      );
      if ((existingName.rows || []).length > 0) {
        return NextResponse.json(
          { message: 'Validation failed', errors: { name: '이미 존재하는 직급명입니다.' } },
          { status: 400 }
        );
      }
    }

    // 6. 업데이트
    const updates: string[] = [];
    const updateParams: any = { id: positionId, now: new Date() };

    if (name !== undefined) {
      updates.push('"name" = :name');
      updateParams.name = name.trim();
    }
    if (level !== undefined) {
      updates.push('"level" = :level');
      updateParams.level = level;
    }
    updates.push('"updated_at" = :now');

    await executeUpdate(
      `UPDATE POSITION SET ${updates.join(', ')} WHERE "id" = :id`,
      updateParams
    );

    // 7. 수정된 직급 조회
    const updated = await executeQuery<{
      ID: number;
      NAME: string;
      CODE: string;
      LEVEL: number;
      CREATEDAT: string;
      UPDATEDAT: string;
    }>(
      `SELECT "id" as ID, "name" as NAME, "code" as CODE, "level" as LEVEL,
              "created_at" as CREATEDAT, "updated_at" as UPDATEDAT
       FROM POSITION WHERE "id" = :id`,
      { id: positionId }
    );

    const pos = (updated.rows || [])[0];

    return NextResponse.json({
      message: '직급이 수정되었습니다.',
      data: {
        id: pos.ID,
        name: pos.NAME,
        code: pos.CODE,
        level: pos.LEVEL,
        createdAt: pos.CREATEDAT,
        updatedAt: pos.UPDATEDAT,
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
```

#### 5. DELETE /api/positions/[id] - 직급 삭제

```typescript
// src/app/api/positions/[id]/route.ts (이어서)

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
      `SELECT "id" as ID, "name" as NAME FROM POSITION WHERE "id" = :id AND "deleted_at" IS NULL`,
      { id: positionId }
    );
    if ((existing.rows || []).length === 0) {
      return NextResponse.json({ message: '직급을 찾을 수 없습니다.' }, { status: 404 });
    }

    const posName = (existing.rows || [])[0].NAME;

    // 3. 소속 직원 확인
    const employees = await executeQuery<{ CNT: number }>(
      `SELECT COUNT(*) as CNT FROM EMPLOYEE WHERE POSITION_ID = :id AND "deleted_at" IS NULL`,
      { id: positionId }
    );
    const employeeCount = (employees.rows || [])[0]?.CNT || 0;
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
    await executeUpdate(
      `UPDATE POSITION SET "deleted_at" = :now, "updated_at" = :now WHERE "id" = :id`,
      { id: positionId, now: new Date() }
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
```

---

## Acceptance Criteria

- [ ] GET /api/positions - 직급 목록 조회 (level 순 정렬)
- [ ] POST /api/positions - 직급 생성 성공
- [ ] POST /api/positions - 직급명 중복 검증
- [ ] POST /api/positions - 코드 자동 생성 (POS-XXXXX)
- [ ] POST /api/positions - 레벨 범위 검증 (1-10)
- [ ] GET /api/positions/[id] - 직급 상세 조회
- [ ] PUT /api/positions/[id] - 직급 수정 성공
- [ ] PUT /api/positions/[id] - 직급명 중복 검증
- [ ] DELETE /api/positions/[id] - 소속 직원 존재 시 삭제 거부
- [ ] DELETE /api/positions/[id] - Soft delete 성공
- [ ] 모든 엔드포인트 ADMIN 권한 검증

---

## 테스트 전략

### 단위 테스트

```typescript
describe('GET /api/positions', () => {
  it('should return positions sorted by level', async () => { });
  it('should reject non-ADMIN users', async () => { });
});

describe('POST /api/positions', () => {
  it('should create position with auto-generated code', async () => { });
  it('should validate name uniqueness', async () => { });
  it('should validate level range (1-10)', async () => { });
});

describe('DELETE /api/positions/[id]', () => {
  it('should prevent deletion with active employees', async () => { });
});
```

---

## 완료 체크리스트

- [ ] GET /api/positions 구현
- [ ] POST /api/positions 구현
- [ ] GET /api/positions/[id] 구현
- [ ] PUT /api/positions/[id] 구현
- [ ] DELETE /api/positions/[id] 구현
- [ ] TypeScript 빌드 성공
- [ ] 단위 테스트 통과
- [ ] 스테이징 서버 검증

---

**다음 문서**: 2091_05_API_직원_목록_생성.md
