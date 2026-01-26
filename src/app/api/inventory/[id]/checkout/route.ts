// Generated: 2026-01-26 13:22:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';
import { CheckoutInventoryRequest } from '@/types/inventory';

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

    const body: CheckoutInventoryRequest = await request.json();
    if (!body.checkout_location) {
      return NextResponse.json({ error: 'checkout_location is required' }, { status: 400 });
    }

    const ds = await getDataSource();
    const queryRunner = ds.createQueryRunner();

    try {
      await queryRunner.startTransaction();

      // 1. 현재 상태 확인
      const checkQuery = `
        SELECT CURRENT_STATUS FROM INVENTORY
        WHERE ID = :id AND DELETED_AT IS NULL
      `;
      const [inventory] = await queryRunner.query(checkQuery, { id: inventoryId });

      if (!inventory) {
        await queryRunner.rollbackTransaction();
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      }

      // 2. 상태 전이 검증 (재고 -> 출고만 가능)
      if (inventory.CURRENT_STATUS !== '재고') {
        await queryRunner.rollbackTransaction();
        return NextResponse.json(
          { error: `Cannot checkout from status: ${inventory.CURRENT_STATUS}` },
          { status: 400 }
        );
      }

      // 3. 상태 업데이트
      const updateQuery = `
        UPDATE INVENTORY
        SET CURRENT_STATUS = '출고', UPDATED_BY_ID = :updatedById, UPDATED_AT = CURRENT_TIMESTAMP
        WHERE ID = :id
      `;
      await queryRunner.query(updateQuery, {
        id: inventoryId,
        updatedById: user.id,
      });

      // 4. 이력 기록
      const historyQuery = `
        INSERT INTO INVENTORY_HISTORY (
          INVENTORY_ID, CHANGE_TYPE, PREVIOUS_STATUS, NEW_STATUS,
          CHECKOUT_LOCATION, EXPECTED_CHECKIN_DATE, REASON,
          CHANGED_BY_ID, CHANGED_AT
        )
        VALUES (
          :inventoryId, '출고', '재고', '출고',
          :checkoutLocation, ${body.expected_checkin_date ? "TO_DATE(:expectedCheckinDate, 'YYYY-MM-DD')" : 'NULL'}, :reason,
          :changedById, CURRENT_TIMESTAMP
        )
      `;

      const historyParams: any = {
        inventoryId,
        checkoutLocation: body.checkout_location,
        reason: body.reason || null,
        changedById: user.id,
      };

      if (body.expected_checkin_date) {
        historyParams.expectedCheckinDate = body.expected_checkin_date;
      }

      await queryRunner.query(historyQuery, historyParams);

      await queryRunner.commitTransaction();

      // 5. 업데이트된 재고 조회
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
    console.error('POST /api/inventory/[id]/checkout error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
