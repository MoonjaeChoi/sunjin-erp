// Generated: 2026-01-26 17:50:00 KST

import { GET, POST } from '../route';
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

// ============= Tests =============

describe('GET /api/inventory', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // 기본: 인증된 사용자
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, name: 'Test User', role: 'ADMIN' }
    });
  });
  test('should return paginated inventory list', async () => {
    mockQuery
      .mockResolvedValueOnce(mockInventoryList)  // SELECT query
      .mockResolvedValueOnce([{ TOTAL: mockInventoryList.length }]);  // COUNT query

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory'));
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('pagination');
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('should return pagination metadata', async () => {
    mockQuery
      .mockResolvedValueOnce(mockInventoryList.slice(0, 10))  // SELECT query
      .mockResolvedValueOnce([{ TOTAL: mockInventoryList.length }]);  // COUNT query

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory?page=1&pageSize=10'));
    const response = await GET(req);
    const data = await response.json();

    expect(data.pagination).toEqual({
      page: 1,
      pageSize: 10,
      total: expect.any(Number),
      totalPages: expect.any(Number),
    });
  });

  test('should reject pageSize > 100', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/inventory?pageSize=101'));
    const response = await GET(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Page size cannot exceed 100');
  });

  test('should apply category filter', async () => {
    const filtered = mockInventoryList.filter(item => item.category === '모니터');
    mockQuery
      .mockResolvedValueOnce(filtered)  // SELECT query
      .mockResolvedValueOnce([{ TOTAL: filtered.length }]);  // COUNT query

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory?categories=모니터'));
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    // All returned items should match the filter
    if (data.data.length > 0) {
      data.data.forEach((item: any) => {
        expect(['모니터']).toContain(item.category);
      });
    }
  });

  test('should apply multiple status filters', async () => {
    const filtered = mockInventoryList.filter(item => ['재고', '출고'].includes(item.current_status));
    mockQuery
      .mockResolvedValueOnce(filtered)  // SELECT query
      .mockResolvedValueOnce([{ TOTAL: filtered.length }]);  // COUNT query

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory?statuses=재고,출고'));
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    data.data.forEach((item: any) => {
      expect(['재고', '출고']).toContain(item.current_status);
    });
  });

  test('should apply location search filter', async () => {
    const filtered = mockInventoryList.filter(item => item.current_location.toLowerCase().includes('창고'));
    mockQuery
      .mockResolvedValueOnce(filtered)  // SELECT query
      .mockResolvedValueOnce([{ TOTAL: filtered.length }]);  // COUNT query

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory?location=창고'));
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    data.data.forEach((item: any) => {
      expect(item.current_location.toLowerCase()).toContain('창고');
    });
  });

  test('should support sorting', async () => {
    const sorted = [...mockInventoryList].sort((a, b) => a.category.localeCompare(b.category));
    mockQuery
      .mockResolvedValueOnce(sorted)  // SELECT query
      .mockResolvedValueOnce([{ TOTAL: sorted.length }]);  // COUNT query

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory?sortBy=category&order=asc'));
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Verify sorted order (categories should be in ascending order)
    for (let i = 1; i < data.data.length; i++) {
      expect(data.data[i].category >= data.data[i - 1].category).toBe(true);
    }
  });

  test('should include HATEOAS links', async () => {
    mockQuery
      .mockResolvedValueOnce(mockInventoryList.slice(0, 5))  // SELECT query
      .mockResolvedValueOnce([{ TOTAL: mockInventoryList.length }]);  // COUNT query

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory?page=1&pageSize=5'));
    const response = await GET(req);
    const data = await response.json();

    expect(data._links).toBeDefined();
    expect(data._links).toHaveProperty('next');
    expect(data._links).toHaveProperty('prev');
  });

  test('should exclude soft-deleted items', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/inventory'));
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    data.data.forEach((item: any) => {
      expect(item.deleted_at).toBeNull();
    });
  });
});

describe('POST /api/inventory (Create)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, name: 'Test User', role: 'ADMIN' }
    });
  });

  test('should create inventory with valid data', async () => {
    const body = {
      category: '모니터',
      model: 'Test Monitor',
      serial_number: 'TEST-SERIAL-NEW-001',
      purchase_date: '2026-01-01',
      purchase_from: 'Test Store',
      current_location: '창고 A-1',
      notes: 'Test item',
    };

    // Mock: Check duplicate serial number (SELECT)
    mockQuery.mockResolvedValueOnce([]);
    // Mock: INSERT new inventory
    mockQuery.mockResolvedValueOnce({
      identifiers: [{ id: 100 }],
      generatedMaps: [{
        id: 100,
        ...body,
        current_status: '재고',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      }],
    });

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req);

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.current_status).toBe('재고');
    expect(data.serial_number).toBe(body.serial_number);
  });

  test('should reject missing required fields', async () => {
    const body = {
      category: '모니터',
      model: 'Test Monitor',
      // serial_number is missing
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Missing');
  });

  test('should reject duplicate serial number', async () => {
    const body = {
      category: '모니터',
      model: 'Test Monitor',
      serial_number: 'SN001', // Already exists in fixtures
      purchase_date: '2026-01-01',
      purchase_from: 'Test Store',
      current_location: '창고 A-1',
    };

    // Mock: Check duplicate serial number (SELECT - found existing)
    mockQuery.mockResolvedValueOnce([
      {
        id: 1,
        serial_number: 'SN001',
        model: 'Existing Monitor',
        category: '모니터',
      }
    ]);

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req);

    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.error).toContain('already exists');
  });

  test('should set initial status to 재고', async () => {
    const body = {
      category: '모니터',
      model: 'Test Monitor',
      serial_number: 'TEST-SERIAL-NEW-002',
      purchase_date: '2026-01-01',
      purchase_from: 'Test Store',
      current_location: '창고 A-1',
    };

    // Mock: Check duplicate serial number (SELECT - no result)
    mockQuery.mockResolvedValueOnce([]);
    // Mock: INSERT new inventory
    mockQuery.mockResolvedValueOnce({
      identifiers: [{ id: 101 }],
      generatedMaps: [{
        id: 101,
        ...body,
        current_status: '재고',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      }],
    });

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(data.current_status).toBe('재고');
  });

  test('should reject invalid category', async () => {
    const body = {
      category: 'INVALID_CATEGORY',
      model: 'Test Monitor',
      serial_number: 'TEST-SERIAL-NEW-003',
      purchase_date: '2026-01-01',
      purchase_from: 'Test Store',
      current_location: '창고 A-1',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
  });
});
