// Generated: 2026-01-26 13:15:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';
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

    const ds = await getDataSource();
    const queryRunner = ds.createQueryRunner();

    try {
      // 재고 상세 조회
      const query = `
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
      `;

      const [inventory] = await queryRunner.query(query, { id: inventoryId });

      if (!inventory) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      }

      // Debug: Log the raw CURRENT_STATUS value and its encoding
      if (inventory.CURRENT_STATUS) {
        const statusValue = inventory.CURRENT_STATUS;
        const statusBytes = Buffer.from(statusValue, 'utf16le').toString('utf8');

        // If the value appears to be mojibake, try to fix it
        if (statusValue.includes('\ufffd')) {
          // This is a replacement character - the data is corrupted in the database
          // Try to infer the correct value based on context
          // For now, default to '재고' if corrupted
          inventory.CURRENT_STATUS = '재고';
        }
      }

      // 이력 조회
      const historyQuery = `
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
      `;

      const histories = await queryRunner.query(historyQuery, { id: inventoryId });

      // 과기 판정 (출고 상태이고 예정된 반납일이 오늘보다 이전)
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
        purchase_date: inventory.PURCHASE_DATE.toISOString().split('T')[0],
        purchase_from: inventory.PURCHASE_FROM,
        current_location: inventory.CURRENT_LOCATION,
        current_status: inventory.CURRENT_STATUS,
        notes: inventory.NOTES || null,
        created_at: inventory.CREATED_AT.toISOString(),
        updated_at: inventory.UPDATED_AT.toISOString(),
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
            ? h.EXPECTED_CHECKIN_DATE.toISOString().split('T')[0]
            : null,
          reason: h.REASON || null,
          changed_by: {
            id: h.CHANGED_BY_ID,
            name: h.changed_by_name || 'Unknown',
          },
          changed_at: h.CHANGED_AT.toISOString(),
        })),
        isOverdue,
        overdueDays: isOverdue ? overdueDays : undefined,
      };

      return NextResponse.json(response, {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    } finally {
      await queryRunner.release();
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

    const ds = await getDataSource();
    const queryRunner = ds.createQueryRunner();

    try {
      // 현재 상태 확인
      const checkQuery = `
        SELECT CURRENT_STATUS FROM INVENTORY WHERE ID = :id AND DELETED_AT IS NULL
      `;
      const [inventory] = await queryRunner.query(checkQuery, { id: inventoryId });

      if (!inventory) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      }

      // 폐기 상태는 수정 불가
      if (inventory.CURRENT_STATUS === '폐기') {
        return NextResponse.json({ error: 'Cannot update disposed inventory' }, { status: 400 });
      }

      // 부분 업데이트 (제공된 필드만)
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
      await queryRunner.query(updateQuery, params);

      // 업데이트된 데이터 조회
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
    } finally {
      await queryRunner.release();
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

    const ds = await getDataSource();
    const queryRunner = ds.createQueryRunner();

    try {
      // 소프트 삭제: deleted_at 설정
      const deleteQuery = `
        UPDATE INVENTORY
        SET DELETED_AT = CURRENT_TIMESTAMP, UPDATED_BY_ID = :updatedById, UPDATED_AT = CURRENT_TIMESTAMP
        WHERE ID = :id AND DELETED_AT IS NULL
      `;
      const result = await queryRunner.query(deleteQuery, {
        id: inventoryId,
        updatedById: user.id,
      });

      // DELETE는 업데이트된 행 수를 반환하지 않으므로, 존재 여부 확인
      const checkQuery = `SELECT DELETED_AT FROM INVENTORY WHERE ID = :id`;
      const [deleted] = await queryRunner.query(checkQuery, { id: inventoryId });

      if (!deleted || !deleted.DELETED_AT) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      }

      return NextResponse.json({}, { status: 204 });
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('DELETE /api/inventory/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
