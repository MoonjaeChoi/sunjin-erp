// Generated: 2026-01-27 18:00:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { getDataSource } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/maintenance/stats
 *
 * 계약 통계 조회
 * - 권한: USER+ (모든 인증 사용자)
 * - 응답: { byStatus, expiringIn30Days, expiringIn60Days, total }
 */
export async function GET(request: NextRequest) {
  let queryRunner;

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

    // 3. 데이터베이스 연결 확인
    const dataSource = await getDataSource();
    if (!dataSource.isInitialized) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    queryRunner = dataSource.createQueryRunner();

    // 4. 상태별 계약 수 조회
    const statusStats = await queryRunner.query(`
      SELECT
        contract_status,
        COUNT(*) as count
      FROM maintenance_contracts
      WHERE deleted_at IS NULL
      GROUP BY contract_status
    `);

    const byStatus: Record<string, number> = {};
    let total = 0;

    for (const row of statusStats) {
      const status = row.CONTRACT_STATUS;
      const count = parseInt(row.COUNT || '0');
      byStatus[status] = count;
      total += count;
    }

    // 5. 만료 예정 계약 조회 (30일, 60일)
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysLater = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

    const expiringContracts = await queryRunner.query(`
      SELECT
        id,
        end_date
      FROM maintenance_contracts
      WHERE deleted_at IS NULL
      AND contract_status = '활성'
      AND end_date <= TO_DATE(:sixtyDaysLater, 'YYYY-MM-DD')
      AND end_date >= TO_DATE(:today, 'YYYY-MM-DD')
    `, {
      today: today.toISOString().split('T')[0],
      sixtyDaysLater: sixtyDaysLater.toISOString().split('T')[0],
    });

    let expiringIn30Days = 0;
    let expiringIn60Days = 0;

    for (const contract of expiringContracts) {
      const endDate = new Date(contract.END_DATE);

      if (endDate <= thirtyDaysLater && endDate >= today) {
        expiringIn30Days++;
        expiringIn60Days++;
      } else if (endDate <= sixtyDaysLater && endDate > thirtyDaysLater) {
        expiringIn60Days++;
      }
    }

    // 6. 응답 구성
    const response = {
      byStatus,
      expiringIn30Days,
      expiringIn60Days,
      total,
    };

    // 7. 성공 응답
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
  } finally {
    if (queryRunner) {
      await queryRunner.release();
    }
  }
}
