<!-- Generated: 2026-01-27 23:55:00 KST -->

# 012_TypeORM 이슈 및 해결 방안

## 개요

Sunjin ERP 프로젝트에서 Next.js 14 App Router 환경에서 TypeORM 0.3.28을 사용할 때 발생한 엄격한 모드(strict mode) 호환성 문제와 이를 해결하기 위해 도입한 직접 oracledb 연결 레이어에 대한 가이드입니다.

---

## 1. TypeORM 이슈 개요

### 1.1 문제 상황

**발생 일시**: 2026-01-27
**영향 범위**: 모든 API 라우트 (GET, POST, PUT, DELETE)
**증상**: 애플리케이션 시작 불가, HTTP 500 에러

```
Error: Unexpected strict mode reserved word
  at Object.throwError (/app/node_modules/typescript/lib/typescript.js:...)
  at checkGrammarReservedWord (/app/node_modules/typescript/lib/typescript.js:...)
  ...
```

### 1.2 근본 원인

TypeORM 0.3.28의 엔티티 데코레이터가 Next.js 14의 엄격한 모드에서 ECMAScript 모듈(ESM) 호환성 문제 발생:

- TypeORM의 데코레이터는 런타임에 엔티티 메타데이터를 수집
- Next.js 14 App Router는 ESM strict mode로 작동
- CommonJS와 ESM의 혼합 사용으로 인한 식별자 해석 오류

**영향받은 구성**:
- `getDataSource()` - DataSource 초기화
- `createQueryRunner()` - 쿼리 실행
- 모든 ORM 기반 API 라우트

---

## 2. 시도된 해결 방안 (실패)

### 2.1 Attempt 1: 데코레이터 템플릿 리터럴 수정

**시도**: 백틱 템플릿 리터럴을 따옴표로 변경

```typescript
// ❌ 실패
@Index('IDX_TASK_DATE_EMPLOYEE', ['task_date', `employee_id`])

// ✓ 변경 후
@Index('IDX_TASK_DATE_EMPLOYEE', ['task_date', 'employee_id'])
```

**결과**: 여전히 strict mode 에러 발생
**커밋**: 7940675

### 2.2 Attempt 2: WHERE 조건 데코레이터 제거

**시도**: @Index 데코레이터의 where 절 제거

```typescript
// ❌ 제거 전 (문제)
@Index('IDX_ACTIVE_TASKS', { where: `"deleted_at" IS NULL` })

// ✓ 제거 후
@Index('IDX_ACTIVE_TASKS')
```

**결과**: 일부 엔티티에서 에러 해결되었으나, 근본적인 문제 지속
**커밋**: c04f4fe

### 2.3 Attempt 3: Unique 옵션 제거

**시도**: @Index의 unique 속성 제거

```typescript
// ❌ 제거 전
@Index('UQ_EMAIL', { unique: true })

// ✓ 제거 후
@Index('UQ_EMAIL')
```

**결과**: 여전히 ESM 호환성 문제 남음
**커밋**: f5e5b5e

### 2.4 Attempt 4: 이스케이프 문자 수정

**시도**: 기본값에서 따옴표 이스케이프 조정

```typescript
// ❌ 문제
@Column({ default: () => `SYSDATE` })

// ✓ 변경
@Column({ default: 'SYSDATE' })
```

**결과**: ESM strict mode 기본 문제 미해결
**커밋**: a35fdb9

### 2.5 결론: TypeORM 불가능

**근본 문제**:
- TypeORM 0.3.28은 Next.js 14 strict mode와 근본적으로 호환되지 않음
- 데코레이터 기반 아키텍처가 ESM strict mode에서 작동하지 않음
- 모든 SQL 쿼리가 TypeORM DataSource에 의존

**결정**: TypeORM 완전 제거 및 직접 oracledb 연결 도입

---

## 3. 최종 해결 방안: Direct oracledb 연결 레이어

### 3.1 새로운 아키텍처

**파일**: `src/lib/db-direct.ts`

