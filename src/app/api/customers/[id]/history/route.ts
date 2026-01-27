// Generated: 2026-01-27 10:34:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeQuerySingle } from '@/lib/db-direct';

export const dynamic = 'force-dynamic';

interface HistoryResponse {
  id: number;
  customerId: number;
  changeType: string;
  changedFields: Record<string, any>;
  changedBy: {
    id: number;
    name: string;
  };
  changedAt: string;
}

interface HistoryListResponse {
  data: HistoryResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as any;
  if (!['MANAGER', 'ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const customerId = Number(params.id);
  if (isNaN(customerId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
  const changeType = searchParams.get('changeType'); // Optional filter: CREATE|UPDATE|DELETE|CONTACT_ADD|CONTACT_DELETE
  const fromDate = searchParams.get('fromDate'); // Optional ISO date string
  const toDate = searchParams.get('toDate'); // Optional ISO date string
  const sortBy = searchParams.get('sortBy') || 'changed_at'; // changed_at|change_type
  const sortOrder = (searchParams.get('sortOrder') || 'DESC').toUpperCase();

  // Validate sortOrder
  if (!['ASC', 'DESC'].includes(sortOrder)) {
    return NextResponse.json({ error: 'Invalid sortOrder' }, { status: 400 });
  }

  // Validate sortBy
  if (!['changed_at', 'change_type'].includes(sortBy)) {
    return NextResponse.json({ error: 'Invalid sortBy' }, { status: 400 });
  }

  try {
    // Verify customer exists
    const customerResult = await executeQuerySingle(
      `SELECT id FROM CUSTOMER WHERE id = :customerId AND deleted_at IS NULL`,
      { customerId }
    );

    if (!customerResult) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Build query for total count
    let countSql = `
      SELECT COUNT(*) as total FROM CUSTOMER_HISTORY
      WHERE customer_id = :customerId
    `;
    const countParams: any = { customerId };

    // Add filters
    if (changeType) {
      countSql += ` AND change_type = :changeType`;
      countParams.changeType = changeType;
    }

    if (fromDate) {
      try {
        new Date(fromDate); // Validate ISO format
        countSql += ` AND changed_at >= :fromDate`;
        countParams.fromDate = new Date(fromDate);
      } catch {
        return NextResponse.json(
          { error: 'Invalid fromDate format (use ISO 8601)' },
          { status: 400 }
        );
      }
    }

    if (toDate) {
      try {
        new Date(toDate); // Validate ISO format
        countSql += ` AND changed_at <= :toDate`;
        countParams.toDate = new Date(toDate);
      } catch {
        return NextResponse.json(
          { error: 'Invalid toDate format (use ISO 8601)' },
          { status: 400 }
        );
      }
    }

    const countResult = await executeQuery(countSql, countParams);
    const total = Number(countResult.rows[0]?.total || 0);
    const totalPages = Math.ceil(total / limit);

    // Build main query
    let sql = `
      SELECT
        h.id,
        h.customer_id as customerId,
        h.change_type as changeType,
        h.changed_fields as changedFields,
        h.changed_by_id as changedById,
        h.changed_at as changedAt,
        e.id as employeeId,
        e.name as employeeName
      FROM CUSTOMER_HISTORY h
      LEFT JOIN EMPLOYEE e ON h.changed_by_id = e.id
      WHERE h.customer_id = :customerId
    `;

    const params: any = { customerId };

    // Add filters
    if (changeType) {
      sql += ` AND h.change_type = :changeType`;
      params.changeType = changeType;
    }

    if (fromDate) {
      sql += ` AND h.changed_at >= :fromDate`;
      params.fromDate = new Date(fromDate);
    }

    if (toDate) {
      sql += ` AND h.changed_at <= :toDate`;
      params.toDate = new Date(toDate);
    }

    // Add sorting
    sql += ` ORDER BY h.${sortBy} ${sortOrder}`;

    // Add pagination
    const offset = (page - 1) * limit;
    sql += ` LIMIT :limit OFFSET :offset`;
    params.limit = limit;
    params.offset = offset;

    const recordsResult = await executeQuery(sql, params);

    // Transform response
    const data: HistoryResponse[] = recordsResult.rows.map((record: any) => ({
      id: record.id,
      customerId: record.customerId,
      changeType: record.changeType,
      changedFields: record.changedFields ? JSON.parse(record.changedFields) : {},
      changedBy: {
        id: record.changedById,
        name: record.employeeName || 'Unknown User',
      },
      changedAt: record.changedAt,
    }));

    const response: HistoryListResponse = {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error(`GET /api/customers/${customerId}/history error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
