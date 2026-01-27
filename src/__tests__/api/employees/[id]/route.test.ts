// Generated: 2026-01-28 02:45:00 KST

import { NextRequest } from 'next/server';

const mockGetServerSession = jest.fn();
jest.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));

const mockExecuteQuery = jest.fn();
const mockExecuteUpdate = jest.fn();
jest.mock('@/lib/db-direct', () => ({
  executeQuery: (...args: any[]) => mockExecuteQuery(...args),
  executeUpdate: (...args: any[]) => mockExecuteUpdate(...args),
}));

jest.mock('@/lib/auth', () => ({ authOptions: {} }));

import { GET, PUT, DELETE } from '@/app/api/employees/[id]/route';

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

const mockParams = { id: '1' };

describe('GET /api/employees/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = createRequest('http://localhost:3000/api/employees/1');
    const res = await GET(req, { params: Promise.resolve(mockParams) });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.message).toBe('Unauthorized');
  });

  it('should return 403 for USER role', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'USER' },
    });

    const req = createRequest('http://localhost:3000/api/employees/1');
    const res = await GET(req, { params: Promise.resolve(mockParams) });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.message).toBe('Forbidden');
  });

  it('should return 400 for invalid employee ID', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    const req = createRequest('http://localhost:3000/api/employees/abc');
    const res = await GET(req, { params: Promise.resolve({ id: 'abc' }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toContain('Invalid employee ID');
  });

  it('should return 404 when employee not found', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    mockExecuteQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const req = createRequest('http://localhost:3000/api/employees/999');
    const res = await GET(req, { params: Promise.resolve({ id: '999' }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.message).toContain('직원을 찾을 수 없습니다');
  });

  it('should return employee detail for ADMIN', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    // First query: employee detail
    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{
        ID: 1,
        NAME: '홍길동',
        EMAIL: 'hong@example.com',
        PHONE: '010-1234-5678',
        JOB_TITLE: '개발자',
        DEPARTMENT_ID: 1,
        DEPARTMENT_NAME: '개발팀',
        DEPARTMENT_CODE: 'DEV',
        POSITION_ID: 1,
        POSITION_NAME: '대리',
        POSITION_CODE: 'LV3',
        POSITION_LEVEL: 3,
        MANAGER_ID: null,
        MANAGER_NAME: null,
        MANAGER_EMAIL: null,
        HIRED_AT: new Date('2023-01-01'),
        BIRTHDAY: new Date('1990-05-15'),
        CREATED_AT: new Date('2023-01-01'),
        CREATED_BY_ID: null,
        CREATED_BY_NAME: null,
        UPDATED_AT: new Date('2023-01-01'),
        UPDATED_BY_ID: null,
        UPDATED_BY_NAME: null,
      }],
      rowCount: 1,
    });
    // Second query: account info (for ADMIN)
    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{
        ID: 100,
        EMPLOYEE_ID: 1,
        USERNAME: 'hong',
        ROLE: 'USER',
        IS_ACTIVE: 1,
        LAST_LOGIN_AT: null,
        PASSWORD_CHANGED_AT: null,
        CREATED_AT: new Date('2023-01-01'),
        UPDATED_AT: new Date('2023-01-01'),
      }],
      rowCount: 1,
    });

    const req = createRequest('http://localhost:3000/api/employees/1');
    const res = await GET(req, { params: Promise.resolve(mockParams) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.name).toBe('홍길동');
    expect(body.data.account).toBeDefined();
    expect(body.data.account.username).toBe('hong');
  });

  it('should not include account info for MANAGER', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 2, role: 'MANAGER', departmentId: 1 },
    });

    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{
        ID: 1,
        NAME: '홍길동',
        EMAIL: 'hong@example.com',
        PHONE: '010-1234-5678',
        JOB_TITLE: '개발자',
        DEPARTMENT_ID: 1,
        DEPARTMENT_NAME: '개발팀',
        POSITION_ID: 1,
        POSITION_NAME: '대리',
        MANAGER_ID: null,
        MANAGER_NAME: null,
        HIRED_AT: new Date('2023-01-01'),
        BIRTHDAY: null,
        CREATED_AT: new Date('2023-01-01'),
        UPDATED_AT: new Date('2023-01-01'),
      }],
      rowCount: 1,
    });

    const req = createRequest('http://localhost:3000/api/employees/1');
    const res = await GET(req, { params: Promise.resolve(mockParams) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.account).toBeUndefined();
  });

  it('should enforce department restriction for MANAGER', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 2, role: 'MANAGER', departmentId: 1 },
    });

    // Employee from different department
    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{
        ID: 5,
        DEPARTMENT_ID: 99, // Different department
        NAME: '테스트',
      }],
      rowCount: 1,
    });

    const req = createRequest('http://localhost:3000/api/employees/5');
    const res = await GET(req, { params: Promise.resolve({ id: '5' }) });
    const body = await res.json();

    expect(res.status).toBe(403);
  });
});

