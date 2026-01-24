// Generated: 2026-01-25 06:40:00 KST

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

const mockFindOne = jest.fn();
const mockSave = jest.fn();
const mockGetRepository = jest.fn(() => ({
  findOne: mockFindOne,
  save: mockSave,
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
}));
jest.mock('reflect-metadata', () => ({}));

const mockMkdir = jest.fn().mockResolvedValue(undefined);
const mockWriteFile = jest.fn().mockResolvedValue(undefined);
const mockUnlink = jest.fn().mockResolvedValue(undefined);
const mockReadFile = jest.fn();
const mockChmod = jest.fn().mockResolvedValue(undefined);
jest.mock('fs/promises', () => ({
  mkdir: (...args: any[]) => mockMkdir(...args),
  writeFile: (...args: any[]) => mockWriteFile(...args),
  unlink: (...args: any[]) => mockUnlink(...args),
  readFile: (...args: any[]) => mockReadFile(...args),
  chmod: (...args: any[]) => mockChmod(...args),
}));

jest.mock('crypto', () => ({
  randomUUID: () => 'test-uuid-1234',
}));

jest.mock('path', () => ({
  resolve: (...args: string[]) => args.join('/'),
  join: (...args: string[]) => args.join('/'),
  basename: (p: string) => p.split('/').pop(),
}));

jest.mock('@/lib/file-utils', () => ({
  validateFile: jest.fn(() => ({ valid: true })),
  sanitizeFilename: jest.fn((name: string) => name),
  getMimeType: jest.fn(() => 'application/pdf'),
  getExtension: jest.fn(() => 'pdf'),
}));

import { POST, GET, DELETE } from '@/app/api/support/[id]/attachment/route';
import { validateFile } from '@/lib/file-utils';

const mockParams = { params: { id: '1' } };

function makeRequest(options?: { formData?: any }) {
  return {
    url: 'http://localhost:3000/api/support/1/attachment',
    formData: options?.formData || jest.fn().mockResolvedValue(new FormData()),
  } as any;
}

describe('POST /api/support/[id]/attachment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const req = makeRequest();
    const res = await POST(req, mockParams);
    expect(res.status).toBe(401);
  });

  it('should return 404 when support not found', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    mockFindOne.mockResolvedValue(null);
    const req = makeRequest();
    const res = await POST(req, mockParams);
    expect(res.status).toBe(404);
  });

  it('should return 403 for non-owner', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 2, role: 'USER' } });
    mockFindOne.mockResolvedValue({ id: 1, employee_id: 1, attachment_path: null });
    const req = makeRequest();
    const res = await POST(req, mockParams);
    expect(res.status).toBe(403);
  });

  it('should return 400 when no file provided', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    mockFindOne.mockResolvedValue({ id: 1, employee_id: 1, attachment_path: null });

    const formData = new FormData();
    const req = makeRequest({ formData: jest.fn().mockResolvedValue(formData) });
    const res = await POST(req, mockParams);
    expect(res.status).toBe(400);
  });

  it('should return 400 when file validation fails', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    mockFindOne.mockResolvedValue({ id: 1, employee_id: 1, attachment_path: null });
    (validateFile as jest.Mock).mockReturnValue({ valid: false, error: 'File size exceeds 10MB limit' });

    const formData = new FormData();
    const file = new File(['content'], 'big.pdf', { type: 'application/pdf' });
    formData.append('file', file);
    const req = makeRequest({ formData: jest.fn().mockResolvedValue(formData) });
    const res = await POST(req, mockParams);
    expect(res.status).toBe(400);
  });

  it('should upload file and update DB', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    mockFindOne.mockResolvedValue({ id: 1, employee_id: 1, attachment_path: null, attachment_name: null });
    (validateFile as jest.Mock).mockReturnValue({ valid: true });
    mockSave.mockImplementation((s: any) => Promise.resolve(s));

    const formData = new FormData();
    const content = Buffer.from('content');
    const file = new File([content], 'report.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'arrayBuffer', { value: () => Promise.resolve(content.buffer) });
    formData.append('file', file);
    const req = makeRequest({ formData: jest.fn().mockResolvedValue(formData) });
    const res = await POST(req, mockParams);

    expect(res.status).toBe(200);
    expect(mockWriteFile).toHaveBeenCalled();
    expect(mockChmod).toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalled();
  });

  it('should delete existing file when replacing', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    mockFindOne.mockResolvedValue({ id: 1, employee_id: 1, attachment_path: 'support/1/old.pdf', attachment_name: 'old.pdf' });
    (validateFile as jest.Mock).mockReturnValue({ valid: true });
    mockSave.mockImplementation((s: any) => Promise.resolve(s));

    const formData = new FormData();
    const content = Buffer.from('content');
    const file = new File([content], 'new.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'arrayBuffer', { value: () => Promise.resolve(content.buffer) });
    formData.append('file', file);
    const req = makeRequest({ formData: jest.fn().mockResolvedValue(formData) });
    await POST(req, mockParams);

    expect(mockUnlink).toHaveBeenCalled();
  });
});

describe('GET /api/support/[id]/attachment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const req = makeRequest();
    const res = await GET(req, mockParams);
    expect(res.status).toBe(401);
  });

  it('should return 404 when no attachment', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    mockFindOne.mockResolvedValue({ id: 1, employee_id: 1, attachment_path: null });
    const req = makeRequest();
    const res = await GET(req, mockParams);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/support/[id]/attachment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const req = makeRequest();
    const res = await DELETE(req, mockParams);
    expect(res.status).toBe(401);
  });

  it('should delete attachment and update DB', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 1, role: 'USER' } });
    const support = { id: 1, employee_id: 1, attachment_path: 'support/1/file.pdf', attachment_name: 'file.pdf' };
    mockFindOne.mockResolvedValue(support);
    mockSave.mockImplementation((s: any) => Promise.resolve(s));

    const req = makeRequest();
    const res = await DELETE(req, mockParams);

    expect(res.status).toBe(200);
    expect(mockUnlink).toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
      attachment_path: null,
      attachment_name: null,
    }));
  });
});
