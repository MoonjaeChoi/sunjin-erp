// Generated: 2026-01-27 23:45:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { executeQuerySingle, executeQuery, executeTransaction, executeUpdate } from '../../../../lib/db-direct';

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

    // 4. 계약 조회
    const contractResult = await executeQuerySingle(
      `SELECT "mc"."id", "mc"."customer_id", "mc"."contract_name", "mc"."contract_type", "mc"."start_date", "mc"."end_date", "mc"."assigned_employee_id", "mc"."contract_amount", "mc"."contract_status", "mc"."notes", "mc"."created_at", "mc"."updated_at", "mc"."created_by_id", "mc"."updated_by_id" FROM "MAINTENANCE_CONTRACTS" "mc"
       WHERE "mc"."id" = :id AND "mc"."deleted_at" IS NULL`,
      { id: contractId }
    );

    // 5. 계약 존재 여부 확인
    if (!contractResult) {
      return NextResponse.json(
        { error: 'Not Found', details: `Contract with id ${contractId} not found` },
        { status: 404 }
      );
    }

    const contract = contractResult as any;

    // 6. 고객 정보 조회
    const customerResult = await executeQuerySingle(
      'SELECT "id", "name" FROM "CUSTOMER" WHERE "id" = :id AND "deleted_at" IS NULL',
      { id: contract.customer_id }
    );

    // 7. 담당자 정보 조회
    const employeeResult = await executeQuerySingle(
      'SELECT "id", "name" FROM "EMPLOYEE" WHERE "id" = :id AND "deleted_at" IS NULL',
      { id: contract.assigned_employee_id }
    );

    // 8. 첨부파일 조회
    const attachmentsResult = await executeQuery(
      `SELECT "id", "file_name", "file_path", "file_size", "created_at", "uploaded_by_id"
       FROM "MAINTENANCE_CONTRACT_ATTACHMENTS"
       WHERE "maintenance_contract_id" = :contract_id AND "deleted_at" IS NULL
       ORDER BY "created_at" DESC`,
      { contract_id: contractId }
    );

    // 9. 이력 조회
    const historiesResult = await executeQuery(
      `SELECT "id", "change_type", "reason", "changed_by_id", "changed_at"
       FROM "MAINTENANCE_CONTRACT_HISTORIES"
       WHERE "maintenance_contract_id" = :contract_id AND "deleted_at" IS NULL
       ORDER BY "changed_at" DESC`,
      { contract_id: contractId }
    );

    // 10. 응답 구성
    const response = {
      id: contract.id,
      customer_id: contract.customer_id,
      customer: customerResult ? { id: (customerResult as any).id, name: (customerResult as any).name } : null,
      contract_name: contract.contract_name,
      contract_type: contract.contract_type,
      start_date: contract.start_date,
      end_date: contract.end_date,
      assigned_employee_id: contract.assigned_employee_id,
      assigned_employee: employeeResult ? { id: (employeeResult as any).id, name: (employeeResult as any).name } : null,
      contract_amount: contract.contract_amount,
      contract_status: contract.contract_status,
      notes: contract.notes,
      created_at: contract.created_at,
      updated_at: contract.updated_at,
      created_by_id: contract.created_by_id,
      updated_by_id: contract.updated_by_id,
      attachments: attachmentsResult.rows.map((a: any) => ({
        id: a.id,
        file_name: a.file_name,
        file_path: a.file_path,
        file_size: a.file_size,
        created_at: a.created_at,
        uploaded_by_id: a.uploaded_by_id,
      })),
      histories: historiesResult.rows.map((h: any) => ({
        id: h.id,
        change_type: h.change_type,
        reason: h.reason,
        changed_by_id: h.changed_by_id,
        changed_at: h.changed_at,
      })),
    };

    // 11. 성공 응답
    return NextResponse.json({ data: response }, { status: 200 });
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

    // 4. 요청 본문 파싱
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

    // 5. customer_id 변경 불가 체크
    if (customer_id !== undefined && customer_id !== null) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          details: 'customer_id cannot be modified',
        },
        { status: 400 }
      );
    }

    // 6. 기존 계약 조회
    const existingContract = await executeQuerySingle(
      `SELECT "mc"."id", "mc"."customer_id", "mc"."contract_name", "mc"."contract_type", "mc"."start_date", "mc"."end_date", "mc"."assigned_employee_id", "mc"."contract_amount", "mc"."contract_status", "mc"."notes", "mc"."created_at", "mc"."updated_at", "mc"."created_by_id", "mc"."updated_by_id" FROM "MAINTENANCE_CONTRACTS" "mc"
       WHERE "mc"."id" = :id AND "mc"."deleted_at" IS NULL`,
      { id: contractId }
    );

    if (!existingContract) {
      return NextResponse.json(
        { error: 'Not Found', details: `Contract with id ${contractId} not found` },
        { status: 404 }
      );
    }

    const existing = existingContract as any;

    // 7. 필드 유효성 검증
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
      if (existing.start_date > endDateObj) {
        return NextResponse.json(
          {
            error: 'Validation Error',
            details: 'start_date must be before or equal to end_date',
          },
          { status: 400 }
        );
      }
    }

    // 8. 담당자 존재 여부 확인 (변경시)
    if (assigned_employee_id !== undefined && assigned_employee_id !== null) {
      const employeeExists = await executeQuerySingle(
        'SELECT "id" FROM "EMPLOYEE" WHERE "id" = :id AND "deleted_at" IS NULL',
        { id: assigned_employee_id }
      );

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

    // 9. 트랜잭션으로 계약 수정 + 이력 기록
    const userId = (session.user as any)?.id as number;
    const now = new Date();

    // 수정할 필드만 준비
    const updateFields: string[] = [];
    const updateParams: any = { id: contractId };

    if (contract_name !== undefined) {
      updateFields.push('"contract_name" = :contract_name');
      updateParams.contract_name = contract_name;
    }

    if (end_date !== undefined) {
      updateFields.push('"end_date" = TO_DATE(:end_date, \'YYYY-MM-DD\')');
      updateParams.end_date = new Date(end_date).toISOString().split('T')[0];
    }

    if (contract_amount !== undefined) {
      updateFields.push('"contract_amount" = :contract_amount');
      updateParams.contract_amount = contract_amount;
    }

    if (assigned_employee_id !== undefined) {
      updateFields.push('"assigned_employee_id" = :assigned_employee_id');
      updateParams.assigned_employee_id = assigned_employee_id;
    }

    if (contract_status !== undefined) {
      updateFields.push('"contract_status" = :contract_status');
      updateParams.contract_status = contract_status;
    }

    if (notes !== undefined) {
      updateFields.push('"notes" = :notes');
      updateParams.notes = notes;
    }

    updateFields.push('"updated_at" = :updated_at');
    updateFields.push('"updated_by_id" = :updated_by_id');
    updateParams.updated_at = now;
    updateParams.updated_by_id = userId;

    // 트랜잭션 실행
    const historyOperations: any[] = [];

    if (updateFields.length > 0) {
      historyOperations.push({
        query: `UPDATE "MAINTENANCE_CONTRACTS" SET ${updateFields.join(', ')} WHERE "id" = :id`,
        params: updateParams,
      });

      // 이력 기록
      if (end_date !== undefined || contract_status !== undefined) {
        let reason = '정보수정';
        if (end_date !== undefined && contract_status !== undefined) {
          reason = '종료일 변경, 상태 변경';
        } else if (end_date !== undefined) {
          reason = '종료일 변경';
        } else if (contract_status !== undefined) {
          reason = '상태 변경';
        }

        historyOperations.push({
          query: `INSERT INTO "MAINTENANCE_CONTRACT_HISTORIES"
            ("id", "maintenance_contract_id", "change_type", "reason", "changed_by_id", "changed_at", "deleted_at")
            VALUES (SEQ_MAINTENANCE_CONTRACT_HISTORIES.NEXTVAL, :contract_id, '정보수정', :reason, :changed_by_id, :changed_at, NULL)`,
          params: {
            contract_id: contractId,
            reason,
            changed_by_id: userId,
            changed_at: now,
          },
        });
      }
    }

    if (historyOperations.length > 0) {
      await executeTransaction(historyOperations);
    }

    // 10. 수정된 계약 조회 및 반환
    const updatedContract = await executeQuerySingle(
      `SELECT "mc"."id", "mc"."customer_id", "mc"."contract_name", "mc"."contract_type", "mc"."start_date", "mc"."end_date", "mc"."assigned_employee_id", "mc"."contract_amount", "mc"."contract_status", "mc"."notes", "mc"."created_at", "mc"."updated_at", "mc"."created_by_id", "mc"."updated_by_id" FROM "MAINTENANCE_CONTRACTS" "mc" WHERE "mc"."id" = :id`,
      { id: contractId }
    );

    const updated = updatedContract as any;

    return NextResponse.json(
      {
        data: {
          id: updated.id,
          customer_id: updated.customer_id,
          contract_name: updated.contract_name,
          contract_type: updated.contract_type,
          start_date: updated.start_date,
          end_date: updated.end_date,
          assigned_employee_id: updated.assigned_employee_id,
          contract_amount: updated.contract_amount,
          contract_status: updated.contract_status,
          notes: updated.notes,
          created_at: updated.created_at,
          updated_at: updated.updated_at,
          created_by_id: updated.created_by_id,
          updated_by_id: updated.updated_by_id,
        },
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

    // 4. 계약 존재 여부 확인
    const existingContract = await executeQuerySingle(
      `SELECT "mc"."id", "mc"."customer_id", "mc"."contract_name", "mc"."contract_type", "mc"."start_date", "mc"."end_date", "mc"."assigned_employee_id", "mc"."contract_amount", "mc"."contract_status", "mc"."notes", "mc"."created_at", "mc"."updated_at", "mc"."created_by_id", "mc"."updated_by_id" FROM "MAINTENANCE_CONTRACTS" "mc"
       WHERE "mc"."id" = :id AND "mc"."deleted_at" IS NULL`,
      { id: contractId }
    );

    if (!existingContract) {
      return NextResponse.json(
        { error: 'Not Found', details: `Contract with id ${contractId} not found` },
        { status: 404 }
      );
    }

    // 5. 트랜잭션으로 Cascade soft delete 수행
    const now = new Date();
    await executeTransaction([
      {
        query: `UPDATE "MAINTENANCE_CONTRACTS" SET "deleted_at" = :deleted_at WHERE "id" = :id AND "deleted_at" IS NULL`,
        params: { id: contractId, deleted_at: now },
      },
      {
        query: `UPDATE "MAINTENANCE_CONTRACT_ATTACHMENTS" SET "deleted_at" = :deleted_at WHERE "maintenance_contract_id" = :contract_id AND "deleted_at" IS NULL`,
        params: { contract_id: contractId, deleted_at: now },
      },
      {
        query: `UPDATE "MAINTENANCE_CONTRACT_HISTORIES" SET "deleted_at" = :deleted_at WHERE "maintenance_contract_id" = :contract_id AND "deleted_at" IS NULL`,
        params: { contract_id: contractId, deleted_at: now },
      },
    ]);

    // 6. 성공 응답
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
