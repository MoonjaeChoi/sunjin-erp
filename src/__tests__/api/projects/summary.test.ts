// Generated: 2026-01-25 17:28:00 KST

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { getDataSource } from '@/lib/db';
import { GET } from '@/app/api/projects/summary/route';

jest.mock('next-auth');
jest.mock('@/lib/db');

describe('GET /api/projects/summary', () => {
  const mockSession = {
    user: { id: 1, role: 'ADMIN' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when no session', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/summary');
    const response = await GET(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('should return status counts for ADMIN', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValueOnce({
          preparing: '5',
          in_progress: '3',
          completed: '2',
          on_hold: '1',
        }),
      }),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/summary');
    const response = await GET(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.preparing).toBe(5);
    expect(body.in_progress).toBe(3);
    expect(body.completed).toBe(2);
    expect(body.on_hold).toBe(1);
  });

  it('MANAGER should only see department summary', async () => {
    const managerSession = {
      user: { id: 1, role: 'MANAGER', department_id: 10 },
    };
    (getServerSession as jest.Mock).mockResolvedValueOnce(managerSession);

    const mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValueOnce({
          preparing: '2',
          in_progress: '1',
          completed: '1',
          on_hold: '0',
        }),
      }),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/summary');
    const response = await GET(mockRequest);

    const queryBuilder = mockRepo.createQueryBuilder();
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('e.department_id = :departmentId', {
      departmentId: 10,
    });
  });

  it('should apply customer_id filter', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValueOnce({
          preparing: '1',
          in_progress: '0',
          completed: '0',
          on_hold: '0',
        }),
      }),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/summary?customer_id=5');
    await GET(mockRequest);

    const queryBuilder = mockRepo.createQueryBuilder();
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('p.customer_id = :customerId', {
      customerId: 5,
    });
  });
});
