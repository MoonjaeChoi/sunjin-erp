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

const mockFindOne = jest.fn();
const mockSave = jest.fn();
const mockSoftDelete = jest.fn();
const mockGetRawAndEntities = jest.fn();
const mockCreateQueryBuilder = jest.fn();
const mockGetRepository = jest.fn(() => ({
  findOne: mockFindOne,
  save: mockSave,
  softDelete: mockSoftDelete,
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
jest.mock('fs/promises', () => ({
  unlink: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('path', () => ({
  resolve: (...args: string[]) => args.join('/'),
  join: (...args: string[]) => args.join('/'),
}));

import { GET, PUT, DELETE } from '@/app/api/support/[id]/route';

function makeRequest(url: string, options?: { method?: string; body?: string }) {
  return {
    url: new URL(url, 'http://localhost:3000').toString(),
    method: options?.method || 'GET',
    json: () => Promise.resolve(options?.body ? JSON.parse(options.body) : {}),
  } as any;
}

const mockParams = { params: { id: '1' } };

describe('GET /api/support/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const qb = {
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawAndEntities: mockGetRawAndEntities,
    };
    mockCreateQueryBuilder.mockReturnValue(qb);
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const req = makeRequest('http://localhost:3000/api/support/1');
    const res = await GET(req, mockParams);
    expect(res.status).toBe(401);
  });

  it('should return 404 when not found', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    mockGetRawAndEntities.mockResolvedValue({ entities: [], raw: [] });

    const req = makeRequest('http://localhost:3000/api/support/1');
    const res = await GET(req, mockParams);
    expect(res.status).toBe(404);
  });

  it('should return 403 for non-owner USER', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 2, role: 'USER' } });
    mockGetRawAndEntities.mockResolvedValue({
      entities: [{ id: 1, employee_id: 1 }],
      raw: [{ c_name: '삼성전자', c_category: 'END_USER' }],
    });

    const req = makeRequest('http://localhost:3000/api/support/1');
    const res = await GET(req, mockParams);
    expect(res.status).toBe(403);
  });

  it('should return detail for owner', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    mockGetRawAndEntities.mockResolvedValue({
      entities: [{ id: 1, employee_id: 1, title: 'Test' }],
      raw: [{ c_name: '삼성전자', c_category: 'END_USER' }],
    });

    const req = makeRequest('http://localhost:3000/api/support/1');
    const res = await GET(req, mockParams);
    expect(res.status).toBe(200);
  });

  it('should return detail for ADMIN regardless of ownership', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 99, role: 'ADMIN' } });
    mockGetRawAndEntities.mockResolvedValue({
      entities: [{ id: 1, employee_id: 1, title: 'Test' }],
      raw: [{ c_name: '삼성전자', c_category: 'END_USER' }],
    });

    const req = makeRequest('http://localhost:3000/api/support/1');
    const res = await GET(req, mockParams);
    expect(res.status).toBe(200);
  });
});

