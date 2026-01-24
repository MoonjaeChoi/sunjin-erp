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

const mockGetMany = jest.fn();
const mockCreateQueryBuilder = jest.fn();
const mockGetRepository = jest.fn(() => ({
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

import { GET } from '@/app/api/dashboard/team/route';

function makeRequest(url: string) {
  const urlObj = new URL(url, 'http://localhost:3000');
  return { url: urlObj.toString(), method: 'GET' } as any;
}

describe('GET /api/dashboard/team', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: mockGetMany,
    });
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const req = makeRequest('http://localhost:3000/api/dashboard/team?date_from=2026-01-01&date_to=2026-01-31');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('should return 403 for USER role', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const req = makeRequest('http://localhost:3000/api/dashboard/team?date_from=2026-01-01&date_to=2026-01-31');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('should return 400 when date params missing', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'MANAGER' } });
    const req = makeRequest('http://localhost:3000/api/dashboard/team');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid date format', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'MANAGER' } });
    const req = makeRequest('http://localhost:3000/api/dashboard/team?date_from=bad&date_to=2026-01-31');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('should return grouped tasks by employee for ADMIN', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'ADMIN' } });
    mockGetMany.mockResolvedValue([
      { id: 1, employee_id: 10, title: 'Task A', task_date: '2026-01-24', task_type: 'DOCUMENT', work_type: 'OFFICE', status: 'READY', start_time: 540, end_time: 600 },
      { id: 2, employee_id: 10, title: 'Task B', task_date: '2026-01-24', task_type: 'MEETING', work_type: 'FIELD', status: 'DONE', start_time: 660, end_time: 720 },
      { id: 3, employee_id: 20, title: 'Task C', task_date: '2026-01-25', task_type: 'TEST', work_type: 'OFFICE', status: 'READY', start_time: null, end_time: null },
    ]);
    const req = makeRequest('http://localhost:3000/api/dashboard/team?date_from=2026-01-01&date_to=2026-01-31');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.employees).toHaveLength(2);
    expect(body.employees[0].employee_id).toBe(10);
    expect(body.employees[0].tasks).toHaveLength(2);
    expect(body.employees[1].employee_id).toBe(20);
    expect(body.employees[1].tasks).toHaveLength(1);
  });

  it('should allow MANAGER to access', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'MANAGER' } });
    mockGetMany.mockResolvedValue([]);
    const req = makeRequest('http://localhost:3000/api/dashboard/team?date_from=2026-01-01&date_to=2026-01-31');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
