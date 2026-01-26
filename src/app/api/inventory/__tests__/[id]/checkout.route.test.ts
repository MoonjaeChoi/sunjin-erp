// Generated: 2026-01-26 18:00:00 KST

import { POST } from '../../[id]/checkout/route';
import { NextRequest } from 'next/server';
import { mockInventory } from '@/__tests__/fixtures/inventory';

describe('POST /api/inventory/[id]/checkout', () => {
  test('should checkout inventory from 재고 status', async () => {
    const body = {
      checkout_location: '사무실 A',
      expected_checkin_date: '2026-02-26',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/1/checkout'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.current_status).toBe('출고');
  });

  test('should require checkout_location', async () => {
    const body = {
      expected_checkin_date: '2026-02-26',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/1/checkout'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('checkout_location');
  });

  test('should reject checkout from non-재고 status', async () => {
    const body = {
      checkout_location: '사무실 B',
      expected_checkin_date: '2026-03-01',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/2/checkout'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '2' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Cannot checkout');
  });

  test('should reject checkout from 고장 status', async () => {
    const body = {
      checkout_location: '수리센터',
      expected_checkin_date: '2026-03-01',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/3/checkout'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '3' } });
    const data = await response.json();

    expect(response.status).toBe(400);
  });

  test('should reject checkout from 폐기 status', async () => {
    const body = {
      checkout_location: '폐기센터',
      expected_checkin_date: '2026-03-01',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/4/checkout'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '4' } });
    const data = await response.json();

    expect(response.status).toBe(404);
  });

  test('should allow checkout with optional reason', async () => {
    const body = {
      checkout_location: '사무실 C',
      expected_checkin_date: '2026-02-20',
      reason: 'System testing',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/1/checkout'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
  });

  test('should return 404 for non-existent inventory', async () => {
    const body = {
      checkout_location: '사무실 D',
      expected_checkin_date: '2026-02-26',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/999/checkout'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
  });

  test('should reject invalid ID format', async () => {
    const body = {
      checkout_location: '사무실 E',
      expected_checkin_date: '2026-02-26',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/invalid/checkout'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: 'invalid' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid ID');
  });

  test('should allow checkout without expected_checkin_date', async () => {
    const body = {
      checkout_location: '사무실 F',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/1/checkout'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.current_status).toBe('출고');
  });
});
