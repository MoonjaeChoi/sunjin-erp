// Generated: 2026-01-26 23:55:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/maintenance/[id]/history
 *
 * 계약 변경 이력 조회 (페이지네이션)
 * - 권한: USER+ (모든 인증 사용자)
 * - 정렬: changed_at DESC (최신순)
 * - 페이지네이션: 20개/페이지
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // 3. ID 파싱 및 검증
    const contractId = parseInt(params.id);
    if (isNaN(contractId)) {
      return NextResponse.json(
        { error: 'Validation Error', details: 'Invalid contract ID' },
        { status: 400 }
      );
    }

    // 4. 데이터베이스 연결 확인
    const dataSource = await getDataSource();
    if (!dataSource.isInitialized) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // 5. 계약 존재 여부 확인
    const { MaintenanceContractRepository } = await import(
      '@/lib/maintenance-repository'
    );
    const repository = new MaintenanceContractRepository(dataSource);
    const contract = await repository.findById(contractId);

    if (!contract) {
      return NextResponse.json(
        { error: 'Not Found', details: `Contract with id ${contractId} not found` },
        { status: 404 }
      );
    }

    // 6. 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    // 7. 이력 조회
    const { MaintenanceContractService } = await import(
      '@/lib/maintenance-service'
    );
    const service = new MaintenanceContractService(dataSource);
    const histories = await service.getHistories(contractId, { page, limit });

    // 8. 성공 응답
    return NextResponse.json(
      {
        data: histories,
        pagination: {
          page,
          limit,
          total: 0, // Repository에서 total 정보가 없으므로, histories.length로 표시
          totalPages: Math.ceil(histories.length / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`GET /api/maintenance/[id]/history error:`, error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
