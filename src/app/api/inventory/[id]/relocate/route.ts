// Generated: 2026-01-27 14:05:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuerySingle, executeTransaction } from '@/lib/db-direct';
import { RelocateInventoryRequest } from '@/types/inventory';

export const dynamic = 'force-dynamic';

export async function POST(
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

    const body: RelocateInventoryRequest = await request.json();
    if (!body.current_location) {
      return NextResponse.json({ error: 'current_location is required' }, { status: 400 });
    }

    try {
      // Check current status and location first
      const inventory = await executeQuerySingle(
        `
          SELECT CURRENT_STATUS, CURRENT_LOCATION FROM INVENTORY
          WHERE ID = :id AND DELETED_AT IS NULL
        `,
        { id: inventoryId }
      );

      if (!inventory) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      }

      // Cannot relocate disposed inventory
      if (inventory.CURRENT_STATUS === '폐기') {
        return NextResponse.json({ error: 'Cannot relocate disposed inventory' }, { status: 400 });
      }

      // Use transaction for relocation operation
      await executeTransaction([
        {
          query: `
            UPDATE INVENTORY
            SET CURRENT_LOCATION = :currentLocation, UPDATED_BY_ID = :updatedById, UPDATED_AT = CURRENT_TIMESTAMP
            WHERE ID = :id
          `,
          params: {
            id: inventoryId,
            currentLocation: body.current_location,
            updatedById: user.id,
          },
        },
        {
          query: `
            INSERT INTO INVENTORY_HISTORY (
              INVENTORY_ID, CHANGE_TYPE, PREVIOUS_LOCATION, NEW_LOCATION,
              REASON, CHANGED_BY_ID, CHANGED_AT
            )
            VALUES (
              :inventoryId, '위치변경', :previousLocation, :newLocation,
              :reason, :changedById, CURRENT_TIMESTAMP
            )
          `,
          params: {
            inventoryId,
            previousLocation: inventory.CURRENT_LOCATION,
            newLocation: body.current_location,
            reason: body.reason || null,
            changedById: user.id,
          },
        },
      ]);

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
    console.error('POST /api/inventory/[id]/relocate error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
