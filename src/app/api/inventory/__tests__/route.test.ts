// Generated: 2026-01-26 17:50:00 KST

import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
import { mockInventoryList, mockInventory } from '@/__tests__/fixtures/inventory';

describe('GET /api/inventory', () => {
  test('should return paginated inventory list', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/inventory'));
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('pagination');
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('should return pagination metadata', async () => {
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
    const req = new NextRequest(new URL('http://localhost:3000/api/inventory?statuses=재고,출고'));
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    data.data.forEach((item: any) => {
      expect(['재고', '출고']).toContain(item.current_status);
    });
  });

  test('should apply location search filter', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/inventory?location=창고'));
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    data.data.forEach((item: any) => {
      expect(item.current_location.toLowerCase()).toContain('창고');
    });
  });

  test('should support sorting', async () => {
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