describe('PUT /api/employees/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = createRequest('http://localhost:3000/api/employees/1', {
      method: 'PUT',
      body: { name: '변경된이름' },
    });
    const res = await PUT(req, { params: Promise.resolve(mockParams) });
    const body = await res.json();

    expect(res.status).toBe(401);
  });

  it('should return 403 for non-ADMIN', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'MANAGER' },
    });

    const req = createRequest('http://localhost:3000/api/employees/1', {
      method: 'PUT',
      body: { name: '변경된이름' },
    });
    const res = await PUT(req, { params: Promise.resolve(mockParams) });
    const body = await res.json();

    expect(res.status).toBe(403);
  });

  it('should update employee for ADMIN', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    // Existing employee
    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{
        ID: 1,
        NAME: '홍길동',
        EMAIL: 'hong@example.com',
        PHONE: '010-1234-5678',
        JOB_TITLE: '개발자',
        DEPARTMENT_ID: 1,
        POSITION_ID: 1,
        MANAGER_ID: null,
        HIRED_AT: new Date('2023-01-01'),
        BIRTHDAY: null,
      }],
      rowCount: 1,
    });
    // No duplicate email
    mockExecuteQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    // Department exists
    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ ID: 1 }], rowCount: 1 });
    // Position exists
    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ ID: 1 }], rowCount: 1 });
    // Update
    mockExecuteUpdate.mockResolvedValueOnce({ rowsAffected: 1 });
    // Insert history
    mockExecuteUpdate.mockResolvedValueOnce({ rowsAffected: 1 });

    const req = createRequest('http://localhost:3000/api/employees/1', {
      method: 'PUT',
      body: {
        name: '변경된이름',
        email: 'changed@example.com',
        departmentId: 1,
        positionId: 1,
        hiredAt: '2023-01-01',
      },
    });
    const res = await PUT(req, { params: Promise.resolve(mockParams) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toContain('수정');
  });

  it('should record UPDATE history', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{ ID: 1, NAME: '홍길동', EMAIL: 'hong@example.com', DEPARTMENT_ID: 1, POSITION_ID: 1, HIRED_AT: new Date('2023-01-01') }],
      rowCount: 1,
    });
    mockExecuteQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ ID: 1 }], rowCount: 1 });
    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ ID: 1 }], rowCount: 1 });
    mockExecuteUpdate.mockResolvedValueOnce({ rowsAffected: 1 });
    mockExecuteUpdate.mockResolvedValueOnce({ rowsAffected: 1 });

    const req = createRequest('http://localhost:3000/api/employees/1', {
      method: 'PUT',
      body: {
        name: '변경된이름',
        email: 'hong@example.com',
        departmentId: 1,
        positionId: 1,
        hiredAt: '2023-01-01',
      },
    });
    await PUT(req, { params: Promise.resolve(mockParams) });

    const historyCall = mockExecuteUpdate.mock.calls[1];
    expect(historyCall[0]).toContain('INSERT INTO EMPLOYEE_HISTORY');
    expect(historyCall[1].changeType).toBe('UPDATE');
  });
});

