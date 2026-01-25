// Generated: 2026-01-25 17:28:00 KST

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { getDataSource } from '@/lib/db';
import { POST as uploadAttachment, GET as downloadAttachment, DELETE as deleteAttachment } from '@/app/api/projects/[id]/attachments/[attachmentId]/route';
import { POST as uploadAttachmentMain } from '@/app/api/projects/[id]/attachments/route';

jest.mock('next-auth');
jest.mock('@/lib/db');
jest.mock('fs/promises');
jest.mock('crypto');

describe('POST /api/projects/[id]/attachments', () => {
  const mockSession = {
    user: { id: 1, role: 'ADMIN' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when no session', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/1/attachments', {
      method: 'POST',
      body: new FormData(),
    });

    const response = await uploadAttachmentMain(mockRequest, { params: { id: '1' } });
    const body = await response.json();

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent project', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockProjectRepo = {
      findOne: jest.fn().mockResolvedValueOnce(null),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockProjectRepo),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const formData = new FormData();
    formData.append('file', new File(['test'], 'test.pdf'));
    formData.append('category', 'CONTRACT');

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/999/attachments', {
      method: 'POST',
      body: formData,
    });

    const response = await uploadAttachmentMain(mockRequest, { params: { id: '999' } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Project not found');
  });

  it('should return 400 when file is missing', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockProjectRepo = {
      findOne: jest.fn().mockResolvedValueOnce({ id: 1, employee_id: 1 }),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockProjectRepo),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const formData = new FormData();
    formData.append('category', 'CONTRACT');

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/1/attachments', {
      method: 'POST',
      body: formData,
    });

    const response = await uploadAttachmentMain(mockRequest, { params: { id: '1' } });
    const body = await response.json();

    expect(response.status).toBe(400);
  });
});

describe('GET /api/projects/[id]/attachments/[attachmentId]', () => {
  const mockSession = {
    user: { id: 1, role: 'ADMIN' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when no session', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/1/attachments/1');
    const response = await downloadAttachment(mockRequest, {
      params: { id: '1', attachmentId: '1' },
    });
    const body = await response.json();

    expect(response.status).toBe(401);
  });

  it('should return 400 for invalid IDs', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/abc/attachments/1');
    const response = await downloadAttachment(mockRequest, {
      params: { id: 'abc', attachmentId: '1' },
    });
    const body = await response.json();

    expect(response.status).toBe(400);
  });

  it('should return 404 for non-existent attachment', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockProjectRepo = {
      findOne: jest.fn().mockResolvedValueOnce({ id: 1, employee_id: 1 }),
    };

    const mockAttachmentRepo = {
      findOne: jest.fn().mockResolvedValueOnce(null),
    };

    const mockDataSource = {
      getRepository: jest.fn((entity) => {
        if (entity.name === 'Project') return mockProjectRepo;
        if (entity.name === 'ProjectAttachment') return mockAttachmentRepo;
        return null;
      }),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/1/attachments/999');
    const response = await downloadAttachment(mockRequest, {
      params: { id: '1', attachmentId: '999' },
    });
    const body = await response.json();

    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/projects/[id]/attachments/[attachmentId]', () => {
  const mockSession = {
    user: { id: 1, role: 'ADMIN' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when no session', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/1/attachments/1', {
      method: 'DELETE',
    });

    const response = await deleteAttachment(mockRequest, {
      params: { id: '1', attachmentId: '1' },
    });
    const body = await response.json();

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent attachment', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const mockProjectRepo = {
      findOne: jest.fn().mockResolvedValueOnce({ id: 1, employee_id: 1 }),
    };

    const mockAttachmentRepo = {
      findOne: jest.fn().mockResolvedValueOnce(null),
    };

    const mockDataSource = {
      getRepository: jest.fn((entity) => {
        if (entity.name === 'Project') return mockProjectRepo;
        if (entity.name === 'ProjectAttachment') return mockAttachmentRepo;
        return null;
      }),
    };

    (getDataSource as jest.Mock).mockResolvedValueOnce(mockDataSource);

    const mockRequest = new NextRequest('http://localhost:3000/api/projects/1/attachments/999', {
      method: 'DELETE',
    });

    const response = await deleteAttachment(mockRequest, {
      params: { id: '1', attachmentId: '999' },
    });
    const body = await response.json();

    expect(response.status).toBe(404);
  });
});