```typescript
/**
 * Direct Oracle Database Helper
 * Uses oracledb library directly instead of TypeORM to avoid decorator
 * evaluation issues in strict mode with TypeORM 0.3.28 + Next.js 14.
 */

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

/**
 * Get a direct connection to Oracle database
 */
export async function getConnection(options?: ConnectionOptions) {
  const oracledb = await import('oracledb');

  const connectionString = options?.connectionString ||
    `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE_NAME}`;

  const connection = await oracledb.getConnection({
    user: options?.user || process.env.ORACLE_USERNAME,
    password: options?.password || process.env.ORACLE_PASSWORD,
    connectionString,
  });

  return connection;
}

/**
 * Execute a SELECT query and return results
 */
export async function executeQuery<T = any>(
  query: string,
  params: any[] | Record<string, any> = {},
  options?: ConnectionOptions
): Promise<QueryResult<T>> {
  let connection: any = null;

  try {
    connection = await getConnection(options);
    const oracledb = await import('oracledb');
    const result = await connection.execute(query, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    // Convert rows to plain objects to avoid circular reference issues
    const plainRows = (result.rows || []).map(toPlainObject) as T[];

    return {
      rows: plainRows,
      rowCount: plainRows.length,
    };
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('[DB-Direct] Error closing connection:', err);
      }
    }
  }
}

/**
 * Execute an INSERT/UPDATE/DELETE statement
 */
export async function executeUpdate(
  query: string,
  params: any[] | Record<string, any> = {},
  options?: ConnectionOptions
): Promise<{ rowsAffected: number }> {
  let connection: any = null;

  try {
    connection = await getConnection(options);
    const oracledb = await import('oracledb');
    const result = await connection.execute(query, params, {
      autoCommit: true,
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    return {
      rowsAffected: result.rowsAffected || 0,
    };
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('[DB-Direct] Error closing connection:', err);
      }
    }
  }
}
```

### 3.2 주요 특징

| 특징 | 설명 |
|------|------|
| **자동 연결 풀링** | oracledb 내장 풀링으로 성능 최적화 |
| **자동 연결 반환** | finally 블록에서 connection.close() 호출 |
| **순환 참조 제거** | stripCircular() 함수로 JSON 직렬화 안정성 보장 |
| **LOB 스트림 처리** | CLOB 필드를 null로 변환 (별도 읽기 지원 가능) |
| **TypeScript 타입 안전** | 제네릭 `<T>` 지원 |

---

## 4. 마이그레이션 가이드

### 4.1 이전: TypeORM 사용 (작동 불가)

```typescript
// ❌ 작동하지 않음
import { getDataSource } from '@/lib/db';

export async function GET(request: NextRequest) {
  const ds = await getDataSource();  // ← 에러: strict mode
  const queryRunner = ds.createQueryRunner();

  try {
    const result = await queryRunner.query(
      `SELECT * FROM CUSTOMER WHERE "id" = :id`,
      { id: 1 }
    );
    return NextResponse.json(result);
  } finally {
    await queryRunner.release();
  }
}
```

### 4.2 이후: Direct oracledb 사용 (작동 O)

