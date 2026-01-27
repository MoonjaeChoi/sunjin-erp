// Generated: 2026-01-27 14:02:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeQuerySingle, executeUpdate } from '@/lib/db-direct';
import { InventoryDetail } from '@/types/inventory';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const inventoryId = parseInt(params.id, 10);
    if (isNaN(inventoryId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
      // Fetch inventory details
      const inventory = await executeQuerySingle(
        `
          SELECT
            i.ID,
            i.CATEGORY,
            i.MODEL,
            i.SERIAL_NUMBER,
            i.PURCHASE_DATE,
            i.PURCHASE_FROM,
            i.CURRENT_LOCATION,
            i.CURRENT_STATUS,
            i.NOTES,
            i.CREATED_AT,
            i.UPDATED_AT,
            i.CREATED_BY_ID,
            i.UPDATED_BY_ID,
            ec."name" as created_by_name,
            eu."name" as updated_by_name,
            ec."department_id" as created_by_department,
            eu."department_id" as updated_by_department
          FROM INVENTORY i
          LEFT JOIN EMPLOYEE ec ON ec."id" = i.CREATED_BY_ID AND ec."deleted_at" IS NULL
          LEFT JOIN EMPLOYEE eu ON eu."id" = i.UPDATED_BY_ID AND eu."deleted_at" IS NULL
          WHERE i.ID = :id AND i.DELETED_AT IS NULL
        `,
        { id: inventoryId }
      );

      if (!inventory) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      }

      // Fix corrupted status values
      let currentStatus = inventory.CURRENT_STATUS;
      if (currentStatus && typeof currentStatus === 'string' && currentStatus.includes('\ufffd')) {
        currentStatus = '재고';
      }
      inventory.CURRENT_STATUS = currentStatus;

      // Fetch history records
      const historiesResult = await executeQuery(
        `
          SELECT
            h.ID,
            h.INVENTORY_ID,
            h.CHANGE_TYPE,
            h.PREVIOUS_LOCATION,
            h.NEW_LOCATION,
            h.PREVIOUS_STATUS,
            h.NEW_STATUS,
            h.CHECKOUT_LOCATION,
            h.EXPECTED_CHECKIN_DATE,
            h.REASON,
            h.CHANGED_BY_ID,
            h.CHANGED_AT,
            e."name" as changed_by_name
          FROM INVENTORY_HISTORY h
          LEFT JOIN EMPLOYEE e ON e."id" = h.CHANGED_BY_ID AND e."deleted_at" IS NULL
          WHERE h.INVENTORY_ID = :id
          ORDER BY h.CHANGED_AT DESC
        `,
        { id: inventoryId }
      );

      const histories = historiesResult.rows;

      // Determine if item is overdue (checked out + expected checkin date passed)
      let isOverdue = false;
      let overdueDays = 0;
      if (inventory.CURRENT_STATUS === '출고') {
        const lastCheckoutHistory = histories.find((h: Record<string, any>) => h.CHANGE_TYPE === '출고');
        if (lastCheckoutHistory?.EXPECTED_CHECKIN_DATE) {
          const checkinDate = new Date(lastCheckoutHistory.EXPECTED_CHECKIN_DATE);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (checkinDate < today) {
            isOverdue = true;
            const diffTime = today.getTime() - checkinDate.getTime();
            overdueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          }
        }
      }

      const response: InventoryDetail = {
        id: inventory.ID,
        category: inventory.CATEGORY,
        model: inventory.MODEL,
        serial_number: inventory.SERIAL_NUMBER,
        purchase_date: new Date(inventory.PURCHASE_DATE).toISOString().split('T')[0],
        purchase_from: inventory.PURCHASE_FROM,
        current_location: inventory.CURRENT_LOCATION,
        current_status: inventory.CURRENT_STATUS,
        notes: inventory.NOTES || null,
        created_at: new Date(inventory.CREATED_AT).toISOString(),
        updated_at: new Date(inventory.UPDATED_AT).toISOString(),
        created_by: {
          id: inventory.CREATED_BY_ID,
          name: inventory.created_by_name || 'Unknown',
          department: inventory.created_by_department || undefined,
        },
        updated_by: {
          id: inventory.UPDATED_BY_ID,
          name: inventory.updated_by_name || 'Unknown',
          department: inventory.updated_by_department || undefined,
        },
        histories: histories.map((h: Record<string, any>) => ({
          id: h.ID,
          inventory_id: h.INVENTORY_ID,
          change_type: h.CHANGE_TYPE,
          previous_location: h.PREVIOUS_LOCATION || null,
          new_location: h.NEW_LOCATION || null,
          previous_status: h.PREVIOUS_STATUS || null,
          new_status: h.NEW_STATUS || null,
          checkout_location: h.CHECKOUT_LOCATION || null,
          expected_checkin_date: h.EXPECTED_CHECKIN_DATE
            ? new Date(h.EXPECTED_CHECKIN_DATE).toISOString().split('T')[0]
            : null,
          reason: h.REASON || null,
          changed_by: {
            id: h.CHANGED_BY_ID,
            name: h.changed_by_name || 'Unknown',
          },
          changed_at: new Date(h.CHANGED_AT).toISOString(),
        })),
        isOverdue,
        overdueDays: isOverdue ? overdueDays : undefined,
      };

      return NextResponse.json(response, {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error('GET /api/inventory/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const inventoryId = parseInt(params.id, 10);
    if (isNaN(inventoryId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body: any = await request.json();

    try {
      // Check current status
      const inventory = await executeQuerySingle(
        `
          SELECT CURRENT_STATUS FROM INVENTORY WHERE ID = :id AND DELETED_AT IS NULL
        `,
        { id: inventoryId }
      );

      if (!inventory) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      }

      // Cannot update disposed inventory
      if (inventory.CURRENT_STATUS === '폐기') {
        return NextResponse.json({ error: 'Cannot update disposed inventory' }, { status: 400 });
      }

      // Build partial update
      const updateFields: string[] = [];
      const params: any = { id: inventoryId, updatedById: user.id };

      if (body.category) {
        updateFields.push('CATEGORY = :category');
        params.category = body.category;
      }
      if (body.model) {
        updateFields.push('MODEL = :model');
        params.model = body.model;
      }
      if (body.purchase_from) {
        updateFields.push('PURCHASE_FROM = :purchaseFrom');
        params.purchaseFrom = body.purchase_from;
      }
      if (body.current_location) {
        updateFields.push('CURRENT_LOCATION = :currentLocation');
        params.currentLocation = body.current_location;
      }
      if (body.notes !== undefined) {
        updateFields.push('NOTES = :notes');
        params.notes = body.notes || null;
      }

      if (updateFields.length === 0) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      }

      updateFields.push('UPDATED_BY_ID = :updatedById');
      updateFields.push('UPDATED_AT = CURRENT_TIMESTAMP');

      const updateQuery = `UPDATE INVENTORY SET ${updateFields.join(', ')} WHERE ID = :id`;
      await executeUpdate(updateQuery, params);

      // Fetch updated inventory
      const updated = await executeQuerySingle(
        `
          SELECT ID, CATEGORY, MODEL, SERIAL_NUMBER, PURCHASE_DATE, PURCHASE_FROM,
                 CURRENT_LOCATION, CURRENT_STATUS, CREATED_AT, UPDATED_AT
          FROM INVENTORY WHERE ID = :id
        `,
        { id: inventoryId }
      );

      return NextResponse.json(
        {
          id: updated?.ID,
          category: updated?.CATEGORY,
          model: updated?.MODEL,
          serial_number: updated?.SERIAL_NUMBER,
          purchase_date: updated?.PURCHASE_DATE ? new Date(updated.PURCHASE_DATE).toISOString().split('T')[0] : null,
          purchase_from: updated?.PURCHASE_FROM,
          current_location: updated?.CURRENT_LOCATION,
          current_status: updated?.CURRENT_STATUS,
          created_at: updated?.CREATED_AT ? new Date(updated.CREATED_AT).toISOString() : null,
          updated_at: updated?.UPDATED_AT ? new Date(updated.UPDATED_AT).toISOString() : null,
        },
        { status: 200 }
      );
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error('PUT /api/inventory/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const inventoryId = parseInt(params.id, 10);
    if (isNaN(inventoryId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
      // Soft delete: set deleted_at timestamp
      await executeUpdate(
        `
          UPDATE INVENTORY
          SET DELETED_AT = CURRENT_TIMESTAMP, UPDATED_BY_ID = :updatedById, UPDATED_AT = CURRENT_TIMESTAMP
          WHERE ID = :id AND DELETED_AT IS NULL
        `,
        {
          id: inventoryId,
          updatedById: user.id,
        }
      );

      // Verify deletion by checking if DELETED_AT was set
      const deleted = await executeQuerySingle(
        `SELECT DELETED_AT FROM INVENTORY WHERE ID = :id`,
        { id: inventoryId }
      );

      if (!deleted || !deleted.DELETED_AT) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      }

      return NextResponse.json({}, { status: 204 });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error('DELETE /api/inventory/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
