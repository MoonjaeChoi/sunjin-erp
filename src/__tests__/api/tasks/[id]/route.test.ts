// Generated: 2026-01-24 23:30:00 KST

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
const mockGetRepository = jest.fn(() => ({
  findOne: mockFindOne,
  save: mockSave,
  softDelete: mockSoftDelete,
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

import { GET, PUT, DELETE } from '@/app/api/tasks/[id]/route';

function makeRequest(url: string, options?: { method?: string; headers?: Record<string, string>; body?: string }) {
  const urlObj = new URL(url, 'http://localhost:3000');
  return {
    url: urlObj.toString(),
    method: options?.method || 'GET',
    json: () => Promise.resolve(options?.body ? JSON.parse(options.body) : {}),
  } as any;
}

const mockParams = { params: { id: '1' } };

describe('GET /api/tasks/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const req = makeRequest('http://localhost:3000/api/tasks/1');
    const res = await GET(req, mockParams);
    expect(res.status).toBe(401);
  });

  it('should return 400 for invalid id', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const req = makeRequest('http://localhost:3000/api/tasks/abc');
    const res = await GET(req, { params: { id: 'abc' } });
    expect(res.status).toBe(400);
  });

  it('should return 404 for non-existent task', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    mockFindOne.mockResolvedValue(null);
    const req = makeRequest('http://localhost:3000/api/tasks/999');
    const res = await GET(req, { params: { id: '999' } });
    expect(res.status).toBe(404);
  });

  it('should return 403 for other user task (USER role)', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    mockFindOne.mockResolvedValue({ id: 1, employee_id: 2 });
    const req = makeRequest('http://localhost:3000/api/tasks/1');
    const res = await GET(req, mockParams);
    expect(res.status).toBe(403);
  });

  it('should allow ADMIN to view any task', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'ADMIN' } });
    mockFindOne.mockResolvedValue({ id: 1, employee_id: 99, title: 'Test' });
    const req = makeRequest('http://localhost:3000/api/tasks/1');
    const res = await GET(req, mockParams);
    expect(res.status).toBe(200);
  });

  it('should return task for owner', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 5, role: 'USER' } });
    mockFindOne.mockResolvedValue({ id: 1, employee_id: 5, title: 'My Task' });
    const req = makeRequest('http://localhost:3000/api/tasks/1');
    const res = await GET(req, mockParams);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe('My Task');
  });
});

describe('PUT /api/tasks/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const req = makeRequest('http://localhost:3000/api/tasks/1', {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated' }),
    });
    const res = await PUT(req, mockParams);
    expect(res.status).toBe(401);
  });

  it('should return 403 for non-owner (USER role)', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    mockFindOne.mockResolvedValue({ id: 1, employee_id: 2, status: 'READY' });
    const req = makeRequest('http://localhost:3000/api/tasks/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated' }),
    });
    const res = await PUT(req, mockParams);
    expect(res.status).toBe(403);
  });

  it('should allow ADMIN to update any task', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'ADMIN' } });
    const task = { id: 1, employee_id: 99, status: 'READY', completed_at: null };
    mockFindOne.mockResolvedValue(task);
    mockSave.mockResolvedValue({ ...task, title: 'Updated' });
    const req = makeRequest('http://localhost:3000/api/tasks/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated' }),
    });
    const res = await PUT(req, mockParams);
    expect(res.status).toBe(200);
  });

  it('should set completed_at when status changes to DONE', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const task = { id: 1, employee_id: 1, status: 'READY', completed_at: null };
    mockFindOne.mockResolvedValue(task);
    mockSave.mockImplementation((t: any) => Promise.resolve(t));
    const req = makeRequest('http://localhost:3000/api/tasks/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DONE' }),
    });
    await PUT(req, mockParams);
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ completed_at: expect.any(Date) })
    );
  });

  it('should clear completed_at when status changes from DONE', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const task = { id: 1, employee_id: 1, status: 'DONE', completed_at: new Date() };
    mockFindOne.mockResolvedValue(task);
    mockSave.mockImplementation((t: any) => Promise.resolve(t));
    const req = makeRequest('http://localhost:3000/api/tasks/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    });
    await PUT(req, mockParams);
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ completed_at: null })
    );
  });

  it('should validate input fields', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    mockFindOne.mockResolvedValue({ id: 1, employee_id: 1, status: 'READY' });
    const req = makeRequest('http://localhost:3000/api/tasks/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '' }),
    });
    const res = await PUT(req, mockParams);
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/tasks/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const req = makeRequest('http://localhost:3000/api/tasks/1', { method: 'DELETE' });
    const res = await DELETE(req, mockParams);
    expect(res.status).toBe(401);
  });

  it('should return 404 for non-existent task', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    mockFindOne.mockResolvedValue(null);
    const req = makeRequest('http://localhost:3000/api/tasks/1', { method: 'DELETE' });
    const res = await DELETE(req, mockParams);
    expect(res.status).toBe(404);
  });

  it('should return 403 for non-owner (USER role)', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    mockFindOne.mockResolvedValue({ id: 1, employee_id: 2 });
    const req = makeRequest('http://localhost:3000/api/tasks/1', { method: 'DELETE' });
    const res = await DELETE(req, mockParams);
    expect(res.status).toBe(403);
  });

  it('should soft delete task (call softDelete)', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    mockFindOne.mockResolvedValue({ id: 1, employee_id: 1 });
    mockSoftDelete.mockResolvedValue({});
    const req = makeRequest('http://localhost:3000/api/tasks/1', { method: 'DELETE' });
    const res = await DELETE(req, mockParams);
    expect(res.status).toBe(200);
    expect(mockSoftDelete).toHaveBeenCalledWith(1);
  });

  it('should allow ADMIN to delete any task', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'ADMIN' } });
    mockFindOne.mockResolvedValue({ id: 1, employee_id: 99 });
    mockSoftDelete.mockResolvedValue({});
    const req = makeRequest('http://localhost:3000/api/tasks/1', { method: 'DELETE' });
    const res = await DELETE(req, mockParams);
    expect(res.status).toBe(200);
  });
});
