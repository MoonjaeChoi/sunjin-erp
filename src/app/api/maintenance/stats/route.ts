// Generated: 2026-01-27 23:45:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { executeQuery } from '../../../../lib/db-direct';

export const dynamic = 'force-dynamic';

/**
 * GET /api/maintenance/stats
 *
 * 계약 통계 조회
 * - 권한: USER+ (모든 인증 사용자)
 * - 응답: { byStatus, expiringIn30Days, expiringIn60Days, total }
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 세션 검증
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 권한 검증 (USER, MANAGER, ADMIN)
    const allowedRoles = ['USER', 'MANAGER', 'ADMIN'];
    const userRole = (session.user as any)?.role;
    if (!allowedRoles.includes(userRole as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. 상태별 계약 수 조회
    const statusStatsResult = await executeQuery(`
      SELECT
        CONTRACT_STATUS,
        COUNT(*) as COUNT
      FROM MAINTENANCE_CONTRACTS
      WHERE DELETED_AT IS NULL
      GROUP BY CONTRACT_STATUS
    `);

    const byStatus: Record<string, number> = {};
    let total = 0;

    for (const row of statusStatsResult.rows) {
      const status = (row as any)?.CONTRACT_STATUS;
      const count = parseInt((row as any)?.COUNT || '0');
      byStatus[status] = count;
      total += count;
    }

    // 4. 만료 예정 계약 조회 (30일, 60일)
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysLater = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

    const expiringContractsResult = await executeQuery(`
      SELECT
        ID,
        END_DATE
      FROM MAINTENANCE_CONTRACTS
      WHERE DELETED_AT IS NULL
      AND CONTRACT_STATUS = '활성'
      AND END_DATE <= TO_DATE(:sixtyDaysLater, 'YYYY-MM-DD')
      AND END_DATE >= TO_DATE(:today, 'YYYY-MM-DD')
    `, {
      today: today.toISOString().split('T')[0],
      sixtyDaysLater: sixtyDaysLater.toISOString().split('T')[0],
    });

    let expiringIn30Days = 0;
    let expiringIn60Days = 0;

    for (const contract of expiringContractsResult.rows) {
      const endDate = new Date((contract as any)?.END_DATE);

      if (endDate <= thirtyDaysLater && endDate >= today) {
        expiringIn30Days++;
        expiringIn60Days++;
      } else if (endDate <= sixtyDaysLater && endDate > thirtyDaysLater) {
        expiringIn60Days++;
      }
    }

    // 5. 응답 구성
    const response = {
      byStatus,
      expiringIn30Days,
      expiringIn60Days,
      total,
    };

    // 6. 성공 응답
    return NextResponse.json({ data: response }, { status: 200 });
  } catch (error) {
    console.error('GET /api/maintenance/stats error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
