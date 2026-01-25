<!-- Generated: 2026-01-25 18:05:00 KST -->

# GET /api/issues — 목록 조회 API

**문서 번호**: 2061_03
**원본 PRD**: 2061_장애_현황_관리_prd_v2.md ('5.2 API Route Handlers', 'US-5')
**구현 범위**: 권한별 필터링, 페이지네이션, 정렬, 다중 필터 조합 (AND)
**복잡도**: M (Medium)
**의존성**: 2061_02 (Migration)

---

## 구현 목표

`GET /api/issues` 엔드포인트로 장애 목록을 조회한다. 핵심 특성:
- **RBAC 기반 행 필터링 (RLS)**: ADMIN(전체), MANAGER(같은 부서), USER(제한적)
- **is_public 기반 공개 여부 제어**: USER는 공개 Issue만 부서 내에서 조회 가능
- **동적 WHERE 절**: 쿼리 파라미터로 고객사, 상태, 심각도, 담당자, 기간, 키워드 필터링
- **AND 조합**: 모든 필터는 AND로 결합
- **정렬 및 페이지네이션**: sort_by, sort_order, page, page_size

---

## 구현 내용

### 파일 구조

생성/수정할 파일:
```
src/app/api/issues/route.ts  # GET 메서드 구현
```

### 구현 상세

#### 1. 쿼리 파라미터 정의

```typescript
interface IssueListQueryParams {
  page?: number;           // 기본 1
  page_size?: number;      // 기본 20, 최대 100
  customer_id?: number;    // 필터: 고객사
  status?: string;         // 필터: INTAKE,IN_PROGRESS,COMPLETED (다중 가능, 쉼표 분리)
  severity?: string;       // 필터: CRITICAL,HIGH,MEDIUM,LOW (다중 가능)
  assignee_id?: number;    // 필터: 담당자
  created_by_id?: number;  // 필터: 등록자
  date_from?: string;      // 필터: 생성일 시작 (YYYY-MM-DD)
  date_to?: string;        // 필터: 생성일 종료 (YYYY-MM-DD)
  keyword?: string;        // 검색: 제목 또는 설명 (LIKE)
  sort_by?: string;        // 정렬: created_at, status, severity, assigned_to_id (기본 created_at)
  sort_order?: string;     // 정렬: ASC, DESC (기본 DESC)
}
```

#### 2. Route Handler 코드

