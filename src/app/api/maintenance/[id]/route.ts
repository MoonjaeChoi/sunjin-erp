// Generated: 2026-01-26 23:00:00 KST


import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { getDataSource } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/maintenance/[id]
 *
 * 유지보수 계약 상세 조회
 * - 권한: USER+ (모든 인증 사용자)
 * - 응답: 계약 + 고객사 + 담당자 + 첨부파일 + 이력
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

    // 5. 저장소 동적 import 및 계약 조회
    const { MaintenanceContractRepository } = await import(
      '../../../../lib/maintenance-repository'
    );
    const repository = new MaintenanceContractRepository(dataSource);
    const contract = await repository.findById(contractId);

    // 6. 계약 존재 여부 확인
    if (!contract) {
      return NextResponse.json(
        { error: 'Not Found', details: `Contract with id ${contractId} not found` },
        { status: 404 }
      );
    }

    // 7. 성공 응답
    return NextResponse.json({ data: contract }, { status: 200 });
  } catch (error) {
    console.error(`GET /api/maintenance/[id] error:`, error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/maintenance/[id]
 *
 * 유지보수 계약 정보 수정
 * - 권한: MANAGER+ (MANAGER, ADMIN)
 * - customer_id는 수정 불가
 * - end_date 변경시 이력 기록
 * - status 변경시 이력 기록
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 세션 검증
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 권한 검증 (MANAGER, ADMIN만)
    const allowedRoles = ['MANAGER', 'ADMIN'];
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

    // 5. 요청 본문 파싱
    const body = await request.json();
    const {
      contract_name,
      end_date,
      contract_amount,
      assigned_employee_id,
      contract_status,
      notes,
      customer_id,
    } = body;

    // 6. customer_id 변경 불가 체크
    if (customer_id !== undefined && customer_id !== null) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          details: 'customer_id cannot be modified',
        },
        { status: 400 }
      );
    }

    // 7. 저장소 동적 import 및 기존 계약 조회
    const { MaintenanceContractRepository } = await import(
      '../../../../lib/maintenance-repository'
    );
    const repository = new MaintenanceContractRepository(dataSource);
    const existingContract = await repository.findById(contractId);

    if (!existingContract) {
      return NextResponse.json(
        { error: 'Not Found', details: `Contract with id ${contractId} not found` },
        { status: 404 }
      );
    }

    // 8. 필드 유효성 검증
    if (contract_name !== undefined && contract_name !== null) {
      if (typeof contract_name !== 'string' || contract_name.length > 255) {
        return NextResponse.json(
          {
            error: 'Validation Error',
            details: 'contract_name must be a string (max 255 chars)',
          },
          { status: 400 }
        );
      }
    }

    if (contract_amount !== undefined && contract_amount !== null) {
      if (typeof contract_amount !== 'number' || contract_amount < 0) {
        return NextResponse.json(
          {
            error: 'Validation Error',
            details: 'contract_amount must be a non-negative number',
          },
          { status: 400 }
        );
      }
    }

    if (end_date !== undefined && end_date !== null) {
      const endDateObj = new Date(end_date);
      if (isNaN(endDateObj.getTime())) {
        return NextResponse.json(
          {
            error: 'Validation Error',
            details: 'Invalid date format for end_date',
          },
          { status: 400 }
        );
      }

      // 시작일이 종료일보다 크지 않아야 함
      if (existingContract.start_date > endDateObj) {
        return NextResponse.json(
          {
            error: 'Validation Error',
            details: 'start_date must be before or equal to end_date',
          },
          { status: 400 }
        );
      }
    }

    // 9. 담당자 존재 여부 확인 (변경시)
    if (assigned_employee_id !== undefined && assigned_employee_id !== null) {
      const { Employee } = await import('../../../../entities/Employee');
      const employeeRepo = dataSource.getRepository(Employee);
      const employeeExists = await employeeRepo.findOne({
        where: { id: assigned_employee_id, deleted_at: null },
      });

      if (!employeeExists) {
        return NextResponse.json(
          {
            error: 'Not Found',
            details: `Employee with id ${assigned_employee_id} not found`,
          },
          { status: 404 }
        );
      }
    }

    // 10. 서비스를 통해 계약 수정 (트랜잭션 포함)
    const { MaintenanceContractService } = await import(
      '../../../../lib/maintenance-service'
    );
    const service = new MaintenanceContractService(dataSource);
    const userId = (session.user as any)?.id as number;

    // 수정할 데이터 준비
    const updateData: any = {};
    if (contract_name !== undefined) updateData.contract_name = contract_name;
    if (end_date !== undefined) updateData.end_date = new Date(end_date);
    if (contract_amount !== undefined) updateData.contract_amount = contract_amount;
    if (assigned_employee_id !== undefined)
      updateData.assigned_employee_id = assigned_employee_id;
    if (contract_status !== undefined) updateData.contract_status = contract_status;
    if (notes !== undefined) updateData.notes = notes;

    const updatedContract = await service.updateContract(
      contractId,
      updateData,
      userId
    );

    // 11. 성공 응답
    return NextResponse.json(
      {
        data: updatedContract,
        message: '유지보수 계약이 수정되었습니다.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`PUT /api/maintenance/[id] error:`, error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/maintenance/[id]
 *
 * 유지보수 계약 소프트 삭제
 * - 권한: ADMIN만
 * - Cascade soft delete (계약 + 첨부파일 + 이력)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 세션 검증
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 권한 검증 (ADMIN만)
    const userRole = (session.user as any)?.role;
    if (userRole !== 'ADMIN') {
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

    // 5. 저장소 동적 import 및 계약 존재 여부 확인
    const { MaintenanceContractRepository } = await import(
      '../../../../lib/maintenance-repository'
    );
    const repository = new MaintenanceContractRepository(dataSource);
    const existingContract = await repository.findById(contractId);

    if (!existingContract) {
      return NextResponse.json(
        { error: 'Not Found', details: `Contract with id ${contractId} not found` },
        { status: 404 }
      );
    }

    // 6. 서비스를 통해 계약 삭제 (트랜잭션 + Cascade soft delete)
    const { MaintenanceContractService } = await import(
      '../../../../lib/maintenance-service'
    );
    const service = new MaintenanceContractService(dataSource);
    await service.deleteContract(contractId);

    // 7. 성공 응답
    return NextResponse.json(
      {
        message: '유지보수 계약이 삭제되었습니다.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`DELETE /api/maintenance/[id] error:`, error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
