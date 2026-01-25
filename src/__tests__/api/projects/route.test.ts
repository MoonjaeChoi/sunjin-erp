// Generated: 2026-01-25 17:25:00 KST

import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { getDataSource } from '@/lib/db';
import { GET as getProjects, POST as createProject } from '@/app/api/projects/route';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/db');

describe('GET /api/projects', () => {
  const mockSession = {
    user: {
      id: 1,
      role: 'ADMIN',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when no session', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects?page=1&page_size=20');
    const response = await getProjects(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid sort_by parameter', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockRequest = new NextRequest(
      'http://localhost:3000/api/projects?page=1&sort_by=invalid'
    );
    const response = await getProjects(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid sort_by parameter');
  });

  it('should return 400 for keyword less than 2 characters', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockRequest = new NextRequest(
      'http://localhost:3000/api/projects?page=1&keyword=a'
    );
    const response = await getProjects(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Keyword must be at least 2 characters');
  });

  it('should return projects list with default pagination', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            p_id: 1,
            p_project_code: 'PJT-20260125-001',
            p_project_name: 'Project A',
            p_customer_id: 1,
            customer_name: 'Customer A',
            p_employee_id: 1,
            e_name: 'Employee A',
            p_status: 'PREPARING',
            p_start_date: new Date('2026-01-25'),
            p_end_date: new Date('2026-02-25'),
            p_contract_amount: 100000,
            p_created_at: new Date('2026-01-25'),
          },
        ]),
      }),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects?page=1');
    const response = await getProjects(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.projects).toHaveLength(1);
    expect(body.total).toBe(2);
    expect(body.page).toBe(1);
    expect(body.page_size).toBe(20);
  });

  it('MANAGER should only see department projects', async () => {
    const managerSession = {
      user: {
        id: 1,
        role: 'MANAGER',
        department_id: 10,
      },
    };

    (getServerSession as jest.Mock).mockResolvedValueOnce(managerSession);

    const mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      }),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects?page=1');
    await getProjects(mockRequest);

    // Verify RBAC filter was applied
    const queryBuilder = mockRepo.createQueryBuilder();
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('e.department_id = :departmentId', {
      departmentId: 10,
    });
  });

  it('USER should only see their own projects', async () => {
    const userSession = {
      user: {
        id: 5,
        role: 'USER',
      },
    };

    (getServerSession as jest.Mock).mockResolvedValueOnce(userSession);

    const mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      }),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects?page=1');
    await getProjects(mockRequest);

    const queryBuilder = mockRepo.createQueryBuilder();
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('p.employee_id = :userId', {
      userId: 5,
    });
  });

  it('should apply customer filter', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      }),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects?page=1&customer_id=5');
    await getProjects(mockRequest);

    const queryBuilder = mockRepo.createQueryBuilder();
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('p.customer_id = :customerId', {
      customerId: 5,
    });
  });

  it('should apply status filter', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      }),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects?page=1&status=IN_PROGRESS');
    await getProjects(mockRequest);

    const queryBuilder = mockRepo.createQueryBuilder();
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('p.status = :status', { status: 'IN_PROGRESS' });
  });

  it('should apply keyword search with 2+ characters', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      }),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects?page=1&keyword=project');
    await getProjects(mockRequest);

    const queryBuilder = mockRepo.createQueryBuilder();
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      '(p.project_name LIKE :keyword OR p.project_code LIKE :keyword)',
      { keyword: '%project%' }
    );
  });

  it('should enforce max page_size of 100', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(100),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      }),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects?page=1&page_size=500');
    const response = await getProjects(mockRequest);
    const body = await response.json();

    expect(body.page_size).toBe(100);
  });
});

describe('POST /api/projects', () => {
  const mockSession = {
    user: {
      id: 1,
      role: 'ADMIN',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when no session', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify({ project_name: 'Test' }),
    });

    const response = await createProject(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('should return 400 for missing project_name', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify({ customer_id: 1, employee_id: 1 }),
    });

    const response = await createProject(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.details.project_name).toBeDefined();
  });

  it('should return 400 for project_name exceeding 200 characters', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const longName = 'a'.repeat(201);
    const mockRequest = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify({
        project_name: longName,
        customer_id: 1,
        employee_id: 1,
      }),
    });

    const response = await createProject(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.details.project_name).toContain('must not exceed 200 characters');
  });

  it('should return 400 for missing customer_id', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify({ project_name: 'Test Project', employee_id: 1 }),
    });

    const response = await createProject(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.details.customer_id).toBeDefined();
  });

  it('should return 400 for missing employee_id', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify({ project_name: 'Test Project', customer_id: 1 }),
    });

    const response = await createProject(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.details.employee_id).toBeDefined();
  });

  it('should return 400 for end_date before start_date', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify({
        project_name: 'Test Project',
        customer_id: 1,
        employee_id: 1,
        start_date: '2026-02-25',
        end_date: '2026-01-25',
      }),
    });

    const response = await createProject(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.details.end_date).toContain('after start date');
  });

  it('should return 400 for negative contract_amount', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify({
        project_name: 'Test Project',
        customer_id: 1,
        employee_id: 1,
        contract_amount: -1000,
      }),
    });

    const response = await createProject(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.details.contract_amount).toContain('non-negative');
  });

  it('should return 400 for non-existent customer', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockCustomerRepo = {
      findOne: jest.fn().mockResolvedValueOnce(null),
    };

    const mockDataSource = {
      getRepository: jest.fn((entity) => {
        if (entity.name === 'Customer') return mockCustomerRepo;
        return { findOne: jest.fn().mockResolvedValueOnce(null) };
      }),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify({
        project_name: 'Test Project',
        customer_id: 999,
        employee_id: 1,
      }),
    });

    const response = await createProject(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Customer not found');
  });

  it('should create project with initial status PREPARING', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockProjectRepo = {
      findOne: jest.fn(),
      create: jest.fn((data) => ({ ...data, id: 1 })),
      save: jest.fn((project) => Promise.resolve({ ...project, id: 1 })),
    };

    const mockCustomerRepo = {
      findOne: jest.fn().mockResolvedValueOnce({ id: 1 }),
    };

    const mockEmployeeRepo = {
      findOne: jest.fn().mockResolvedValueOnce({ id: 1 }),
    };

    const mockDataSource = {
      getRepository: jest.fn((entity) => {
        if (entity.name === 'Project') return mockProjectRepo;
        if (entity.name === 'Customer') return mockCustomerRepo;
        if (entity.name === 'Employee') return mockEmployeeRepo;
        return null;
      }),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify({
        project_name: 'Test Project',
        customer_id: 1,
        employee_id: 1,
      }),
    });

    const response = await createProject(mockRequest);

    expect(response.status).toBe(201);
    expect(mockProjectRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'PREPARING',
      })
    );
  });
});
