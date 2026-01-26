<!-- Generated: 2026-01-26 21:30:00 KST -->

# 기본 CRUD API (GET /api/maintenance, POST)

**문서 번호**: 2071_05
**원본 PRD**: `docs/prd/2071_유지보수_고객_관리_prd_v2.md`
**PRD 참조**: [Section 5.2 - API Route Handlers](./2071_유지보수_고객_관리_prd_v2.md#52-api-route-handlers)
**운영 표준**: `docs/operation/012_엔드포인트작성규칙.md` (REST patterns, Query parameters, Response formats, RBAC validation, Error handling)
**구현 범위**: GET /api/maintenance (목록 조회), POST /api/maintenance (신규 생성)
**복잡도**: L (2-3일)
**의존성**: 2071_01~04 (Database 완료 필요)

---

## 구현 목표

유지보수 계약의 목록 조회 및 신규 생성을 위한 RESTful API 엔드포인트를 구현합니다. 필터링, 정렬, 페이지네이션을 지원하며, RBAC 검증을 3계층으로 적용합니다.

---

## 구현 내용

### 파일 구조

```
src/app/api/maintenance/
├── route.ts                    # GET (목록), POST (생성)
└── (다른 엔드포인트들)
```

### 1. GET /api/maintenance - 목록 조회

**Query Parameters**:
```
?status=ACTIVE&assignedEmployeeId=5&customerId=3&contractNameSearch=계약&
startDateFrom=2026-01-01&startDateTo=2026-12-31&endDateFrom=2026-03-01&endDateTo=2026-12-31&
sortBy=endDate&order=DESC&page=1&limit=20
```

**권한**: USER+ (USER, MANAGER, ADMIN 모두 접근)

**구현 명세**:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getDataSource } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // 1. 인증 확인
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 역할 확인 (USER+)
    if (!['USER', 'MANAGER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Query Parameter 파싱
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const assignedEmployeeId = searchParams.get('assignedEmployeeId');
    const customerId = searchParams.get('customerId');
    const contractNameSearch = searchParams.get('contractNameSearch') || '';
    const startDateFrom = searchParams.get('startDateFrom');
    const startDateTo = searchParams.get('startDateTo');
    const endDateFrom = searchParams.get('endDateFrom');
    const endDateTo = searchParams.get('endDateTo');
    const sortBy = searchParams.get('sortBy') || 'endDate';
    const order = (searchParams.get('order') || 'DESC').toUpperCase();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    // 4. 유효성 검증
    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { error: 'Page and limit must be positive' },
        { status: 400 }
      );
    }

    // 5. 데이터베이스 쿼리 구성
    const dataSource = await getDataSource();
    let query = dataSource
      .getRepository('MaintenanceContract')
      .createQueryBuilder('mc')
      .leftJoinAndSelect('mc.customer', 'customer')
      .leftJoinAndSelect('mc.assignedEmployee', 'employee')
      .where('mc.deleted_at IS NULL');

    // 필터 적용
    if (status) {
      query = query.andWhere('mc.contract_status = :status', { status });
    }

    if (assignedEmployeeId) {
      query = query.andWhere('mc.assigned_employee_id = :employeeId', {
        employeeId: assignedEmployeeId,
      });
    }

    if (customerId) {
      query = query.andWhere('mc.customer_id = :customerId', { customerId });
    }

    if (contractNameSearch) {
      query = query.andWhere('LOWER(mc.contract_name) LIKE :search', {
        search: `%${contractNameSearch.toLowerCase()}%`,
      });
    }

    if (startDateFrom) {
      query = query.andWhere('mc.start_date >= :startDateFrom', {
        startDateFrom: new Date(startDateFrom),
      });
    }

    if (startDateTo) {
      query = query.andWhere('mc.start_date <= :startDateTo', {
        startDateTo: new Date(startDateTo),
      });
    }

    if (endDateFrom) {
      query = query.andWhere('mc.end_date >= :endDateFrom', {
        endDateFrom: new Date(endDateFrom),
      });
    }

    if (endDateTo) {
      query = query.andWhere('mc.end_date <= :endDateTo', {
        endDateTo: new Date(endDateTo),
      });
    }

    // 정렬 적용
    const orderBy: Record<string, 'ASC' | 'DESC'> = {};
    if (sortBy === 'customerName') {
      orderBy['customer.name'] = order as 'ASC' | 'DESC';
    } else if (sortBy === 'contractName') {
      orderBy['mc.contract_name'] = order as 'ASC' | 'DESC';
    } else if (sortBy === 'endDate') {
      orderBy['mc.end_date'] = order as 'ASC' | 'DESC';
    }
    query = query.orderBy(orderBy);

    // 페이지네이션
    const offset = (page - 1) * limit;
    query = query.skip(offset).take(limit);

    // 6. 쿼리 실행
    const [data, total] = await query.getManyAndCount();

    // 7. 응답 구성
    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching maintenance contracts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**응답 예시**:
