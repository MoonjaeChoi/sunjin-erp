// Generated: 2026-01-26 17:45:00 KST

import { http, HttpResponse } from 'msw';
import { mockInventoryList, mockInventory, mockInventoryStats } from '../fixtures/inventory';

export const handlers = [
  // GET /api/inventory
  http.get('/api/inventory', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

    if (pageSize > 100) {
      return HttpResponse.json(
        { error: 'Page size cannot exceed 100' },
        { status: 400 }
      );
    }

    const start = (page - 1) * pageSize;
    const paginatedData = mockInventoryList.slice(start, start + pageSize);

    return HttpResponse.json({
      data: paginatedData,
      pagination: {
        page,
        pageSize,
        total: mockInventoryList.length,
        totalPages: Math.ceil(mockInventoryList.length / pageSize),
      },
      _links: {
        next: page * pageSize < mockInventoryList.length ? `?page=${page + 1}&pageSize=${pageSize}` : undefined,
        prev: page > 1 ? `?page=${page - 1}&pageSize=${pageSize}` : undefined,
      },
    });
  }),

  // POST /api/inventory
  http.post('/api/inventory', async ({ request }) => {
    const body = await request.json() as any;

    // Validate required fields
    if (!body.category || !body.model || !body.serial_number) {
      return HttpResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check serial number uniqueness
    if (mockInventoryList.some(item => item.serial_number === body.serial_number && !item.deleted_at)) {
      return HttpResponse.json(
        { error: 'Serial number already exists' },
        { status: 409 }
      );
    }

    const newInventory = {
      id: Math.max(...mockInventoryList.map(i => i.id), 0) + 1,
      ...body,
      current_status: '재고',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    return HttpResponse.json(newInventory, { status: 201 });
  }),

  // GET /api/inventory/[id]
  http.get('/api/inventory/:id', ({ params }) => {
    const inventory = mockInventoryList.find(item => item.id === Number(params.id) && !item.deleted_at);

    if (!inventory) {
      return HttpResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      ...inventory,
      histories: [
        {
          id: 1,
          change_type: 'inbound',
          new_status: '재고',
          changed_at: inventory.created_at,
          changed_by: { id: 1, name: 'System' },
        },
      ],
      isOverdue: false,
      overdueDays: 0,
    });
  }),

  // PUT /api/inventory/[id]
  http.put('/api/inventory/:id', async ({ params, request }) => {
    const body = await request.json() as any;
    const inventory = mockInventoryList.find(item => item.id === Number(params.id));

    if (!inventory) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (inventory.current_status === '폐기') {
      return HttpResponse.json(
        { error: 'Cannot update discarded equipment' },
        { status: 400 }
      );
    }

    const updated = {
      ...inventory,
      ...body,
      updated_at: new Date().toISOString(),
    };

    return HttpResponse.json(updated);
  }),

  // DELETE /api/inventory/[id]
  http.delete('/api/inventory/:id', ({ params }) => {
    const inventory = mockInventoryList.find(item => item.id === Number(params.id));

    if (!inventory || inventory.deleted_at) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }

    inventory.deleted_at = new Date().toISOString();
    return HttpResponse.json({ success: true });
  }),

  // POST /api/inventory/[id]/checkout
  http.post('/api/inventory/:id/checkout', async ({ params, request }) => {
    const body = await request.json() as any;
    const inventory = mockInventoryList.find(item => item.id === Number(params.id));

    if (!inventory) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (inventory.current_status !== '재고') {
      return HttpResponse.json(
        { error: 'Cannot checkout non-stock equipment' },
        { status: 400 }
      );
    }

    inventory.current_status = '출고';
    inventory.updated_at = new Date().toISOString();

    return HttpResponse.json(inventory);
  }),

  // POST /api/inventory/[id]/checkin
  http.post('/api/inventory/:id/checkin', async ({ params, request }) => {
    const body = await request.json() as any;
    const inventory = mockInventoryList.find(item => item.id === Number(params.id));

    if (!inventory) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (inventory.current_status !== '출고') {
      return HttpResponse.json(
        { error: 'Cannot checkin non-checkout equipment' },
        { status: 400 }
      );
    }

    inventory.current_status = '재고';
    inventory.current_location = body.new_location;
    inventory.updated_at = new Date().toISOString();

    return HttpResponse.json(inventory);
  }),

  // POST /api/inventory/[id]/relocate
  http.post('/api/inventory/:id/relocate', async ({ params, request }) => {
    const body = await request.json() as any;
    const inventory = mockInventoryList.find(item => item.id === Number(params.id));

    if (!inventory) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (inventory.current_status === '폐기') {
      return HttpResponse.json(
        { error: 'Cannot relocate discarded equipment' },
        { status: 400 }
      );
    }

    inventory.current_location = body.new_location;
    inventory.updated_at = new Date().toISOString();

    return HttpResponse.json(inventory);
  }),

  // POST /api/inventory/[id]/status-change
  http.post('/api/inventory/:id/status-change', async ({ params, request }) => {
    const body = await request.json() as any;
    const inventory = mockInventoryList.find(item => item.id === Number(params.id));

    if (!inventory) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Simple state transition validation
    const validTransitions: Record<string, string[]> = {
      '재고': ['고장', '폐기'],
      '출고': ['고장'],
      '고장': ['폐기'],
      '폐기': [],
    };

    if (!validTransitions[inventory.current_status]?.includes(body.new_status)) {
      return HttpResponse.json(
        { error: 'Invalid state transition' },
        { status: 400 }
      );
    }

    inventory.current_status = body.new_status;
    inventory.updated_at = new Date().toISOString();

    return HttpResponse.json(inventory);
  }),

  // GET /api/inventory/stats
  http.get('/api/inventory/stats', () => {
    return HttpResponse.json(mockInventoryStats);
  }),
];
