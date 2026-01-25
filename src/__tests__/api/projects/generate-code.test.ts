// Generated: 2026-01-25 17:28:00 KST

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { getDataSource } from '@/lib/db';
import { POST } from '@/app/api/projects/generate-code/route';

jest.mock('next-auth');
jest.mock('@/lib/db');

describe('POST /api/projects/generate-code', () => {
  const mockSession = {
    user: { id: 1, role: 'ADMIN' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when no session', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/generate-code', {
      method: 'POST',
    });

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('should generate code with PJT-YYYYMMDD-NNN format', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockQueryRunner = {
      connect: jest.fn().mockResolvedValueOnce(undefined),
      query: jest.fn().mockResolvedValueOnce([{ SEQ: 42 }]),
      release: jest.fn().mockResolvedValueOnce(undefined),
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.code).toMatch(/^PJT-\d{8}-042$/);
  });

  it('should pad sequence to 3 digits', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockQueryRunner = {
      connect: jest.fn().mockResolvedValueOnce(undefined),
      query: jest.fn().mockResolvedValueOnce([{ SEQ: 5 }]),
      release: jest.fn().mockResolvedValueOnce(undefined),
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const response = await POST();
    const body = await response.json();

    expect(body.code).toContain('-005');
  });

  it('should query Oracle SEQUENCE', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockQueryRunner = {
      connect: jest.fn().mockResolvedValueOnce(undefined),
      query: jest.fn().mockResolvedValueOnce([{ SEQ: 1 }]),
      release: jest.fn().mockResolvedValueOnce(undefined),
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    await POST();

    expect(mockQueryRunner.query).toHaveBeenCalledWith(
      'SELECT PROJECT_CODE_SEQ.NEXTVAL AS seq FROM DUAL'
    );
  });
});