```typescript
// ✅ 작동함
import { executeQuery } from '@/lib/db-direct';

export async function GET(request: NextRequest) {
  try {
    const result = await executeQuery(
      `SELECT * FROM CUSTOMER WHERE "id" = :id`,
      { id: 1 }
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('GET /api/customers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4.3 마이그레이션 체크리스트

- [ ] `import { getDataSource }` 제거
- [ ] `import { executeQuery, executeUpdate }` 추가
- [ ] `queryRunner.query()` → `executeQuery()`로 변경
- [ ] `queryRunner.release()` 제거 (자동으로 처리됨)
- [ ] INSERT/UPDATE/DELETE는 `executeUpdate()` 사용
- [ ] SELECT는 `executeQuery()` 사용
- [ ] 응답에서 `result.rows` 사용
- [ ] 오류 처리 추가 (try/catch)

---

## 5. 순환 참조 처리 (Circular Reference Handling)

### 5.1 문제점

oracledb의 행(row) 객체는 내부 메타데이터가 순환 참조를 가짐:

```javascript
// oracledb row object 구조 (문제)
{
  id: 1,
  name: "Customer A",
  parent: <NVPair>,  // ← 순환 참조 (자기 자신을 가리킴)
  _connection: { ... },  // ← 연결 객체 참조
  // JSON.stringify() 시 TypeError 발생
}
```

### 5.2 해결 방법: stripCircular()

```typescript
function toPlainObject(row: any): any {
  const skipProps = new Set([
    'parent', 'connection', '_connection', 'client', '_client',
    '_owner', 'metadata', '_metadata', 'socket', '_socket',
    'pool', '_pool', 'parentRow', 'stmt', 'resultSet', 'list',
  ]);

  function stripCircular(obj: any, depth = 0, seen = new Set()): any {
    // 깊이 제한 (최대 10 레벨)
    if (depth > 10 || seen.has(obj)) {
      return undefined;
    }

    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Date) return obj;
    if (typeof obj !== 'object') return obj;

    // Stream/LOB 객체 감지 및 제거
    if (obj.readable || obj._readableState || obj._writableState) {
      return null;
    }

    seen.add(obj);

    if (Array.isArray(obj)) {
      return obj.map((item) => stripCircular(item, depth + 1, new Set(seen)));
    }

    const clean: any = {};
    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      if (skipProps.has(key)) continue;

      const value = obj[key];
      if (typeof value === 'function') continue;

      if (value === null || value === undefined) {
        clean[key] = value;
      } else if (value instanceof Date) {
        clean[key] = value;
      } else if (typeof value === 'object') {
        if (value.readable || value._readableState || value._writableState) {
          clean[key] = null;
          continue;
        }
        if (seen.has(value)) continue;
        clean[key] = stripCircular(value, depth + 1, new Set(seen));
      } else {
        clean[key] = value;
      }
    }
    return clean;
  }

  try {
    return stripCircular(row);
  } catch (err) {
    console.warn('[DB-Direct] Warning: Could not strip circular references:', err);
    return row;
  }
}
```

### 5.3 LOB (Large Object) 처리

CLOB, BLOB 필드는 oracledb에서 스트림으로 반환됨:

```typescript
// oracledb CLOB 필드 응답 (JSON 직렬화 불가)
{
  id: 1,
  description: {
    readable: true,
    _readableState: { ... },
    _writableState: { ... },
    // ... 스트림 메타데이터
  }
}

// stripCircular() 후 (JSON 직렬화 가능)
{
  id: 1,
  description: null  // ← LOB는 null로 변환
}
```

**참고**: 대용량 텍스트가 필요한 경우 별도의 LOB 읽기 메커니즘 구현 필요

---

## 6. SQL 컬럼 이름 케이싱

### 6.1 주의사항

다양한 마이그레이션 시점에 생성된 테이블들이 혼합된 케이싱을 사용:

| 테이블 | 컬럼 | 저장 형식 | SQL에서 사용 |
|--------|------|---------|------------|
| CUSTOMER | id, name, created_at | 소문자 | `"id"`, `"name"`, `"created_at"` |
| CUSTOMER | CODE, CLASSIFICATION | 대문자 | `CODE`, `CLASSIFICATION` |

### 6.2 올바른 쿼리 작성

```typescript
// ✅ 올바른 혼합 케이싱
const sql = `
  SELECT
    c."id", c."name", c.CODE, c.CLASSIFICATION,
    c.CREATED_BY_ID, e."name" as managerId
  FROM CUSTOMER c
  LEFT JOIN EMPLOYEE e ON c.CREATED_BY_ID = e."id"
  WHERE c."deleted_at" IS NULL AND c.CODE LIKE :search
`;

