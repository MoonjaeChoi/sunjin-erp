// Generated: 2026-01-27 00:05:00 KST

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
 * - 응답: { byStatus, expiringIn30Days, expiringIn60Days }
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

    // 3. 데이터베이스 연결 확인
    const dataSource = await getDataSource();
    if (!dataSource.isInitialized) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // 4. 서비스를 통해 통계 조회
    const { MaintenanceContractService } = await import(
      '../../../../lib/maintenance-service'
    );
    const service = new MaintenanceContractService(dataSource);
    const stats = await service.getStats();

    // 5. 만료 임박 계약 수 계산 (30일, 60일)
    const { MaintenanceContractRepository } = await import(
      '../../../../lib/maintenance-repository'
    );
    const repository = new MaintenanceContractRepository(dataSource);
    const expiringContracts = await repository.findExpiringContracts(60);

    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysLater = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

    let expiringIn30Days = 0;
    let expiringIn60Days = 0;

    expiringContracts.forEach((contract: any) => {
      const endDate = new Date(contract.end_date);
      if (endDate <= thirtyDaysLater && endDate >= today) {
        expiringIn30Days++;
        expiringIn60Days++;
      } else if (endDate <= sixtyDaysLater && endDate > thirtyDaysLater) {
        expiringIn60Days++;
      }
    });

    // 6. 응답 구성
    const response = {
      byStatus: stats.byStatus,
      expiringIn30Days,
      expiringIn60Days,
      total: stats.total,
    };

    // 7. 성공 응답
    return NextResponse.json({ data: response }, { status: 200 });
  } catch (error) {
    console.error(`GET /api/maintenance/stats error:`, error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
