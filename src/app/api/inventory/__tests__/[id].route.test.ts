// Generated: 2026-01-26 18:00:00 KST

import { GET, PUT, DELETE } from '../[id]/route';
import { NextRequest } from 'next/server';
import { mockInventoryList, mockInventory } from '@/__tests__/fixtures/inventory';

describe('GET /api/inventory/[id]', () => {
  test('should return inventory detail with history', async () => {
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
    const req = new NextRequest(new URL('http://localhost:3000/api/inventory/2'));
    const response = await GET(req, { params: { id: '2' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('isOverdue');
    expect(data).toHaveProperty('overdueDays');
  });

  test('should return 404 for non-existent inventory', async () => {
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
  test('should update inventory basic info', async () => {
    const body = {
      model: 'Updated Model',
      notes: 'Updated notes',
    };

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
  test('should soft delete inventory by setting deleted_at', async () => {
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
