// Generated: 2026-01-25 17:25:00 KST

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { getDataSource } from '@/lib/db';
import { GET, PUT, DELETE, PATCH } from '@/app/api/projects/[id]/route';

jest.mock('next-auth');
jest.mock('@/lib/db');

describe('GET /api/projects/[id]', () => {
  const mockSession = {
    user: { id: 1, role: 'ADMIN' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when no session', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/1');
    const response = await GET(mockRequest, { params: { id: '1' } });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid project ID', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/abc');
    const response = await GET(mockRequest, { params: { id: 'abc' } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid project ID');
  });

  it('should return 404 when project not found', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValueOnce(null),
      }),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/999');
    const response = await GET(mockRequest, { params: { id: '999' } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Project not found');
  });

  it('MANAGER should get 403 for different department project', async () => {
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
          department_id: 20, // Different department
          p_id: 1,
        }),
      }),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/1');
    const response = await GET(mockRequest, { params: { id: '1' } });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Forbidden');
  });

  it('USER should get 403 for other employee project', async () => {
    const userSession = {
      user: { id: 5, role: 'USER' },
    };
    (getServerSession as jest.Mock).mockResolvedValueOnce(userSession);

    const mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValueOnce({
          p_employee_id: 10, // Different employee
          p_id: 1,
        }),
      }),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/1');
    const response = await GET(mockRequest, { params: { id: '1' } });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Forbidden');
  });

  it('should return project detail with attachments', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockQueryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValueOnce({
        p_id: 1,
        p_project_name: 'Test Project',
        p_customer_id: 1,
        customer_name: 'Customer A',
        p_employee_id: 1,
        employee_name: 'Employee A',
        department_id: 10,
        department_name: 'IT',
        p_status: 'PREPARING',
        p_stage_meeting_at: new Date('2026-01-25'),
        p_stage_proposal_at: null,
        p_created_at: new Date('2026-01-25'),
        p_updated_at: new Date('2026-01-25'),
      }),
    };

    const mockProjectRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const mockAttachmentRepo = {
      find: jest.fn().mockResolvedValueOnce([
        {
          id: 1,
          file_name: 'doc.pdf',
          file_size: 1024,
          category: 'CONTRACT',
          created_at: new Date('2026-01-25'),
        },
      ]),
    };

    const mockDataSource = {
      getRepository: jest.fn((entity) => {
        if (entity.name === 'Project') return mockProjectRepo;
        if (entity.name === 'ProjectAttachment') return mockAttachmentRepo;
        return null;
      }),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/1');
    const response = await GET(mockRequest, { params: { id: '1' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe(1);
    expect(body.project_name).toBe('Test Project');
    expect(body.attachments).toHaveLength(1);
  });
});

describe('PUT /api/projects/[id]', () => {
  const mockSession = {
    user: { id: 1, role: 'ADMIN' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when no session', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/1', {
      method: 'PUT',
      body: JSON.stringify({ project_name: 'Updated' }),
    });

    const response = await PUT(mockRequest, { params: { id: '1' } });
    const body = await response.json();

    expect(response.status).toBe(401);
  });

  it('should return 400 for invalid ID', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/abc', {
      method: 'PUT',
      body: JSON.stringify({ project_name: 'Updated' }),
    });

    const response = await PUT(mockRequest, { params: { id: 'abc' } });
    const body = await response.json();

    expect(response.status).toBe(400);
  });

  it('should return 400 for empty project_name', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockProjectRepo = {
      findOne: jest.fn().mockResolvedValueOnce({
        id: 1,
        project_name: 'Test',
        status: 'PREPARING',
      }),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockProjectRepo),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/1', {
      method: 'PUT',
      body: JSON.stringify({ project_name: '' }),
    });

    const response = await PUT(mockRequest, { params: { id: '1' } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.details.project_name).toBeDefined();
  });

  it('should return 400 for invalid status transition', async () => {
    const managerSession = {
      user: { id: 1, role: 'MANAGER', department_id: 10 },
    };
    (getServerSession as jest.Mock).mockResolvedValueOnce(managerSession);

    const mockProjectRepo = {
      findOne: jest.fn().mockResolvedValueOnce({
        id: 1,
        status: 'COMPLETED',
        employee_id: 5,
      }),
    };

    const mockEmployeeRepo = {
      findOne: jest.fn().mockResolvedValueOnce({
        id: 5,
        department_id: 10,
      }),
    };

    const mockDataSource = {
      getRepository: jest.fn((entity) => {
        if (entity.name === 'Project') return mockProjectRepo;
        if (entity.name === 'Employee') return mockEmployeeRepo;
        return mockProjectRepo;
      }),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/1', {
      method: 'PUT',
      body: JSON.stringify({ status: 'PREPARING' }), // Invalid transition from COMPLETED
    });

    const response = await PUT(mockRequest, { params: { id: '1' } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.details.status).toContain('Invalid status transition');
  });

  it('ADMIN should bypass status transition rules', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockProjectRepo = {
      findOne: jest.fn().mockResolvedValueOnce({
        id: 1,
        status: 'COMPLETED',
        project_name: 'Test',
      }),
      save: jest.fn().mockResolvedValueOnce({}),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockProjectRepo),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/1', {
      method: 'PUT',
      body: JSON.stringify({ status: 'PREPARING' }),
    });

    const response = await PUT(mockRequest, { params: { id: '1' } });

    expect(response.status).toBe(200);
    expect(mockProjectRepo.save).toHaveBeenCalled();
  });

  it('USER should not be able to change employee_id', async () => {
    const userSession = {
      user: { id: 5, role: 'USER' },
    };
    (getServerSession as jest.Mock).mockResolvedValueOnce(userSession);

    const mockProjectRepo = {
      findOne: jest.fn().mockResolvedValueOnce({
        id: 1,
        employee_id: 5,
      }),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockProjectRepo),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/1', {
      method: 'PUT',
      body: JSON.stringify({ employee_id: 10 }),
    });

    const response = await PUT(mockRequest, { params: { id: '1' } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.details.employee_id).toBeDefined();
  });
});