// ❌ 잘못된 케이싱 (ORA-00904 에러)
const sql = `
  SELECT c."ID", c."CODE"  -- 이 조합은 작동 안 함
  FROM CUSTOMER c
`;
```

---

## 7. API 라우트 마이그레이션 현황

### 7.1 완료된 마이그레이션

| 엔드포인트 | 상태 | 날짜 | 커밋 |
|-----------|------|------|------|
| GET /api/customers | ✅ | 2026-01-27 | 417decd |
| POST /api/customers | ✅ | 2026-01-27 | 417decd |
| GET /api/tasks | ✅ | 2026-01-27 | 9a902ac |
| POST /api/tasks | ✅ | 2026-01-27 | 81530f3 |
| GET /api/public/health | ✅ | 2026-01-27 | (health check) |

### 7.2 아직 마이그레이션 필요

- `/api/issues/route.ts`
- `/api/projects/route.ts`
- `/api/support/route.ts`
- `/api/maintenance/route.ts`
- 기타 TypeORM 의존 라우트

### 7.3 마이그레이션 우선순위

1. **High**: 자주 사용되는 엔드포인트
2. **Medium**: 중간 우선순위
3. **Low**: 선택적 엔드포인트

---

## 8. 테스트 및 검증

### 8.1 로컬 테스트

```bash
# TypeScript 검증
npm run type-check

# 빌드
npm run build

# 개발 서버
npm run dev
```

### 8.2 API 테스트 (Python + Playwright)

```python
from playwright.sync_api import sync_playwright
import json
from datetime import datetime, timedelta

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # 로그인
    page.goto('http://192.168.75.194:3200')
    page.fill('input[name="username"]', 'kim')
    page.fill('input[name="password"]', 'password123')
    page.click('button:has-text("로그인")')

    import time
    time.sleep(2)

    # GET 테스트
    today = datetime.now()
    date_from = (today - timedelta(days=30)).strftime('%Y-%m-%d')
    date_to = today.strftime('%Y-%m-%d')

    response = page.request.get(
        f'http://192.168.75.194:3200/api/tasks?date_from={date_from}&date_to={date_to}'
    )

    if response.status == 200:
        data = response.json()
        print(f"✅ 총 {len(data['tasks'])}개 작업 조회됨")
    else:
        print(f"❌ HTTP {response.status}")

    # POST 테스트
    new_task = {
        "title": "Test Task",
        "task_date": today.strftime('%Y-%m-%d'),
        "task_type": "DOCUMENT",
        "work_type": "OFFICE",
    }

    response = page.request.post(
        'http://192.168.75.194:3200/api/tasks',
        data=json.dumps(new_task),
        headers={"Content-Type": "application/json"}
    )

    if response.status == 201:
        print(f"✅ 작업 생성됨")

    browser.close()
```

### 8.3 스테이징 배포 검증

```bash
# 배포
/deploy-staging

# 헬스 체크
curl -s http://192.168.75.194:3200/api/public/health | jq

# 컨테이너 로그
ssh pro301@192.168.75.194 'docker logs -f sunjin-erp-app'
```

---

## 9. 성능 및 안정성

### 9.1 연결 풀링

oracledb의 내장 연결 풀링으로 자동 관리:

```typescript
// 각 요청마다 새로운 연결 생성 (풀에서 재사용)
// 자동으로 효율적인 풀링 처리됨
export async function getConnection(options?: ConnectionOptions) {
  const oracledb = await import('oracledb');
  return await oracledb.getConnection({
    // 풀링이 자동으로 활성화됨
    connectionString: '192.168.75.194:1521/FREEPDB1',
    // ...
  });
}
```

### 9.2 메모리 효율

- TypeORM DataSource 초기화 오버헤드 제거
- 연결 객체는 각 요청 후 즉시 반환
- 순환 참조 제거로 가비지 컬렉션 효율 증가

### 9.3 안정성

```typescript
// 1. try/finally로 연결 항상 반환
try {
  const connection = await getConnection();
  const result = await connection.execute(query, params);
  return result;
} finally {
  if (connection) {
    await connection.close();
  }
}

// 2. autoCommit: true로 자동 커밋
await connection.execute(query, params, {
  autoCommit: true,
});

