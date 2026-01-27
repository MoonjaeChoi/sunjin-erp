// Generated: 2026-01-28 02:55:00 KST

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

import { GET, POST } from '@/app/api/positions/route';

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

describe('GET /api/positions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = createRequest('http://localhost:3000/api/positions');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.message).toBe('Unauthorized');
  });

  it('should return position list sorted by level', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    mockExecuteQuery.mockResolvedValueOnce({
      rows: [
        { ID: 1, NAME: '사원', LVL: 1, DESCRIPTION: null },
        { ID: 2, NAME: '대리', LVL: 2, DESCRIPTION: null },
        { ID: 3, NAME: '과장', LVL: 3, DESCRIPTION: null },
      ],
      rowCount: 3,
    });

    const req = createRequest('http://localhost:3000/api/positions');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(3);
    expect(body.data[0].name).toBe('사원');
    expect(body.data[0].level).toBe(1);
  });
});

describe('POST /api/positions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = createRequest('http://localhost:3000/api/positions', {
      method: 'POST',
      body: { name: '새직급', level: 1 },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
  });

  it('should return 403 for non-ADMIN', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'MANAGER' },
    });

    const req = createRequest('http://localhost:3000/api/positions', {
      method: 'POST',
      body: { name: '새직급', level: 1 },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(403);
  });

  it('should validate required fields', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    const req = createRequest('http://localhost:3000/api/positions', {
      method: 'POST',
      body: {},
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errors).toHaveProperty('name');
    expect(body.errors).toHaveProperty('level');
  });

  it('should prevent duplicate name', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{ ID: 1 }],
      rowCount: 1,
    });

    const req = createRequest('http://localhost:3000/api/positions', {
      method: 'POST',
      body: { name: '사원', level: 1 },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errors.name).toContain('이미 존재');
  });

  it('should create position', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    // Name not duplicate
    mockExecuteQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    // Insert
    mockExecuteUpdate.mockResolvedValueOnce({ rowsAffected: 1 });
    // Get created
    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{ ID: 10, NAME: '새직급', LVL: 5 }],
      rowCount: 1,
    });

    const req = createRequest('http://localhost:3000/api/positions', {
      method: 'POST',
      body: { name: '새직급', level: 5 },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.name).toBe('새직급');
    expect(body.data.level).toBe(5);
  });

  it('should validate level range (1-10)', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    const req = createRequest('http://localhost:3000/api/positions', {
      method: 'POST',
      body: { name: '새직급', level: 15 },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errors.level).toBeDefined();
  });
});
