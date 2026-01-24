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
  Check: () => () => {},
  IsNull: jest.fn(() => null),
  DataSource: jest.fn(),
}));
jest.mock('reflect-metadata', () => ({}));

import { GET } from '@/app/api/dashboard/daily-summary/route';

function makeRequest(url: string) {
  const urlObj = new URL(url, 'http://localhost:3000');
  return { url: urlObj.toString(), method: 'GET' } as any;
}

describe('GET /api/dashboard/daily-summary', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const req = makeRequest('http://localhost:3000/api/dashboard/daily-summary?date=2026-01-24');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('should return 400 when date is missing', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const req = makeRequest('http://localhost:3000/api/dashboard/daily-summary');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid date', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const req = makeRequest('http://localhost:3000/api/dashboard/daily-summary?date=invalid');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('should return tasks for the given date', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'ADMIN' } });
    mockFind.mockResolvedValue([
      { id: 1, title: 'Task 1', task_type: 'DOCUMENT', work_type: 'OFFICE', status: 'READY', start_time: 540, end_time: 600 },
    ]);
    const req = makeRequest('http://localhost:3000/api/dashboard/daily-summary?date=2026-01-24');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.date).toBe('2026-01-24');
    expect(body.tasks).toHaveLength(1);
    expect(body.tasks[0].title).toBe('Task 1');
  });

  it('should return empty techSupports array', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'ADMIN' } });
    mockFind.mockResolvedValue([]);
    const req = makeRequest('http://localhost:3000/api/dashboard/daily-summary?date=2026-01-24');
    const res = await GET(req);
    const body = await res.json();
    expect(body.techSupports).toEqual([]);
  });

  it('should filter by employee_id for USER role', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 5, role: 'USER' } });
    mockFind.mockResolvedValue([]);
    const req = makeRequest('http://localhost:3000/api/dashboard/daily-summary?date=2026-01-24');
    await GET(req);
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ employee_id: 5 }),
      })
    );
  });
});
