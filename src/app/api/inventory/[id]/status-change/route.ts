// Generated: 2026-01-26 13:30:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';
import { StatusChangeInventoryRequest, InventoryStatus } from '@/types/inventory';

export const dynamic = 'force-dynamic';

// 상태 전이 규칙 검증
function validateStateTransition(
  currentStatus: InventoryStatus,
  newStatus: InventoryStatus
): boolean {
  const transitions: Record<InventoryStatus, InventoryStatus[]> = {
    '재고': ['출고', '고장', '폐기'],
    '출고': ['재고', '고장'],
    '고장': ['폐기'],
    '폐기': [], // 터미널 상태
  };

  return transitions[currentStatus].includes(newStatus);
}

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
    // 상태 변경은 ADMIN만 가능
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const inventoryId = parseInt(params.id, 10);
    if (isNaN(inventoryId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body: StatusChangeInventoryRequest = await request.json();
    if (!body.current_status) {
      return NextResponse.json({ error: 'current_status is required' }, { status: 400 });
    }

    const ds = await getDataSource();
    const queryRunner = ds.createQueryRunner();

    try {
      await queryRunner.startTransaction();

      const checkQuery = `
        SELECT CURRENT_STATUS FROM INVENTORY
        WHERE ID = :id AND DELETED_AT IS NULL
      `;
      const [inventory] = await queryRunner.query(checkQuery, { id: inventoryId });

      if (!inventory) {
        await queryRunner.rollbackTransaction();
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      }

      const currentStatus = inventory.CURRENT_STATUS as InventoryStatus;

      // 상태 전이 검증
      if (!validateStateTransition(currentStatus, body.current_status)) {
        await queryRunner.rollbackTransaction();
        return NextResponse.json(
          { error: `Cannot transition from ${currentStatus} to ${body.current_status}` },
          { status: 400 }
        );
      }

      // 상태 업데이트
      const updateQuery = `
        UPDATE INVENTORY
        SET CURRENT_STATUS = :newStatus, UPDATED_BY_ID = :updatedById, UPDATED_AT = CURRENT_TIMESTAMP
        WHERE ID = :id
      `;
      await queryRunner.query(updateQuery, {
        id: inventoryId,
        newStatus: body.current_status,
        updatedById: user.id,
      });

      // 이력 기록
      const historyQuery = `
        INSERT INTO INVENTORY_HISTORY (
          INVENTORY_ID, CHANGE_TYPE, PREVIOUS_STATUS, NEW_STATUS,
          REASON, CHANGED_BY_ID, CHANGED_AT
        )
        VALUES (
          :inventoryId, '상태변경', :previousStatus, :newStatus,
          :reason, :changedById, CURRENT_TIMESTAMP
        )
      `;
      await queryRunner.query(historyQuery, {
        inventoryId,
        previousStatus: currentStatus,
        newStatus: body.current_status,
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
    console.error('POST /api/inventory/[id]/status-change error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
