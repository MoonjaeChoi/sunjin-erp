// Generated: 2026-01-26 13:32:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';
import { InventoryStats } from '@/types/inventory';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ds = await getDataSource();
    const queryRunner = ds.createQueryRunner();

    try {
      // 전체 통계
      const totalQuery = `
        SELECT COUNT(*) as TOTAL FROM INVENTORY WHERE DELETED_AT IS NULL
      `;

      const statusQuery = `
        SELECT CURRENT_STATUS, COUNT(*) as CNT FROM INVENTORY
        WHERE DELETED_AT IS NULL
        GROUP BY CURRENT_STATUS
      `;

      const categoryQuery = `
        SELECT CATEGORY, COUNT(*) as CNT FROM INVENTORY
        WHERE DELETED_AT IS NULL
        GROUP BY CATEGORY
      `;

      // 과기 판정: 출고 상태 + 예정된 반납일이 오늘 이전
      const overdueQuery = `
        SELECT COUNT(DISTINCT i.ID) as OVERDUE_COUNT
        FROM INVENTORY i
        WHERE i.CURRENT_STATUS = '출고'
          AND i.DELETED_AT IS NULL
          AND EXISTS (
            SELECT 1 FROM INVENTORY_HISTORY h
            WHERE h.INVENTORY_ID = i.ID
              AND h.CHANGE_TYPE = '출고'
              AND h.EXPECTED_CHECKIN_DATE IS NOT NULL
              AND h.EXPECTED_CHECKIN_DATE < TRUNC(SYSDATE)
          )
      `;

      const [totalResult, statusResult, categoryResult, overdueResult] = await Promise.all([
        queryRunner.query(totalQuery),
        queryRunner.query(statusQuery),
        queryRunner.query(categoryQuery),
        queryRunner.query(overdueQuery),
      ]);

      const totalCount = parseInt(totalResult[0]?.TOTAL || '0', 10);
      const overdueCount = parseInt(overdueResult[0]?.OVERDUE_COUNT || '0', 10);

      // 상태별 집계
      const byStatus = {
        '재고': 0,
        '출고': 0,
        '고장': 0,
        '폐기': 0,
      };
      statusResult.forEach((row: any) => {
        byStatus[row.CURRENT_STATUS as keyof typeof byStatus] = parseInt(row.CNT, 10);
      });

      // 카테고리별 집계
      const byCategory: Record<string, number> = {};
      categoryResult.forEach((row: any) => {
        byCategory[row.CATEGORY] = parseInt(row.CNT, 10);
      });

      const response: InventoryStats = {
        totalCount,
        byStatus,
        byCategory,
        overdue: {
          count: overdueCount,
          percentage: totalCount > 0 ? Math.round((overdueCount / totalCount) * 100) : 0,
        },
      };

      return NextResponse.json(response, { status: 200 });
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('GET /api/inventory/stats error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
