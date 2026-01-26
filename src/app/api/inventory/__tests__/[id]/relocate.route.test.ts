// Generated: 2026-01-26 18:00:00 KST

import { POST } from '../../[id]/relocate/route';
import { NextRequest } from 'next/server';

// ============= Mock Setup =============

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

const mockQuery = jest.fn();
const mockStartTransaction = jest.fn();
const mockCommitTransaction = jest.fn();
const mockRollbackTransaction = jest.fn();
const mockRelease = jest.fn();
const mockCreateQueryRunner = jest.fn(() => ({
  query: mockQuery,
  release: mockRelease,
  startTransaction: mockStartTransaction,
  commitTransaction: mockCommitTransaction,
  rollbackTransaction: mockRollbackTransaction,
}));

jest.mock('@/lib/db', () => ({
  getDataSource: jest.fn(() =>
    Promise.resolve({
      createQueryRunner: mockCreateQueryRunner,
      isInitialized: true
    })
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
}));

jest.mock('reflect-metadata', () => ({}));

describe('POST /api/inventory/[id]/relocate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, name: 'Test User', role: 'ADMIN' }
    });
  });

  test('should relocate inventory from 재고 status', async () => {
    // Mock: SELECT, UPDATE location, INSERT history
    mockQuery
      .mockResolvedValueOnce([{ id: 1, current_status: '재고', current_location: '창고 A-1' }])
      .mockResolvedValueOnce({ affected: 1 })
      .mockResolvedValueOnce({ identifiers: [{ id: 1 }] });
    const body = {
      current_location: '창고 B-1',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/1/relocate'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.current_status).toBe('재고');
    expect(data.current_location).toBe('창고 B-1');
  });

  test('should relocate inventory from 출고 status', async () => {
    const body = {
      current_location: '사무실 B',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/2/relocate'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '2' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.current_status).toBe('출고');
    expect(data.current_location).toBe('사무실 B');
  });

  test('should relocate inventory from 고장 status', async () => {
    const body = {
      current_location: '수리센터 B',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/3/relocate'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '3' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.current_status).toBe('고장');
    expect(data.current_location).toBe('수리센터 B');
  });

  test('should reject relocation of 폐기 status', async () => {
    const body = {
      current_location: '폐기센터',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/4/relocate'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '4' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Cannot relocate disposed inventory');
  });

  test('should require current_location', async () => {
    const body = {};

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/1/relocate'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('current_location');
  });

  test('should allow relocation with optional reason', async () => {
    const body = {
      current_location: '창고 C-1',
      reason: 'Warehouse reorganization',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/1/relocate'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.current_location).toBe('창고 C-1');
  });

  test('should not change status on relocation', async () => {
    const body = {
      current_location: '창고 D-1',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/2/relocate'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '2' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    // Status should remain unchanged
    expect(data.current_status).not.toBeUndefined();
  });

  test('should return 404 for non-existent inventory', async () => {
    // Mock: SELECT returns no inventory
    mockQuery.mockResolvedValueOnce([]);

    const body = {
      current_location: '창고 E-1',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/999/relocate'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
  });

  test('should reject invalid ID format', async () => {
    const body = {
      current_location: '창고 F-1',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/invalid/relocate'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: 'invalid' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid ID');
  });
});
