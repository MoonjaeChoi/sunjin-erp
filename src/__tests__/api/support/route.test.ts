// Generated: 2026-01-25 06:40:00 KST

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(body),
    }),
  },
}));

const mockGetServerSession = jest.fn();
jest.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));

const mockGetManyAndCount = jest.fn();
const mockGetCount = jest.fn();
const mockGetRawAndEntities = jest.fn();
const mockCreateQueryBuilder = jest.fn();
const mockCreate = jest.fn();
const mockSave = jest.fn();
const mockGetRepository = jest.fn(() => ({
  create: mockCreate,
  save: mockSave,
  createQueryBuilder: mockCreateQueryBuilder,
}));
jest.mock('@/lib/db', () => ({
  getDataSource: jest.fn(() =>
    Promise.resolve({ getRepository: mockGetRepository })
  ),
}));

jest.mock('@/lib/auth', () => ({ authOptions: {} }));
jest.mock('typeorm', () => ({
  Entity: () => () => {},
  PrimaryGeneratedColumn: () => () => {},
  Column: () => () => {},
  CreateDateColumn: () => () => {},
  UpdateDateColumn: () => () => {},
  DeleteDateColumn: () => () => {},
  Index: () => () => {},
  Check: () => () => {},
  IsNull: jest.fn(() => null),
  DataSource: jest.fn(),
}));
jest.mock('reflect-metadata', () => ({}));

import { GET, POST } from '@/app/api/support/route';

function makeRequest(url: string, options?: { method?: string; body?: string }) {
  return {
    url: new URL(url, 'http://localhost:3000').toString(),
    method: options?.method || 'GET',
    json: () => Promise.resolve(options?.body ? JSON.parse(options.body) : {}),
  } as any;
}

describe('GET /api/support', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const qb = {
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getRawAndEntities: mockGetRawAndEntities,
      getCount: mockGetCount,
    };
    mockCreateQueryBuilder.mockReturnValue(qb);
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const req = makeRequest('http://localhost:3000/api/support?date_from=2026-01-01&date_to=2026-01-31');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('should return 400 when date_from is missing', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const req = makeRequest('http://localhost:3000/api/support?date_to=2026-01-31');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('should return 400 when date_to is missing', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const req = makeRequest('http://localhost:3000/api/support?date_from=2026-01-01');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid date format', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const req = makeRequest('http://localhost:3000/api/support?date_from=invalid&date_to=2026-01-31');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('should return 400 when date range exceeds 365 days', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const req = makeRequest('http://localhost:3000/api/support?date_from=2024-01-01&date_to=2026-01-31');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid support_type', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const req = makeRequest('http://localhost:3000/api/support?date_from=2026-01-01&date_to=2026-01-31&support_type=INVALID');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid status', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const req = makeRequest('http://localhost:3000/api/support?date_from=2026-01-01&date_to=2026-01-31&status=INVALID');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid sort_by', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const req = makeRequest('http://localhost:3000/api/support?date_from=2026-01-01&date_to=2026-01-31&sort_by=invalid');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('should return paginated results', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'ADMIN' } });
    mockGetRawAndEntities.mockResolvedValue({
      entities: [{ id: 1, title: 'Test', customer_id: 1 }],
      raw: [{ customer_name: '삼성전자' }],
    });
    mockGetCount.mockResolvedValue(1);

    const req = makeRequest('http://localhost:3000/api/support?date_from=2026-01-01&date_to=2026-01-31&page=1&page_size=20');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.supports).toHaveLength(1);
    expect(body.supports[0].customer_name).toBe('삼성전자');
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
    expect(body.page_size).toBe(20);
  });

  it('should apply RBAC filter for USER role', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 5, role: 'USER' } });
    mockGetRawAndEntities.mockResolvedValue({ entities: [], raw: [] });
    mockGetCount.mockResolvedValue(0);

    const req = makeRequest('http://localhost:3000/api/support?date_from=2026-01-01&date_to=2026-01-31');
    await GET(req);

    const qb = mockCreateQueryBuilder();
    expect(qb.andWhere).toHaveBeenCalledWith('ts.employee_id = :userId', { userId: 5 });
  });

  it('should not apply RBAC filter for ADMIN role', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'ADMIN' } });
    mockGetRawAndEntities.mockResolvedValue({ entities: [], raw: [] });
    mockGetCount.mockResolvedValue(0);

    const req = makeRequest('http://localhost:3000/api/support?date_from=2026-01-01&date_to=2026-01-31');
    await GET(req);

    const qb = mockCreateQueryBuilder();
    const calls = qb.andWhere.mock.calls.map((c: any) => c[0]);
    expect(calls).not.toContain('ts.employee_id = :userId');
  });
});

describe('POST /api/support', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const req = makeRequest('http://localhost:3000/api/support', { method: 'POST', body: '{}' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should return 400 for missing required fields', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const req = makeRequest('http://localhost:3000/api/support', { method: 'POST', body: '{}' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.details.length).toBeGreaterThan(0);
  });

  it('should create with status RECEIVED and employee_id from session', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 7, role: 'USER' } });
    mockCreate.mockReturnValue({ id: 1 });
    mockSave.mockResolvedValue({ id: 1 });

    const req = makeRequest('http://localhost:3000/api/support', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Support',
        customer_id: 1,
        support_type: 'INSTALL',
        support_date: '2026-01-15',
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      status: 'RECEIVED',
      employee_id: 7,
    }));
  });

  it('should return 400 for invalid time range', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const req = makeRequest('http://localhost:3000/api/support', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test',
        customer_id: 1,
        support_type: 'INSTALL',
        support_date: '2026-01-15',
        start_time: 600,
        end_time: 500,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should sanitize title', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    mockCreate.mockReturnValue({ id: 1 });
    mockSave.mockResolvedValue({ id: 1 });

    const req = makeRequest('http://localhost:3000/api/support', {
      method: 'POST',
      body: JSON.stringify({
        title: '<script>alert("xss")</script>',
        customer_id: 1,
        support_type: 'INSTALL',
        support_date: '2026-01-15',
      }),
    });
    await POST(req);

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      title: expect.not.stringContaining('<script>'),
    }));
  });
});
