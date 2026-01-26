// Generated: 2026-01-26 13:27:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';
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

    const ds = await getDataSource();
    const queryRunner = ds.createQueryRunner();

    try {
      await queryRunner.startTransaction();

      const checkQuery = `
        SELECT CURRENT_STATUS, CURRENT_LOCATION FROM INVENTORY
        WHERE ID = :id AND DELETED_AT IS NULL
      `;
      const [inventory] = await queryRunner.query(checkQuery, { id: inventoryId });

      if (!inventory) {
        await queryRunner.rollbackTransaction();
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      }

      // 폐기 상태에서는 위치 변경 불가
      if (inventory.CURRENT_STATUS === '폐기') {
        await queryRunner.rollbackTransaction();
        return NextResponse.json({ error: 'Cannot relocate disposed inventory' }, { status: 400 });
      }

      // 위치 업데이트 (상태는 유지)
      const updateQuery = `
        UPDATE INVENTORY
        SET CURRENT_LOCATION = :currentLocation, UPDATED_BY_ID = :updatedById, UPDATED_AT = CURRENT_TIMESTAMP
        WHERE ID = :id
      `;
      await queryRunner.query(updateQuery, {
        id: inventoryId,
        currentLocation: body.current_location,
        updatedById: user.id,
      });

      // 이력 기록 (상태 변경 없음, 위치만 변경)
      const historyQuery = `
        INSERT INTO INVENTORY_HISTORY (
          INVENTORY_ID, CHANGE_TYPE, PREVIOUS_LOCATION, NEW_LOCATION,
          REASON, CHANGED_BY_ID, CHANGED_AT
        )
        VALUES (
          :inventoryId, '위치변경', :previousLocation, :newLocation,
          :reason, :changedById, CURRENT_TIMESTAMP
        )
      `;
      await queryRunner.query(historyQuery, {
        inventoryId,
        previousLocation: inventory.CURRENT_LOCATION,
        newLocation: body.current_location,
        reason: body.reason || null,
        changedById: user.id,
      });

      await queryRunner.commitTransaction();

      const detailQuery = `
        SELECT ID, CATEGORY, MODEL, SERIAL_NUMBER, PURCHASE_DATE, PURCHASE_FROM,
               CURRENT_LOCATION, CURRENT_STATUS, CREATED_AT, UPDATED_AT
        FROM INVENTORY WHERE ID = :id
      `;
      const [updated] = await queryRunner.query(detailQuery, { id: inventoryId });

      return NextResponse.json(
        {
          id: updated.ID,
          category: updated.CATEGORY,
          model: updated.MODEL,
          serial_number: updated.SERIAL_NUMBER,
          purchase_date: updated.PURCHASE_DATE.toISOString().split('T')[0],
          purchase_from: updated.PURCHASE_FROM,
          current_location: updated.CURRENT_LOCATION,
          current_status: updated.CURRENT_STATUS,
          created_at: updated.CREATED_AT.toISOString(),
          updated_at: updated.UPDATED_AT.toISOString(),
        },
        { status: 200 }
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('POST /api/inventory/[id]/relocate error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
