// Generated: 2026-01-28 02:50:00 KST

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

import { GET, POST } from '@/app/api/departments/route';

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

describe('GET /api/departments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = createRequest('http://localhost:3000/api/departments');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.message).toBe('Unauthorized');
  });

  it('should return hierarchical department list', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    mockExecuteQuery.mockResolvedValueOnce({
      rows: [
        { ID: 1, NAME: '본부', PARENT_ID: null, LVL: 1, DESCRIPTION: null },
        { ID: 2, NAME: '개발팀', PARENT_ID: 1, LVL: 2, DESCRIPTION: '개발 담당' },
        { ID: 3, NAME: '영업팀', PARENT_ID: 1, LVL: 2, DESCRIPTION: '영업 담당' },
      ],
      rowCount: 3,
    });

    const req = createRequest('http://localhost:3000/api/departments');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.data[0].name).toBe('본부');
    expect(body.data[0].children).toHaveLength(2);
  });
});

describe('POST /api/departments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = createRequest('http://localhost:3000/api/departments', {
      method: 'POST',
      body: { name: '새부서' },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
  });

  it('should return 403 for non-ADMIN', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'MANAGER' },
    });

    const req = createRequest('http://localhost:3000/api/departments', {
      method: 'POST',
      body: { name: '새부서' },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(403);
  });

  it('should validate required name field', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    const req = createRequest('http://localhost:3000/api/departments', {
      method: 'POST',
      body: {},
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errors).toHaveProperty('name');
  });

  it('should prevent duplicate name', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{ ID: 1 }],
      rowCount: 1,
    });

    const req = createRequest('http://localhost:3000/api/departments', {
      method: 'POST',
      body: { name: '기존부서' },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errors.name).toContain('이미 존재');
  });

  it('should enforce max depth of 5', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    // Name not duplicate
    mockExecuteQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    // Parent exists with level 5
    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{ ID: 100, LVL: 5 }],
      rowCount: 1,
    });

    const req = createRequest('http://localhost:3000/api/departments', {
      method: 'POST',
      body: { name: '새부서', parentId: 100 },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errors.parentId).toContain('최대 5단계');
  });

  it('should create department at level 1 without parent', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    // Name not duplicate
    mockExecuteQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    // Insert
    mockExecuteUpdate.mockResolvedValueOnce({ rowsAffected: 1 });
    // Get created
    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{ ID: 10, NAME: '새부서', LVL: 1 }],
      rowCount: 1,
    });

    const req = createRequest('http://localhost:3000/api/departments', {
      method: 'POST',
      body: { name: '새부서' },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.name).toBe('새부서');
    expect(body.data.level).toBe(1);
  });

  it('should create child department with parent level + 1', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    mockExecuteQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{ ID: 1, LVL: 2 }],
      rowCount: 1,
    });
    mockExecuteUpdate.mockResolvedValueOnce({ rowsAffected: 1 });
    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{ ID: 10, NAME: '하위부서', LVL: 3, PARENT_ID: 1 }],
      rowCount: 1,
    });

    const req = createRequest('http://localhost:3000/api/departments', {
      method: 'POST',
      body: { name: '하위부서', parentId: 1 },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.level).toBe(3);
  });
});
