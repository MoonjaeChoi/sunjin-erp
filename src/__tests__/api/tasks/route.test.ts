// Generated: 2026-01-24 23:30:00 KST

// Mock next/server
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(body),
    }),
  },
}));

// Mock next-auth
const mockGetServerSession = jest.fn();
jest.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));

// Mock db
const mockFind = jest.fn();
const mockGetManyAndCount = jest.fn();
const mockCreateQueryBuilder = jest.fn();
const mockCreate = jest.fn();
const mockSave = jest.fn();
const mockGetRepository = jest.fn(() => ({
  find: mockFind,
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

import { GET, POST } from '@/app/api/tasks/route';

function makeRequest(url: string, options?: { method?: string; headers?: Record<string, string>; body?: string }) {
  const urlObj = new URL(url, 'http://localhost:3000');
  return {
    url: urlObj.toString(),
    method: options?.method || 'GET',
    json: () => Promise.resolve(options?.body ? JSON.parse(options.body) : {}),
  } as any;
}

describe('GET /api/tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getManyAndCount: mockGetManyAndCount,
    });
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const req = makeRequest('http://localhost:3000/api/tasks?date_from=2026-01-01&date_to=2026-01-31');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('should return 400 when date_from is missing', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const req = makeRequest('http://localhost:3000/api/tasks?date_to=2026-01-31');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('should return 400 when date_to is missing', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const req = makeRequest('http://localhost:3000/api/tasks?date_from=2026-01-01');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid date format', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const req = makeRequest('http://localhost:3000/api/tasks?date_from=invalid&date_to=2026-01-31');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid type enum', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const req = makeRequest('http://localhost:3000/api/tasks?date_from=2026-01-01&date_to=2026-01-31&type=INVALID');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid status enum', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const req = makeRequest('http://localhost:3000/api/tasks?date_from=2026-01-01&date_to=2026-01-31&status=INVALID');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('should return tasks within date range', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'ADMIN' } });
    mockGetManyAndCount.mockResolvedValue([[{ id: 1, title: 'Test' }], 1]);
    const req = makeRequest('http://localhost:3000/api/tasks?date_from=2026-01-01&date_to=2026-01-31');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tasks).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it('should apply RBAC filter for USER role', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 5, role: 'USER' } });
    mockGetManyAndCount.mockResolvedValue([[], 0]);
    const req = makeRequest('http://localhost:3000/api/tasks?date_from=2026-01-01&date_to=2026-01-31');
    await GET(req);
    const qb = mockCreateQueryBuilder.mock.results[0].value;
    expect(qb.andWhere).toHaveBeenCalledWith(
      'task.employee_id = :userId',
      { userId: 5 }
    );
  });
});

describe('POST /api/tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const req = makeRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should return 400 when title is missing', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const req = makeRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_date: '2026-01-24',
        task_type: 'DOCUMENT',
        work_type: 'OFFICE',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.details).toContain('title is required');
  });

  it('should return 400 when task_type is invalid', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const req = makeRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test',
        task_date: '2026-01-24',
        task_type: 'INVALID',
        work_type: 'OFFICE',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.details).toContain('invalid task_type');
  });

  it('should return 400 when start_time > end_time', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const req = makeRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test',
        task_date: '2026-01-24',
        task_type: 'DOCUMENT',
        work_type: 'OFFICE',
        start_time: 600,
        end_time: 540,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.details).toContain('start_time must be less than end_time');
  });

  it('should return 400 when start_time out of range', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const req = makeRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test',
        task_date: '2026-01-24',
        task_type: 'DOCUMENT',
        work_type: 'OFFICE',
        start_time: 1500,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.details).toContain('start_time must be 0~1439');
  });

  it('should return 201 on successful creation', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const savedTask = { id: 1, title: 'Test', status: 'READY' };
    mockCreate.mockReturnValue(savedTask);
    mockSave.mockResolvedValue(savedTask);
    const req = makeRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test',
        task_date: '2026-01-24',
        task_type: 'DOCUMENT',
        work_type: 'OFFICE',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('should set employee_id from session', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 7, role: 'USER' } });
    mockCreate.mockReturnValue({});
    mockSave.mockResolvedValue({ id: 1 });
    const req = makeRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test',
        task_date: '2026-01-24',
        task_type: 'DOCUMENT',
        work_type: 'OFFICE',
      }),
    });
    await POST(req);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ employee_id: 7 })
    );
  });

  it('should set completed_at when status is DONE', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    mockCreate.mockReturnValue({});
    mockSave.mockResolvedValue({ id: 1 });
    const req = makeRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test',
        task_date: '2026-01-24',
        task_type: 'DOCUMENT',
        work_type: 'OFFICE',
        status: 'DONE',
      }),
    });
    await POST(req);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ completed_at: expect.any(Date) })
    );
  });

  it('should sanitize title for XSS', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    mockCreate.mockReturnValue({});
    mockSave.mockResolvedValue({ id: 1 });
    const req = makeRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '<script>alert("xss")</script>',
        task_date: '2026-01-24',
        task_type: 'DOCUMENT',
        work_type: 'OFFICE',
      }),
    });
    await POST(req);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '&lt;script&gt;alert("xss")&lt;/script&gt;',
      })
    );
  });
});
