// Generated: 2026-01-28 02:40:00 KST

import { NextRequest } from 'next/server';

// Mock next-auth before importing route handlers
const mockGetServerSession = jest.fn();
jest.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));

// Mock db-direct
const mockExecuteQuery = jest.fn();
const mockExecuteUpdate = jest.fn();
jest.mock('@/lib/db-direct', () => ({
  executeQuery: (...args: any[]) => mockExecuteQuery(...args),
  executeUpdate: (...args: any[]) => mockExecuteUpdate(...args),
}));

jest.mock('@/lib/auth', () => ({ authOptions: {} }));

import { GET, POST } from '@/app/api/employees/route';

function createRequest(url: string, options?: { method?: string; body?: any }) {
  const req = new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: options?.method || 'GET',
    ...(options?.body && {
      body: JSON.stringify(options.body),
      headers: { 'Content-Type': 'application/json' },
    }),
  });
  return req;
}

describe('GET /api/employees', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = createRequest('http://localhost:3000/api/employees');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.message).toBe('Unauthorized');
  });

  it('should return 403 for USER role', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'USER' },
    });

    const req = createRequest('http://localhost:3000/api/employees');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.message).toBe('Forbidden');
  });

  it('should return paginated employee list for ADMIN', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    mockExecuteQuery
      .mockResolvedValueOnce({
        rows: [
          {
            ID: 1,
            NAME: '홍길동',
            EMAIL: 'hong@example.com',
            PHONE: '010-1234-5678',
            DEPARTMENT_ID: 1,
            DEPARTMENT_NAME: '개발팀',
            POSITION_ID: 1,
            POSITION_NAME: '대리',
            POSITION_LEVEL: 3,
            HIRED_AT: new Date('2023-01-01'),
            IS_ACTIVE: 1,
          },
        ],
        rowCount: 1,
      })
      .mockResolvedValueOnce({
        rows: [{ TOTAL: 1 }],
        rowCount: 1,
      });

    const req = createRequest('http://localhost:3000/api/employees?page=1&limit=20');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('홍길동');
    expect(body.data[0].isActive).toBe(true);
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.total).toBe(1);
  });

  it('should filter by department for MANAGER', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 2, role: 'MANAGER', departmentId: 5 },
    });

    mockExecuteQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ TOTAL: 0 }], rowCount: 1 });

    const req = createRequest('http://localhost:3000/api/employees');
    await GET(req);

    // Check that the query contains MANAGER filter
    const queryCall = mockExecuteQuery.mock.calls[0];
    expect(queryCall[0]).toContain('e.DEPARTMENT_ID = :userDeptId');
    expect(queryCall[1].userDeptId).toBe(5);
  });

  it('should search by name or email', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    mockExecuteQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ TOTAL: 0 }], rowCount: 1 });

    const req = createRequest('http://localhost:3000/api/employees?search=hong');
    await GET(req);

    const queryCall = mockExecuteQuery.mock.calls[0];
    expect(queryCall[0]).toContain('LOWER(e.NAME) LIKE :search');
    expect(queryCall[1].search).toBe('%hong%');
  });

  it('should filter by isActive for ADMIN', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    mockExecuteQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ TOTAL: 0 }], rowCount: 1 });

    const req = createRequest('http://localhost:3000/api/employees?isActive=false');
    await GET(req);

    const queryCall = mockExecuteQuery.mock.calls[0];
    expect(queryCall[0]).toContain('a.IS_ACTIVE = 0');
  });
});

describe('POST /api/employees', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = createRequest('http://localhost:3000/api/employees', {
      method: 'POST',
      body: {},
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.message).toBe('Unauthorized');
  });

  it('should return 403 for non-ADMIN role', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'MANAGER' },
    });

    const req = createRequest('http://localhost:3000/api/employees', {
      method: 'POST',
      body: { name: 'Test' },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.message).toBe('Forbidden');
  });

  it('should validate required fields', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    const req = createRequest('http://localhost:3000/api/employees', {
      method: 'POST',
      body: {},
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errors).toHaveProperty('name');
    expect(body.errors).toHaveProperty('email');
    expect(body.errors).toHaveProperty('departmentId');
    expect(body.errors).toHaveProperty('positionId');
    expect(body.errors).toHaveProperty('hiredAt');
  });

  it('should reject invalid email format', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    const req = createRequest('http://localhost:3000/api/employees', {
      method: 'POST',
      body: {
        name: '홍길동',
        email: 'invalid-email',
        departmentId: 1,
        positionId: 1,
        hiredAt: '2023-01-01',
      },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errors.email).toContain('유효한 이메일');
  });

  it('should reject duplicate email', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{ ID: 999 }],
      rowCount: 1,
    });

    const req = createRequest('http://localhost:3000/api/employees', {
      method: 'POST',
      body: {
        name: '홍길동',
        email: 'hong@example.com',
        departmentId: 1,
        positionId: 1,
        hiredAt: '2023-01-01',
      },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errors.email).toContain('이미 존재하는');
  });

  it('should create employee for ADMIN', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    // Email not exists
    mockExecuteQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    // Department exists
    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ ID: 1 }], rowCount: 1 });
    // Position exists
    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ ID: 1 }], rowCount: 1 });
    // Insert
    mockExecuteUpdate.mockResolvedValueOnce({ rowsAffected: 1 });
    // Get created employee
    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{ ID: 100, NAME: '홍길동', EMAIL: 'hong@example.com' }],
      rowCount: 1,
    });
    // Insert history
    mockExecuteUpdate.mockResolvedValueOnce({ rowsAffected: 1 });

    const req = createRequest('http://localhost:3000/api/employees', {
      method: 'POST',
      body: {
        name: '홍길동',
        email: 'hong@example.com',
        departmentId: 1,
        positionId: 1,
        hiredAt: '2023-01-01',
      },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.id).toBe(100);
    expect(body.data.name).toBe('홍길동');
  });

  it('should record CREATE history', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    mockExecuteQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ ID: 1 }], rowCount: 1 });
    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ ID: 1 }], rowCount: 1 });
    mockExecuteUpdate.mockResolvedValueOnce({ rowsAffected: 1 });
    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{ ID: 100, NAME: '홍길동', EMAIL: 'hong@example.com' }],
      rowCount: 1,
    });
    mockExecuteUpdate.mockResolvedValueOnce({ rowsAffected: 1 });

    const req = createRequest('http://localhost:3000/api/employees', {
      method: 'POST',
      body: {
        name: '홍길동',
        email: 'hong@example.com',
        departmentId: 1,
        positionId: 1,
        hiredAt: '2023-01-01',
      },
    });
    await POST(req);

    // Verify history insert was called
    const historyCall = mockExecuteUpdate.mock.calls[1];
    expect(historyCall[0]).toContain('INSERT INTO EMPLOYEE_HISTORY');
    expect(historyCall[1].changeType).toBe('CREATE');
  });

  it('should reject future hiredAt date', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const req = createRequest('http://localhost:3000/api/employees', {
      method: 'POST',
      body: {
        name: '홍길동',
        email: 'hong@example.com',
        departmentId: 1,
        positionId: 1,
        hiredAt: futureDate.toISOString().split('T')[0],
      },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errors.hiredAt).toContain('미래 날짜');
  });
});
