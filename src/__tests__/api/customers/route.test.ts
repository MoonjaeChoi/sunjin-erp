// Generated: 2026-01-28 02:15:00 KST

jest.mock('next/server', () => ({
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

const mockFind = jest.fn();
const mockFindOne = jest.fn();
const mockSave = jest.fn();
const mockDelete = jest.fn();
const mockGetRepository = jest.fn(() => ({
  find: mockFind,
  findOne: mockFindOne,
  save: mockSave,
  delete: mockDelete,
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
  IsNull: jest.fn(() => null),
  In: jest.fn((val) => val),
}));
jest.mock('reflect-metadata', () => ({}));

import { GET, POST } from '@/app/api/customers/route';

describe('GET /api/customers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/customers');
    const res = await GET(request);
    expect(res.status).toBe(401);
  });

  it('should return customer list for authenticated USER', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const customers = [
      { id: 1, name: 'Customer A', code: 'CUS001', classification: 'END_USER', deleted_at: null },
      { id: 2, name: 'Customer B', code: 'CUS002', classification: 'RESELLER', deleted_at: null },
    ];
    mockFind.mockResolvedValue(customers);

    const request = new Request('http://localhost:3000/api/customers?page=1&limit=20');
    const res = await GET(request);
    expect(res.status).toBe(200);
  });

  it('should return 500 on database error', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    mockFind.mockRejectedValue(new Error('DB error'));

    const request = new Request('http://localhost:3000/api/customers');
    const res = await GET(request);
    expect(res.status).toBe(500);
  });

  it('should filter by classification', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'MANAGER' } });
    mockFind.mockResolvedValue([]);

    const request = new Request('http://localhost:3000/api/customers?classification=END_USER');
    const res = await GET(request);
    expect(res.status).toBe(200);
  });
});

describe('POST /api/customers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const body = { name: 'New Customer', classification: 'END_USER' };
    const request = new Request('http://localhost:3000/api/customers', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const res = await POST(request);
    expect(res.status).toBe(401);
  });

  it('should return 403 when USER role tries to create', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const body = { name: 'New Customer', classification: 'END_USER' };
    const request = new Request('http://localhost:3000/api/customers', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const res = await POST(request);
    expect(res.status).toBe(403);
  });

  it('should create customer with MANAGER role', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'MANAGER', name: 'Manager' } });
    mockSave.mockResolvedValue({ id: 1, name: 'New Customer', classification: 'END_USER' });

    const body = { name: 'New Customer', classification: 'END_USER' };
    const request = new Request('http://localhost:3000/api/customers', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const res = await POST(request);
    expect(res.status).toBe(201);
  });

  it('should return 400 for missing required fields', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'MANAGER' } });
    const body = { classification: 'END_USER' }; // Missing name
    const request = new Request('http://localhost:3000/api/customers', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const res = await POST(request);
    expect(res.status).toBe(400);
  });
});
