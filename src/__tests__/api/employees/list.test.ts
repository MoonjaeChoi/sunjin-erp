// Generated: 2026-01-25 17:28:00 KST

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { getDataSource } from '@/lib/db';
import { GET } from '@/app/api/employees/list/route';

jest.mock('next-auth');
jest.mock('@/lib/db');

describe('GET /api/employees/list', () => {
  const mockSession = {
    user: { id: 1, role: 'ADMIN' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when no session', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const mockRequest = new NextRequest('http://localhost:3000/api/employees/list');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('should return all employees for ADMIN', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValueOnce([
          { id: 1, name: 'Employee A', department_name: 'IT' },
          { id: 2, name: 'Employee B', department_name: 'Sales' },
        ]),
      }),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/employees/list');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.employees).toHaveLength(2);
    expect(body.employees[0].name).toBe('Employee A');
  });

  it('MANAGER should only see department employees', async () => {
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
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValueOnce([
          { id: 1, name: 'Employee A', department_name: 'IT' },
        ]),
      }),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/employees/list');
    await GET();

    const queryBuilder = mockRepo.createQueryBuilder();
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('e.department_id = :departmentId', {
      departmentId: 10,
    });
  });

  it('should return employees sorted by name', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValueOnce([]),
      }),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/employees/list');
    await GET();

    const queryBuilder = mockRepo.createQueryBuilder();
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('e.name', 'ASC');
  });
});