```json
{
  "data": [
    {
      "id": 1,
      "customer": { "id": 1, "name": "ABC Corp" },
      "contract_name": "유지보수계약 2026",
      "contract_type": "유지보수",
      "start_date": "2026-01-01",
      "end_date": "2026-12-31",
      "contract_amount": 5000000,
      "contract_status": "활성",
      "assignedEmployee": { "id": 1, "name": "김영희" }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

### 2. POST /api/maintenance - 신규 계약 생성

**권한**: MANAGER+ (MANAGER, ADMIN)

**요청 본문 예시**:
```json
{
  "customer_id": 1,
  "contract_name": "신규 유지보수계약",
  "contract_type": "유지보수",
  "start_date": "2026-02-01",
  "end_date": "2027-01-31",
  "contract_amount": 5000000,
  "assigned_employee_id": 1,
  "notes": "선택사항"
}
```

**구현 명세**:

```typescript
export async function POST(req: NextRequest) {
  try {
    // 1. 인증 확인
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 역할 확인 (MANAGER+)
    if (!['MANAGER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. 요청 데이터 파싱 및 유효성 검증
    const body = await req.json();

    const errors: Record<string, string> = {};

    // 필수 필드 검증
    if (!body.customer_id) errors.customer_id = 'Required';
    if (!body.contract_name?.trim()) errors.contract_name = 'Required';
    if (!body.contract_type?.trim()) errors.contract_type = 'Required';
    if (!body.start_date) errors.start_date = 'Required';
    if (!body.end_date) errors.end_date = 'Required';
    if (!body.assigned_employee_id) errors.assigned_employee_id = 'Required';

    // 날짜 유효성 검증
    const startDate = new Date(body.start_date);
    const endDate = new Date(body.end_date);

    if (isNaN(startDate.getTime())) {
      errors.start_date = 'Invalid date format';
    }
    if (isNaN(endDate.getTime())) {
      errors.end_date = 'Invalid date format';
    }
    if (startDate > endDate) {
      errors.start_date = 'Start date must be <= end date';
    }

    // 금액 검증 (nullable)
    if (body.contract_amount !== null && body.contract_amount !== undefined) {
      if (typeof body.contract_amount !== 'number' || body.contract_amount < 0) {
        errors.contract_amount = 'Must be a positive number';
      }
    }

    // 길이 검증
    if (body.contract_name?.length > 255) {
      errors.contract_name = 'Max 255 characters';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // 4. 데이터베이스 트랜잭션 시작
    const dataSource = await getDataSource();
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      // 5. 고객사 존재 확인
      const customer = await queryRunner.manager.findOne('Customer', {
        where: { id: body.customer_id, deleted_at: IsNull() },
      });
      if (!customer) {
        await queryRunner.rollbackTransaction();
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }

      // 6. 담당자 존재 확인
      const employee = await queryRunner.manager.findOne('Employee', {
        where: { id: body.assigned_employee_id, deleted_at: IsNull() },
      });
      if (!employee) {
        await queryRunner.rollbackTransaction();
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        );
      }

      // 7. 계약 생성
      const contract = queryRunner.manager.create('MaintenanceContract', {
        customer_id: body.customer_id,
        contract_name: body.contract_name.trim(),
        contract_type: body.contract_type.trim(),
        start_date: startDate,
        end_date: endDate,
        contract_amount: body.contract_amount || null,
        assigned_employee_id: body.assigned_employee_id,
        contract_status: '활성',
        notes: body.notes || null,
        created_by_id: session.user.id,
        updated_by_id: session.user.id,
      });

      const savedContract = await queryRunner.manager.save(contract);

      // 8. 이력 기록 (계약 생성)
      const history = queryRunner.manager.create('MaintenanceContractHistory', {
        maintenance_contract_id: savedContract.id,
        change_type: '정보수정',
        reason: '계약 생성',
        changed_by_id: session.user.id,
      });

      await queryRunner.manager.save(history);

      // 9. 트랜잭션 커밋
      await queryRunner.commitTransaction();

      // 10. 응답 반환
      return NextResponse.json(
        { ...savedContract, message: 'Contract created successfully' },
        { status: 201 }
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('Error creating maintenance contract:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**응답 예시** (201 Created):
```json
{
  "id": 1,
  "customer_id": 1,
  "contract_name": "신규 유지보수계약",
  "contract_type": "유지보수",
  "start_date": "2026-02-01",
  "end_date": "2027-01-31",
  "contract_amount": 5000000,
  "contract_status": "활성",
  "created_by_id": 1,
  "updated_by_id": 1,
  "created_at": "2026-01-26T21:30:00.000Z",
  "updated_at": "2026-01-26T21:30:00.000Z",
  "message": "Contract created successfully"
}
```

---

## Acceptance Criteria

- [ ] GET /api/maintenance 엔드포인트 구현 완료
  - 필터링 (status, employee, customer, date range, search)
  - 정렬 (customerName, contractName, endDate, ascending/descending)
  - 페이지네이션 (page, limit ≤ 50)
  - RBAC 검증 (USER+ 만 접근)
  - 성공 응답 (200) 및 에러 응답 (400, 401, 403)

- [ ] POST /api/maintenance 엔드포인트 구현 완료
  - 요청 데이터 유효성 검증
  - 필수 필드 검증 (customer_id, contract_name, dates, employee_id)
  - 날짜 로직 검증 (start_date ≤ end_date)
  - 금액 검증 (nullable, positive if present)
  - RBAC 검증 (MANAGER+ 만)
  - 외부 참조 검증 (Customer, Employee 존재 확인)
  - 트랜잭션 처리 (contract + history 함께)
  - 상태 자동 설정 ("활성")
  - 이력 자동 기록 (계약 생성)
  - 성공 응답 (201) 및 에러 응답 (400, 401, 403, 404)

- [ ] TypeScript strict mode 통과
  - `npm run type-check` 성공
  - 모든 타입 명시

- [ ] ESLint 및 Prettier 통과
  - `npm run lint` 통과
  - `npm run format` 적용

---

## 테스트 전략

### Unit 테스트

**테스트 파일**: `src/__tests__/api/maintenance/route.test.ts`

```typescript
describe('GET /api/maintenance', () => {
  it('should return paginated list for authenticated USER', async () => {
    const response = await GET(createRequest('?page=1&limit=20'));
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
  });

  it('should return 401 for unauthenticated request', async () => {
    // mock getServerSession to return null
    const response = await GET(createRequest());
    expect(response.status).toBe(401);
  });

  it('should filter by status', async () => {
    const response = await GET(createRequest('?status=활성'));
    const data = response.body.data;
    expect(data.every(c => c.contract_status === '활성')).toBe(true);
  });

  it('should limit results to max 50 items per page', async () => {
    const response = await GET(createRequest('?limit=100'));
    expect(response.body.pagination.limit).toBeLessThanOrEqual(50);
  });
});

describe('POST /api/maintenance', () => {
  it('should create contract with valid data', async () => {
    const response = await POST(createRequest(JSON.stringify({
      customer_id: 1,
      contract_name: 'Test',
      contract_type: '유지보수',
      start_date: '2026-02-01',
      end_date: '2027-01-31',
      assigned_employee_id: 1,
    })));
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.contract_status).toBe('활성');
  });

  it('should return 403 for USER role', async () => {
    // mock getServerSession to return USER role
    const response = await POST(createRequest(...));
    expect(response.status).toBe(403);
  });

  it('should validate date constraints', async () => {
    const response = await POST(createRequest(JSON.stringify({
      ...validData,
      start_date: '2027-02-01',
      end_date: '2026-01-31',
    })));
    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveProperty('start_date');
  });
});
```

### 검증 방법

1. 모든 Query Parameter 조합 테스트
2. 경계값 테스트 (page=0, limit=51 등)
3. 잘못된 날짜 형식 테스트
4. 외부 참조 검증 테스트 (존재하지 않는 customer)
5. `npm run test -- maintenance/route.test.ts` 실행

---

## 완료 체크리스트

- [ ] GET /api/maintenance 구현 완료
- [ ] POST /api/maintenance 구현 완료
- [ ] 필터링 로직 테스트 완료
- [ ] 페이지네이션 로직 테스트 완료
- [ ] 유효성 검증 테스트 완료
- [ ] RBAC 검증 테스트 완료
- [ ] 트랜잭션 처리 검증 완료
- [ ] TypeScript build 성공
- [ ] ESLint/Prettier 통과
- [ ] 모든 unit 테스트 통과 (coverage ≥ 80%)
- [ ] 코드 리뷰 완료

---

**다음 문서**: `2071_06_상세및수정_API.md`