describe('DELETE /api/projects/[id]', () => {
  const mockSession = {
    user: { id: 1, role: 'ADMIN' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when no session', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/1', {
      method: 'DELETE',
    });

    const response = await DELETE(mockRequest, { params: { id: '1' } });
    const body = await response.json();

    expect(response.status).toBe(401);
  });

  it('should return 400 for invalid ID', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/abc', {
      method: 'DELETE',
    });

    const response = await DELETE(mockRequest, { params: { id: 'abc' } });
    const body = await response.json();

    expect(response.status).toBe(400);
  });

  it('should soft delete project', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockProjectRepo = {
      findOne: jest.fn().mockResolvedValueOnce({
        id: 1,
        employee_id: 1,
      }),
      save: jest.fn().mockResolvedValueOnce({ id: 1, deleted_at: new Date() }),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockProjectRepo),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/1', {
      method: 'DELETE',
    });

    const response = await DELETE(mockRequest, { params: { id: '1' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockProjectRepo.save).toHaveBeenCalled();
  });
});

describe('PATCH /api/projects/[id]/checklist', () => {
  const mockSession = {
    user: { id: 1, role: 'ADMIN' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when no session', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/1/checklist', {
      method: 'PATCH',
      body: JSON.stringify({ stage: 'MEETING', completed: true }),
    });

    const response = await PATCH(mockRequest, { params: { id: '1' } });
    const body = await response.json();

    expect(response.status).toBe(401);
  });

  it('should return 400 for invalid stage', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/1/checklist', {
      method: 'PATCH',
      body: JSON.stringify({ stage: 'INVALID', completed: true }),
    });

    const response = await PATCH(mockRequest, { params: { id: '1' } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid stage');
  });

  it('should toggle checklist stage', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockProjectRepo = {
      findOne: jest.fn().mockResolvedValueOnce({
        id: 1,
        employee_id: 1,
      }),
      save: jest.fn().mockImplementation((project) => Promise.resolve(project)),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockProjectRepo),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/1/checklist', {
      method: 'PATCH',
      body: JSON.stringify({ stage: 'MEETING', completed: true }),
    });

    const response = await PATCH(mockRequest, { params: { id: '1' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.stage).toBe('MEETING');
    expect(body.completed_at).not.toBeNull();
  });

  it('should uncomplete checklist stage', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockProjectRepo = {
      findOne: jest.fn().mockResolvedValueOnce({
        id: 1,
        employee_id: 1,
        stage_meeting_at: new Date(),
      }),
      save: jest.fn().mockImplementation((project) => Promise.resolve(project)),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockProjectRepo),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/1/checklist', {
      method: 'PATCH',
      body: JSON.stringify({ stage: 'MEETING', completed: false }),
    });

    const response = await PATCH(mockRequest, { params: { id: '1' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.completed_at).toBeNull();
  });
});
