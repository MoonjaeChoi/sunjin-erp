// Generated: 2026-01-27 14:01:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeQuerySingle } from '@/lib/db-direct';
import { InventoryStats } from '@/types/inventory';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      // Fetch total count
      const totalResult = await executeQuerySingle(`
        SELECT COUNT(*) as TOTAL FROM INVENTORY WHERE DELETED_AT IS NULL
      `);

      // Fetch status breakdown
      const statusQuery = `
        SELECT CURRENT_STATUS, COUNT(*) as CNT FROM INVENTORY
        WHERE DELETED_AT IS NULL
        GROUP BY CURRENT_STATUS
      `;

      // Fetch category breakdown
      const categoryQuery = `
        SELECT CATEGORY, COUNT(*) as CNT FROM INVENTORY
        WHERE DELETED_AT IS NULL
        GROUP BY CATEGORY
      `;

      // Count overdue items: checked out status + expected checkin date before today
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

      const [statusResultData, categoryResultData, overdueResultData] = await Promise.all([
        executeQuery(statusQuery),
        executeQuery(categoryQuery),
        executeQuerySingle(overdueQuery),
      ]);

      const totalCount = parseInt(totalResult?.TOTAL || '0', 10);
      const overdueCount = parseInt(overdueResultData?.OVERDUE_COUNT || '0', 10);

      // Initialize status aggregation
      const byStatus = {
        '재고': 0,
        '출고': 0,
        '고장': 0,
        '폐기': 0,
      };

      // Parse status results (multiple rows)
      statusResultData.rows.forEach((row: any) => {
        byStatus[row.CURRENT_STATUS as keyof typeof byStatus] = parseInt(row.CNT, 10);
      });

      // Parse category results (multiple rows)
      const byCategory: Record<string, number> = {};
      categoryResultData.rows.forEach((row: any) => {
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
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error('GET /api/inventory/stats error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
