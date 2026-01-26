// Generated: 2026-01-26 18:00:00 KST

import { POST } from '../../[id]/checkin/route';
import { NextRequest } from 'next/server';
import { mockInventoryList } from '@/__tests__/fixtures/inventory';

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

describe('POST /api/inventory/[id]/checkin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, name: 'Test User', role: 'ADMIN' }
    });
  });

  test('should checkin (return) inventory from 출고 status', async () => {
    // Mock: SELECT inventory (status=출고), UPDATE, INSERT history
    mockQuery
      .mockResolvedValueOnce([{ ...mockInventoryList[0], id: 2, current_status: '출고' }])  // SELECT
      .mockResolvedValueOnce({ affected: 1 })  // UPDATE to 재고
      .mockResolvedValueOnce({ identifiers: [{ id: 1 }] });  // INSERT history

    const body = {
      current_location: '창고 A-1',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/2/checkin'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '2' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.current_status).toBe('재고');
    expect(data.current_location).toBe('창고 A-1');
  });

  test('should require current_location', async () => {
    const body = {};

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/2/checkin'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '2' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('current_location');
  });

  test('should reject checkin from 재고 status', async () => {
    // Mock: SELECT inventory with status 재고 (not 출고)
    mockQuery.mockResolvedValueOnce([{ ...mockInventoryList[0], id: 1, current_status: '재고' }]);

    const body = {
      current_location: '창고 A-2',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/1/checkin'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Cannot checkin');
  });

  test('should reject checkin from 고장 status', async () => {
    const body = {
      current_location: '수리센터',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/3/checkin'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '3' } });
    const data = await response.json();

    expect(response.status).toBe(400);
  });

  test('should reject checkin from 폐기 status', async () => {
    const body = {
      current_location: '창고',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/4/checkin'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '4' } });
    const data = await response.json();

    expect(response.status).toBe(404);
  });

  test('should allow checkin with optional reason', async () => {
    const body = {
      current_location: '창고 B-1',
      reason: 'Return from user',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/2/checkin'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '2' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.current_status).toBe('재고');
  });

  test('should return 404 for non-existent inventory', async () => {
    // Mock: SELECT returns no inventory
    mockQuery.mockResolvedValueOnce([]);

    const body = {
      current_location: '창고 C-1',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/999/checkin'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
  });

  test('should reject invalid ID format', async () => {
    const body = {
      current_location: '창고 D-1',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/invalid/checkin'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: 'invalid' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid ID');
  });

  test('should update inventory location on checkin', async () => {
    const body = {
      current_location: '창고 E-1',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/2/checkin'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '2' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.current_location).toBe('창고 E-1');
  });
});
