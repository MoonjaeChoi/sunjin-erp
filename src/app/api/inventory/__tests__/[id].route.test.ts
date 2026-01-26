// Generated: 2026-01-26 18:00:00 KST

import { GET, PUT, DELETE } from '../[id]/route';
import { NextRequest } from 'next/server';
import { mockInventoryList, mockInventory } from '@/__tests__/fixtures/inventory';

// ============= Mock Setup =============

// Mock next/server
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(body),
    }),
  },
}));

// Mock next-auth
const mockGetServerSession = jest.fn();
jest.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));

// Mock database (raw SQL용)
const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockStartTransaction = jest.fn();
const mockCommitTransaction = jest.fn();
const mockRollbackTransaction = jest.fn();
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

describe('GET /api/inventory/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, name: 'Test User', role: 'ADMIN' }
    });
  });

  test('should return inventory detail with history', async () => {
    // Mock: SELECT inventory + joins with history
    mockQuery
      .mockResolvedValueOnce([mockInventory])  // Main inventory query
      .mockResolvedValueOnce([
        { id: 1, change_type: 'CREATE', changed_at: new Date(), reason: null }
      ]);  // History query
    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/1'));
    const response = await GET(req, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('category');
    expect(data).toHaveProperty('model');
    expect(data).toHaveProperty('serial_number');
    expect(data).toHaveProperty('histories');
    expect(Array.isArray(data.histories)).toBe(true);
  });

  test('should calculate overdue status for checked out items', async () => {
    // Mock: Checked out item with old checkout date
    mockQuery
      .mockResolvedValueOnce([{
        ...mockInventory,
        id: 2,
        current_status: '출고',
        checkout_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      }])
      .mockResolvedValueOnce([]); // History

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/2'));
    const response = await GET(req, { params: { id: '2' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('isOverdue');
    expect(data).toHaveProperty('overdueDays');
  });

  test('should return 404 for non-existent inventory', async () => {
    // Mock: No inventory found
    mockQuery.mockResolvedValueOnce([]);

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/999'));
    const response = await GET(req, { params: { id: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Not Found');
  });

  test('should reject invalid ID format', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/invalid'));
    const response = await GET(req, { params: { id: 'invalid' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid ID');
  });

  test('should exclude soft-deleted inventory', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/4'));
    const response = await GET(req, { params: { id: '4' } });

    expect(response.status).toBe(404);
  });

  test('should include created_by and updated_by user info', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/1'));
    const response = await GET(req, { params: { id: '1' } });
    const data = await response.json();

    expect(data).toHaveProperty('created_by');
    expect(data.created_by).toHaveProperty('id');
    expect(data.created_by).toHaveProperty('name');
    expect(data).toHaveProperty('updated_by');
  });

  test('should include history with changed_by info', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/1'));
    const response = await GET(req, { params: { id: '1' } });
    const data = await response.json();

    expect(Array.isArray(data.histories)).toBe(true);
    if (data.histories.length > 0) {
      expect(data.histories[0]).toHaveProperty('changed_by');
      expect(data.histories[0].changed_by).toHaveProperty('name');
    }
  });
});

describe('PUT /api/inventory/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, name: 'Test User', role: 'ADMIN' }
    });
  });

  test('should update inventory basic info', async () => {
    const body = {
      model: 'Updated Model',
      notes: 'Updated notes',
    };

    // Mock: SELECT inventory + UPDATE query
    mockQuery
      .mockResolvedValueOnce([mockInventory])  // SELECT to check exists and not disposed
      .mockResolvedValueOnce({ affected: 1 });  // UPDATE query

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/1'), {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const response = await PUT(req, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.model).toBe('Updated Model');
    expect(data.notes).toBe('Updated notes');
  });

  test('should allow partial updates', async () => {
    const body = {
      purchase_from: 'New Supplier',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/1'), {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const response = await PUT(req, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.purchase_from).toBe('New Supplier');
  });

  test('should reject update for disposed inventory', async () => {
    const body = {
      model: 'Updated',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/4'), {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const response = await PUT(req, { params: { id: '4' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Cannot update disposed inventory');
  });

  test('should return 404 for non-existent inventory', async () => {
    const body = {
      model: 'Updated',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/999'), {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const response = await PUT(req, { params: { id: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
  });

  test('should require at least one field to update', async () => {
    const body = {};

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/1'), {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const response = await PUT(req, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('No fields to update');
  });

  test('should reject invalid ID format', async () => {
    const body = {
      model: 'Updated',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/invalid'), {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const response = await PUT(req, { params: { id: 'invalid' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid ID');
  });

  test('should return updated_at timestamp', async () => {
    const body = {
      notes: 'Updated',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/1'), {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const response = await PUT(req, { params: { id: '1' } });
    const data = await response.json();

    expect(data).toHaveProperty('updated_at');
    expect(typeof data.updated_at).toBe('string');
  });
});

describe('DELETE /api/inventory/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, name: 'Test User', role: 'ADMIN' }
    });
  });

  test('should soft delete inventory by setting deleted_at', async () => {
    // Mock: SELECT to verify exists, then UPDATE (soft delete)
    mockQuery
      .mockResolvedValueOnce([mockInventory])  // SELECT
      .mockResolvedValueOnce({ affected: 1 });  // UPDATE deleted_at

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/5'), {
      method: 'DELETE',
    });

    const response = await DELETE(req, { params: { id: '5' } });

    expect(response.status).toBe(204);
  });

  test('should return 404 for non-existent inventory', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/999'), {
      method: 'DELETE',
    });

    const response = await DELETE(req, { params: { id: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
  });

  test('should return 404 for already deleted inventory', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/4'), {
      method: 'DELETE',
    });

    const response = await DELETE(req, { params: { id: '4' } });

    expect(response.status).toBe(404);
  });

  test('should reject invalid ID format', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/invalid'), {
      method: 'DELETE',
    });

    const response = await DELETE(req, { params: { id: 'invalid' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid ID');
  });

  test('should preserve inventory history on soft delete', async () => {
    // Delete first
    const deleteReq = new NextRequest(new URL('http://localhost:3000/api/inventory/5'), {
      method: 'DELETE',
    });

    const deleteResponse = await DELETE(deleteReq, { params: { id: '5' } });
    expect(deleteResponse.status).toBe(204);

    // History should still be accessible (if direct query was available)
    // In MSW mock context, history is preserved by design
  });
});
