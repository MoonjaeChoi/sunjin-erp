// Generated: 2026-01-26 18:00:00 KST

import { POST } from '../../[id]/status-change/route';
import { NextRequest } from 'next/server';

describe('POST /api/inventory/[id]/status-change', () => {
  test('should change status from 재고 to 출고', async () => {
    const body = {
      current_status: '출고',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/1/status-change'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.current_status).toBe('출고');
  });

  test('should change status from 재고 to 고장', async () => {
    const body = {
      current_status: '고장',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/1/status-change'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.current_status).toBe('고장');
  });

  test('should change status from 재고 to 폐기', async () => {
    const body = {
      current_status: '폐기',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/1/status-change'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.current_status).toBe('폐기');
  });

  test('should change status from 출고 to 재고', async () => {
    const body = {
      current_status: '재고',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/2/status-change'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '2' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.current_status).toBe('재고');
  });

  test('should change status from 출고 to 고장', async () => {
    const body = {
      current_status: '고장',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/2/status-change'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '2' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.current_status).toBe('고장');
  });

  test('should change status from 고장 to 폐기', async () => {
    const body = {
      current_status: '폐기',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/3/status-change'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '3' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.current_status).toBe('폐기');
  });

  test('should reject invalid transition: 출고 to 폐기', async () => {
    const body = {
      current_status: '폐기',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/2/status-change'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '2' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Cannot transition');
  });

  test('should reject invalid transition: 폐기 to 재고', async () => {
    const body = {
      current_status: '재고',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/4/status-change'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '4' } });
    const data = await response.json();

    expect(response.status).toBe(404);
  });

  test('should require current_status', async () => {
    const body = {};

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/1/status-change'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('current_status');
  });

  test('should allow status change with optional reason', async () => {
    const body = {
      current_status: '고장',
      reason: 'Hardware failure detected',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/1/status-change'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
  });

  test('should return 404 for non-existent inventory', async () => {
    const body = {
      current_status: '고장',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/999/status-change'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
  });

  test('should reject invalid ID format', async () => {
    const body = {
      current_status: '고장',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/invalid/status-change'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: 'invalid' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid ID');
  });

  test('should reject same status transition', async () => {
    const body = {
      current_status: '재고',
    };

    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/1/status-change'), {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(req, { params: { id: '1' } });
    const data = await response.json();

    // Should reject same status (inventory at id:1 is already 재고)
    expect(response.status).toBe(400);
  });
});