```typescript
// Generated: 2026-01-25 18:05:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getRepository } from 'typeorm';
import { Issue } from '@/entities/Issue';
import { Employee } from '@/entities/Employee';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  try {
    // 1. 세션 확인 (인증 검증)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    const userDepartmentId = session.user.department_id;

    // 2. 쿼리 파라미터 파싱
    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const page_size = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('page_size') || '20'))
    );
    const customer_id = searchParams.get('customer_id')
      ? parseInt(searchParams.get('customer_id')!)
      : undefined;
    const status = searchParams.get('status')
      ? searchParams.get('status')!.split(',')
      : undefined;
    const severity = searchParams.get('severity')
      ? searchParams.get('severity')!.split(',')
      : undefined;
    const assignee_id = searchParams.get('assignee_id')
      ? parseInt(searchParams.get('assignee_id')!)
      : undefined;
    const created_by_id = searchParams.get('created_by_id')
      ? parseInt(searchParams.get('created_by_id')!)
      : undefined;
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const keyword = searchParams.get('keyword');
    const sort_by = searchParams.get('sort_by') || 'created_at';
    const sort_order = (searchParams.get('sort_order') || 'DESC').toUpperCase();

    // 3. 권한별 WHERE 절 동적 구성 (RLS)
    let whereClause = 'WHERE i.deleted_at IS NULL';
    const params: any = {};

    if (userRole === 'ADMIN') {
      // ADMIN: 모든 행 반환
    } else if (userRole === 'MANAGER') {
      // MANAGER: 같은 부서 담당자의 Issue만
      // (assigned_to의 부서 = 세션 부서)
      whereClause += ` AND i.assigned_to_id IS NOT NULL
        AND e_assigned.department_id = :userDepartmentId`;
      params.userDepartmentId = userDepartmentId;
    } else if (userRole === 'USER') {
      // USER: 자신 생성 + 자신 담당 + 같은 부서 공개
      whereClause += ` AND (
        i.created_by_id = :userId
        OR i.assigned_to_id = :userId
        OR (i.is_public = 1 AND e_assigned.department_id = :userDepartmentId)
      )`;
      params.userId = userId;
      params.userDepartmentId = userDepartmentId;
    }

    // 4. 필터 적용 (AND 조합)
    if (customer_id) {
      whereClause += ' AND i.customer_id = :customer_id';
      params.customer_id = customer_id;
    }

    if (status && status.length > 0) {
      whereClause += ` AND i.status IN (${status.map((_, i) => `:status_${i}`).join(',')})`;
      status.forEach((s, i) => {
        params[`status_${i}`] = s;
      });
    }

    if (severity && severity.length > 0) {
      whereClause += ` AND i.severity IN (${severity.map((_, i) => `:severity_${i}`).join(',')})`;
      severity.forEach((s, i) => {
        params[`severity_${i}`] = s;
      });
    }

    if (assignee_id) {
      whereClause += ' AND i.assigned_to_id = :assignee_id';
      params.assignee_id = assignee_id;
    }

    if (created_by_id) {
      whereClause += ' AND i.created_by_id = :created_by_id';
      params.created_by_id = created_by_id;
    }

    if (date_from) {
      whereClause += ' AND TRUNC(i.created_at) >= TRUNC(TO_DATE(:date_from, \'YYYY-MM-DD\'))';
      params.date_from = date_from;
    }

    if (date_to) {
      whereClause += ' AND TRUNC(i.created_at) <= TRUNC(TO_DATE(:date_to, \'YYYY-MM-DD\'))';
      params.date_to = date_to;
    }

    if (keyword) {
      whereClause += ` AND (LOWER(i.title) LIKE LOWER(:keyword) OR LOWER(DBMS_LOB.SUBSTR(i.description, 4000, 1)) LIKE LOWER(:keyword))`;
      params.keyword = `%${keyword}%`;
    }

    // 5. 정렬 옵션 검증
    const validSortColumns = ['created_at', 'status', 'severity', 'assigned_to_id'];
    const finalSortBy = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const finalSortOrder = sort_order === 'ASC' ? 'ASC' : 'DESC';

    // 6. 데이터베이스 쿼리 실행
    const query = `
      SELECT
        i.id,
        i.customer_id,
        i.title,
        i.description,
        i.severity,
        i.status,
        i.is_public,
        i.created_by_id,
        i.assigned_to_id,
        i.treatment_method,
        i.treatment_time_minutes,
        i.treatment_result,
        i.created_at,
        i.completed_at,
        i.updated_at,
        i.deleted_at,
        c.name as customer_name,
        e_created.name as created_by_name,
        e_assigned.name as assigned_to_name
      FROM ISSUE i
      LEFT JOIN CUSTOMER c ON i.customer_id = c.id
      LEFT JOIN EMPLOYEE e_created ON i.created_by_id = e_created.id
      LEFT JOIN EMPLOYEE e_assigned ON i.assigned_to_id = e_assigned.id
      ${whereClause}
      ORDER BY i.${finalSortBy} ${finalSortOrder}
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    const offset = (page - 1) * page_size;
    params.offset = offset;
    params.limit = page_size;

    const connection = getRepository(Issue).manager.connection;
    const issues = await connection.query(query, [
      ...Object.entries(params).map(([k, v]) => v),
    ]);

    // 7. 총 개수 조회 (페이지네이션용)
    const countQuery = `SELECT COUNT(*) as total FROM ISSUE i
      LEFT JOIN EMPLOYEE e_assigned ON i.assigned_to_id = e_assigned.id
      ${whereClause}`;
    const countResult = await connection.query(countQuery, [
      ...Object.entries(params).map(([k, v]) => v),
    ]);
    const total = countResult[0]?.TOTAL || 0;

    // 8. 응답 반환
    return NextResponse.json({
      data: issues,
      pagination: {
        page,
        page_size,
        total,
        total_pages: Math.ceil(total / page_size),
      },
    });
  } catch (error) {
    console.error('GET /api/issues error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 주요 구현 포인트

#### RBAC 기반 필터링 로직

**ADMIN**: 모든 데이터 조회
```sql
-- WHERE 제약 없음 (deleted_at IS NULL만)
```

**MANAGER**: 같은 부서 담당자의 Issue만
```sql
WHERE i.deleted_at IS NULL
  AND i.assigned_to_id IS NOT NULL
  AND e_assigned.department_id = :userDepartmentId
```

**USER**: 제한적 조회 (자신 생성 + 자신 담당 + 부서 공개)
```sql
WHERE i.deleted_at IS NULL
  AND (
    i.created_by_id = :userId
    OR i.assigned_to_id = :userId
    OR (i.is_public = 1 AND e_assigned.department_id = :userDepartmentId)
  )
```

#### 다중 필터 AND 조합

```typescript
// status: "INTAKE,IN_PROGRESS" → WHERE i.status IN ('INTAKE', 'IN_PROGRESS')
// severity: "CRITICAL,HIGH" → WHERE i.severity IN ('CRITICAL', 'HIGH')
// 모든 필터는 AND로 결합
```

#### 페이지네이션 (Oracle OFFSET FETCH)

```sql
OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
```

---

## 핵심 인터페이스

```typescript
interface IssueListResponse {
  data: Array<{
    id: number;
    customer_id: number;
    customer_name: string;
    title: string;
    description: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    status: 'INTAKE' | 'IN_PROGRESS' | 'COMPLETED';
    is_public: number;
    created_by_id: number;
    created_by_name: string;
    assigned_to_id: number | null;
    assigned_to_name: string | null;
    treatment_method: string | null;
    treatment_time_minutes: number | null;
    treatment_result: string | null;
    created_at: string;
    completed_at: string | null;
    updated_at: string;
  }>;
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

interface ErrorResponse {
  message: string;
}
```

---

## Acceptance Criteria

- [ ] GET /api/issues 엔드포인트 정상 응답 (200 OK)
- [ ] 쿼리 파라미터 파싱 정확
- [ ] ADMIN: 모든 Issue 조회 가능
- [ ] MANAGER: 같은 부서 담당자 Issue만 조회
- [ ] USER: 자신 생성/담당 + 부서 공개 Issue만 조회
- [ ] 고객사, 상태, 심각도, 담당자, 기간 필터 정상 작동
- [ ] 다중 필터 AND 조합 정확
- [ ] 키워드 검색 (LIKE) 정상 작동
- [ ] 정렬 (sort_by, sort_order) 정상 작동
- [ ] 페이지네이션 (page, page_size) 정확
- [ ] 인증 없으면 401 응답
- [ ] 오류 시 500 응답

---

## 테스트 전략

### 테스트 케이스

| 테스트 | 조건 | 예상 결과 |
|--------|------|----------|
| ADMIN 조회 | 역할=ADMIN | 모든 Issue 반환 |
| MANAGER 조회 | 역할=MANAGER, 같은 부서 | 부서 담당 Issue만 반환 |
| USER 조회 | 역할=USER | 자신 생성/담당 + 부서 공개만 |
| 미인증 접근 | session=null | 401 Unauthorized |
| 고객사 필터 | customer_id=5 | 고객사 5의 Issue만 |
| 상태 필터 (다중) | status=INTAKE,IN_PROGRESS | 두 상태 모두 반환 |
| 기간 필터 | date_from=2026-01-20, date_to=2026-01-25 | 해당 기간 Issue만 |
| 키워드 검색 | keyword=DB | 제목/설명에 'DB' 포함 |

### 검증 방법

```bash
# cURL 테스트
curl -X GET "http://localhost:3000/api/issues?page=1&page_size=20&customer_id=1" \
  -H "Authorization: Bearer <token>"

# 필터 조합 테스트
curl -X GET "http://localhost:3000/api/issues?status=INTAKE,IN_PROGRESS&severity=CRITICAL,HIGH&page=1" \
  -H "Authorization: Bearer <token>"
```

---

## 완료 체크리스트

- [ ] src/app/api/issues/route.ts 생성
- [ ] GET 메서드 구현
- [ ] RBAC 필터링 로직 검증 (ADMIN, MANAGER, USER)
- [ ] is_public 기반 필터링 검증
- [ ] 다중 필터 AND 조합 검증
- [ ] 페이지네이션 검증 (OFFSET FETCH)
- [ ] 정렬 검증 (created_at, status, severity)
- [ ] 키워드 검색 검증 (LIKE)
- [ ] 인증 체크 검증
- [ ] 에러 처리 검증
- [ ] TypeScript 빌드 성공
- [ ] ESLint 통과

---

**다음 문서**: 2061_04_POST_issues_신규_생성_API.md
