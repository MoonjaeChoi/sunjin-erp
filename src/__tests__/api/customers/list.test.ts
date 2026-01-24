// Generated: 2026-01-25 06:40:00 KST

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
const mockGetRepository = jest.fn(() => ({
  find: mockFind,
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
}));
jest.mock('reflect-metadata', () => ({}));

import { GET } from '@/app/api/customers/list/route';

describe('GET /api/customers/list', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('should return customer list sorted by name', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const customers = [
      { id: 1, name: 'LG전자', category: 'END_USER' },
      { id: 2, name: '삼성전자', category: 'END_USER' },
    ];
    mockFind.mockResolvedValue(customers);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.customers).toEqual(customers);
  });

  it('should call find with correct options', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    mockFind.mockResolvedValue([]);

    await GET();

    expect(mockFind).toHaveBeenCalledWith({
      where: { deleted_at: null },
      select: ['id', 'name', 'category'],
      order: { name: 'ASC' },
    });
  });

  it('should return 500 on database error', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    mockFind.mockRejectedValue(new Error('DB error'));

    const res = await GET();
    expect(res.status).toBe(500);
  });
});