describe('PUT /api/support/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const req = makeRequest('http://localhost:3000/api/support/1', { method: 'PUT', body: '{}' });
    const res = await PUT(req, mockParams);
    expect(res.status).toBe(401);
  });

  it('should return 404 when not found', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    mockFindOne.mockResolvedValue(null);

    const req = makeRequest('http://localhost:3000/api/support/1', { method: 'PUT', body: '{"title":"Updated"}' });
    const res = await PUT(req, mockParams);
    expect(res.status).toBe(404);
  });

  it('should return 403 for non-owner', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 2, role: 'USER' } });
    mockFindOne.mockResolvedValue({ id: 1, employee_id: 1, status: 'RECEIVED' });

    const req = makeRequest('http://localhost:3000/api/support/1', { method: 'PUT', body: '{"title":"Updated"}' });
    const res = await PUT(req, mockParams);
    expect(res.status).toBe(403);
  });

  it('should allow valid status transition RECEIVED → IN_PROGRESS', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const support = { id: 1, employee_id: 1, status: 'RECEIVED', completed_at: null };
    mockFindOne.mockResolvedValue(support);
    mockSave.mockResolvedValue(support);

    const req = makeRequest('http://localhost:3000/api/support/1', {
      method: 'PUT',
      body: '{"status":"IN_PROGRESS"}',
    });
    const res = await PUT(req, mockParams);
    expect(res.status).toBe(200);
  });

  it('should reject invalid transition RECEIVED → COMPLETED for USER', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    mockFindOne.mockResolvedValue({ id: 1, employee_id: 1, status: 'RECEIVED', completed_at: null });

    const req = makeRequest('http://localhost:3000/api/support/1', {
      method: 'PUT',
      body: '{"status":"COMPLETED"}',
    });
    const res = await PUT(req, mockParams);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid status transition');
  });

  it('should allow ADMIN to bypass transition rules', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 99, role: 'ADMIN' } });
    const support = { id: 1, employee_id: 1, status: 'RECEIVED', completed_at: null };
    mockFindOne.mockResolvedValue(support);
    mockSave.mockResolvedValue(support);

    const req = makeRequest('http://localhost:3000/api/support/1', {
      method: 'PUT',
      body: '{"status":"COMPLETED"}',
    });
    const res = await PUT(req, mockParams);
    expect(res.status).toBe(200);
  });

  it('should set completed_at when transitioning to COMPLETED', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const support = { id: 1, employee_id: 1, status: 'IN_PROGRESS', completed_at: null };
    mockFindOne.mockResolvedValue(support);
    mockSave.mockImplementation((s: any) => Promise.resolve(s));

    const req = makeRequest('http://localhost:3000/api/support/1', {
      method: 'PUT',
      body: '{"status":"COMPLETED"}',
    });
    await PUT(req, mockParams);

    expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
      completed_at: expect.any(Date),
    }));
  });

  it('should clear completed_at when transitioning from COMPLETED', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const support = { id: 1, employee_id: 1, status: 'COMPLETED', completed_at: new Date() };
    mockFindOne.mockResolvedValue(support);
    mockSave.mockImplementation((s: any) => Promise.resolve(s));

    const req = makeRequest('http://localhost:3000/api/support/1', {
      method: 'PUT',
      body: '{"status":"IN_PROGRESS"}',
    });
    await PUT(req, mockParams);

    expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
      completed_at: null,
    }));
  });
});

describe('DELETE /api/support/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const req = makeRequest('http://localhost:3000/api/support/1', { method: 'DELETE' });
    const res = await DELETE(req, mockParams);
    expect(res.status).toBe(401);
  });

  it('should return 403 for non-owner', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 2, role: 'USER' } });
    mockFindOne.mockResolvedValue({ id: 1, employee_id: 1, attachment_path: null });

    const req = makeRequest('http://localhost:3000/api/support/1', { method: 'DELETE' });
    const res = await DELETE(req, mockParams);
    expect(res.status).toBe(403);
  });

  it('should soft delete for owner', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    mockFindOne.mockResolvedValue({ id: 1, employee_id: 1, attachment_path: null });
    mockSoftDelete.mockResolvedValue(undefined);

    const req = makeRequest('http://localhost:3000/api/support/1', { method: 'DELETE' });
    const res = await DELETE(req, mockParams);

    expect(res.status).toBe(200);
    expect(mockSoftDelete).toHaveBeenCalledWith(1);
  });

  it('should allow ADMIN to delete any record', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 99, role: 'ADMIN' } });
    mockFindOne.mockResolvedValue({ id: 1, employee_id: 1, attachment_path: null });
    mockSoftDelete.mockResolvedValue(undefined);

    const req = makeRequest('http://localhost:3000/api/support/1', { method: 'DELETE' });
    const res = await DELETE(req, mockParams);
    expect(res.status).toBe(200);
  });
});