describe('DELETE /api/employees/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = createRequest('http://localhost:3000/api/employees/1', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: Promise.resolve(mockParams) });
    const body = await res.json();

    expect(res.status).toBe(401);
  });

  it('should return 403 for non-ADMIN', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'MANAGER' },
    });

    const req = createRequest('http://localhost:3000/api/employees/1', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: Promise.resolve(mockParams) });
    const body = await res.json();

    expect(res.status).toBe(403);
  });

  it('should reject deletion with dependencies', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    // Employee exists
    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{ ID: 1, NAME: '홍길동' }],
      rowCount: 1,
    });
    // Has projects
    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ CNT: 2 }], rowCount: 1 });
    // Has tech support
    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ CNT: 0 }], rowCount: 1 });
    // Has tasks
    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ CNT: 0 }], rowCount: 1 });
    // Has issues
    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ CNT: 0 }], rowCount: 1 });
    // Has account
    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ CNT: 1 }], rowCount: 1 });
    // Has subordinates
    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ CNT: 0 }], rowCount: 1 });
    // Created by refs
    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ CNT: 0 }], rowCount: 1 });
    // History refs
    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ CNT: 5 }], rowCount: 1 });

    const req = createRequest('http://localhost:3000/api/employees/1', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: Promise.resolve(mockParams) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toContain('삭제할 수 없습니다');
    expect(body.dependencies).toBeDefined();
    expect(Array.isArray(body.dependencies)).toBe(true);
    expect(body.dependencies.some((d: any) => d.type === '프로젝트' && d.count === 2)).toBe(true);
    expect(body.dependencies.some((d: any) => d.type === '계정' && d.count === 1)).toBe(true);
  });

  it('should hard delete when no dependencies', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    // Employee exists
    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{ ID: 1, NAME: '홍길동' }],
      rowCount: 1,
    });
    // All dependency checks return 0
    for (let i = 0; i < 8; i++) {
      mockExecuteQuery.mockResolvedValueOnce({ rows: [{ CNT: 0 }], rowCount: 1 });
    }
    // Delete
    mockExecuteUpdate.mockResolvedValueOnce({ rowsAffected: 1 });

    const req = createRequest('http://localhost:3000/api/employees/1', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: Promise.resolve(mockParams) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toContain('삭제되었습니다');
  });

  it('should return detailed dependency list', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ ID: 1, NAME: '테스트' }], rowCount: 1 });
    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ CNT: 3 }], rowCount: 1 }); // projects
    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ CNT: 2 }], rowCount: 1 }); // tech_support
    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ CNT: 5 }], rowCount: 1 }); // tasks
    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ CNT: 1 }], rowCount: 1 }); // issues
    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ CNT: 1 }], rowCount: 1 }); // accounts
    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ CNT: 4 }], rowCount: 1 }); // subordinates
    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ CNT: 10 }], rowCount: 1 }); // created_by
    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ CNT: 20 }], rowCount: 1 }); // history

    const req = createRequest('http://localhost:3000/api/employees/1', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: Promise.resolve(mockParams) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(Array.isArray(body.dependencies)).toBe(true);
    expect(body.dependencies.find((d: any) => d.type === '프로젝트')?.count).toBe(3);
    expect(body.dependencies.find((d: any) => d.type === '기술지원')?.count).toBe(2);
    expect(body.dependencies.find((d: any) => d.type === '업무')?.count).toBe(5);
    expect(body.dependencies.find((d: any) => d.type === '이슈')?.count).toBe(1);
    expect(body.dependencies.find((d: any) => d.type === '계정')?.count).toBe(1);
    expect(body.dependencies.find((d: any) => d.type === '하위 직원')?.count).toBe(4);
  });
});