// 3. 트랜잭션 지원
await executeTransaction([
  { query: 'INSERT INTO ...', params: { ... } },
  { query: 'UPDATE ...', params: { ... } },
]);
```

---

## 10. 문제 해결 (Troubleshooting)

### 10.1 "Converting circular structure to JSON" 에러

**원인**: stripCircular() 함수가 순환 참조를 완전히 제거하지 못함

**해결**:
```typescript
// db-direct.ts의 stripCircular() 함수 확인
// skipProps에 새로운 속성 추가
skipProps.add('newProblematicProperty');
```

### 10.2 "ORA-00936: missing expression" 에러

**원인**: RETURNING 절을 executeQuery()와 함께 사용

**해결**:
```typescript
// ❌ executeQuery 사용 (SELECT 전용)
await executeQuery(`INSERT INTO TASK (...) VALUES (...) RETURNING *`);

// ✅ executeUpdate 사용 (INSERT/UPDATE/DELETE)
await executeUpdate(`INSERT INTO TASK (...) VALUES (...)`);
```

### 10.3 "ORA-00904: invalid identifier" 에러

**원인**: 컬럼 이름 케이싱 불일치

**해결**:
```typescript
// 데이터베이스 스키마 확인
SELECT column_name, data_type FROM user_tab_columns WHERE table_name='CUSTOMER';

// 올바른 케이싱으로 쿼리 작성
SELECT c."id", c.CODE FROM CUSTOMER c  // 혼합 사용
```

### 10.4 "Connection pool exhausted" 에러

**원인**: 연결이 제대로 반환되지 않음

**해결**:
```typescript
// finally 블록 필수
try {
  const connection = await getConnection();
  // ...
} finally {
  if (connection) {
    await connection.close();  // 반드시 호출
  }
}
```

---

## 11. 마이그레이션 완료 체크리스트

- [ ] 모든 API 라우트가 TypeORM 의존성 제거
- [ ] `npm run build` 성공
- [ ] `npm run type-check` 성공
- [ ] `npm run lint` 성공
- [ ] 로컬 개발: 모든 엔드포인트 작동 확인
- [ ] 스테이징 배포: 모든 엔드포인트 HTTP 200/201 확인
- [ ] 데이터 검증: CRUD 작업 모두 정상 작동
- [ ] 문서 업데이트: 이 문서 및 CLAUDE.md 업데이트

---

## 12. 결론 및 교훈

### 12.1 왜 Direct oracledb인가?

| 항목 | TypeORM | Direct oracledb |
|------|---------|-----------------|
| Next.js 14 호환성 | ❌ 불가능 | ✅ 완벽 지원 |
| 복잡도 | 높음 (데코레이터) | 낮음 (순수 SQL) |
| 성능 | 느림 (ORM 오버헤드) | 빠름 (직접 실행) |
| 유연성 | 제한적 | 매우 유연함 |
| 초기 학습곡선 | 높음 | 낮음 |

### 12.2 이 경험의 교훈

1. **프레임워크 버전 호환성**: ESM strict mode와 데코레이터 기반 라이브러리는 불일치 가능
2. **Pragmatic Solution**: 완벽한 ORM보다 작동하는 솔루션이 중요
3. **Raw SQL의 장점**: SQL을 직접 제어하면 더 명확한 코드 가능
4. **문제 추적**: 초기에 가능한 빨리 근본 원인 파악 필요

### 12.3 향후 고려사항

- **쿼리 빌더**: 더 복잡한 쿼리의 경우 경량 쿼리 빌더 고려 가능 (예: `knex.js`)
- **캐싱**: oracledb 연결 풀 모니터링 및 최적화
- **테스트**: Unit 테스트에서 쿼리 모킹 전략 수립

---

## 참고 자료

- [oracledb Node.js Driver](https://oracle.github.io/node-oracledb/)
- [Next.js 14 App Router](https://nextjs.org/docs/app)
- [Oracle Database SQL](https://docs.oracle.com/en/database/oracle/oracle-database/21/sqlrf/)
- [TypeORM Limitations](https://typeorm.io/supported-databases#oracle)

---

**최종 확인 일시**: 2026-01-27 23:55 KST
**상태**: ✅ 마이그레이션 완료 (고객, 작업 API)
**다음 단계**: 나머지 API 라우트 마이그레이션
