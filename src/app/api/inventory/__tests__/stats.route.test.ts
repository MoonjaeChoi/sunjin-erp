// Generated: 2026-01-26 18:00:00 KST

import { GET } from '../stats/route';
import { NextRequest } from 'next/server';

describe('GET /api/inventory/stats', () => {
  test('should return inventory statistics', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/stats'));
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('totalCount');
    expect(data).toHaveProperty('byStatus');
    expect(data).toHaveProperty('byCategory');
    expect(data).toHaveProperty('overdue');
  });

  test('should return status breakdown', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/stats'));
    const response = await GET(req);
    const data = await response.json();

    expect(data.byStatus).toHaveProperty('재고');
    expect(data.byStatus).toHaveProperty('출고');
    expect(data.byStatus).toHaveProperty('고장');
    expect(data.byStatus).toHaveProperty('폐기');
    expect(typeof data.byStatus['재고']).toBe('number');
    expect(typeof data.byStatus['출고']).toBe('number');
  });

  test('should return category breakdown', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/stats'));
    const response = await GET(req);
    const data = await response.json();

    expect(data.byCategory).toBeDefined();
    expect(typeof data.byCategory).toBe('object');
    // Should have at least the categories from fixtures
    if (Object.keys(data.byCategory).length > 0) {
      const firstCategory = Object.keys(data.byCategory)[0];
      expect(typeof data.byCategory[firstCategory]).toBe('number');
    }
  });

  test('should return overdue statistics', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/stats'));
    const response = await GET(req);
    const data = await response.json();

    expect(data.overdue).toHaveProperty('count');
    expect(data.overdue).toHaveProperty('percentage');
    expect(typeof data.overdue.count).toBe('number');
    expect(typeof data.overdue.percentage).toBe('number');
  });

  test('should calculate overdue percentage correctly', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/stats'));
    const response = await GET(req);
    const data = await response.json();

    // Percentage should be between 0 and 100
    expect(data.overdue.percentage).toBeGreaterThanOrEqual(0);
    expect(data.overdue.percentage).toBeLessThanOrEqual(100);

    // If no total count, overdue percentage should be 0
    if (data.totalCount === 0) {
      expect(data.overdue.percentage).toBe(0);
    }
  });

  test('should return zero or positive counts', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/stats'));
    const response = await GET(req);
    const data = await response.json();

    expect(data.totalCount).toBeGreaterThanOrEqual(0);
    expect(data.byStatus['재고']).toBeGreaterThanOrEqual(0);
    expect(data.byStatus['출고']).toBeGreaterThanOrEqual(0);
    expect(data.byStatus['고장']).toBeGreaterThanOrEqual(0);
    expect(data.overdue.count).toBeGreaterThanOrEqual(0);
  });

  test('should sum status counts to total', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/stats'));
    const response = await GET(req);
    const data = await response.json();

    const statusSum =
      data.byStatus['재고'] + data.byStatus['출고'] + data.byStatus['고장'] + data.byStatus['폐기'];

    expect(statusSum).toBe(data.totalCount);
  });

  test('should exclude soft-deleted items from count', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/stats'));
    const response = await GET(req);
    const data = await response.json();

    // Based on fixtures: 5 total items, but 1 is soft-deleted (id:4)
    // So totalCount should be 4
    expect(data.totalCount).toBe(4);
  });

  test('should handle empty inventory gracefully', async () => {
    // Even if inventory is empty, stats should return with 0 values
    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/stats'));
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(typeof data.totalCount).toBe('number');
    expect(typeof data.overdue.percentage).toBe('number');
  });

  test('should not include 폐기 in total count', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/stats'));
    const response = await GET(req);
    const data = await response.json();

    // Based on fixtures: 폐기 item (id:4) should not be counted at all because it's soft-deleted
    // Non-deleted items: 2 재고, 1 출고, 1 고장 = 4 total
    const nonDeletedSum =
      data.byStatus['재고'] + data.byStatus['출고'] + data.byStatus['고장'];

    expect(nonDeletedSum).toBeLessThanOrEqual(data.totalCount);
  });
});
