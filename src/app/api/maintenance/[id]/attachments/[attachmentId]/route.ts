// Generated: 2026-01-27 23:45:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../../lib/auth';
import { executeQuerySingle, executeUpdate } from '../../../../../../lib/db-direct';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/maintenance/[id]/attachments/[attachmentId]
 *
 * 파일 첨부 삭제 (Soft Delete)
 * - 권한: ADMIN만
 * - deleted_at 설정 (물리적 삭제 아님)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
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
    const attachmentId = parseInt(params.attachmentId);

    if (isNaN(contractId)) {
      return NextResponse.json(
        { error: 'Validation Error', details: 'Invalid contract ID' },
        { status: 400 }
      );
    }

    if (isNaN(attachmentId)) {
      return NextResponse.json(
        { error: 'Validation Error', details: 'Invalid attachment ID' },
        { status: 400 }
      );
    }

    // 4. 계약 존재 여부 확인
    const contract = await executeQuerySingle(
      `SELECT MC.ID FROM MAINTENANCE_CONTRACTS MC
       WHERE MC.ID = :id AND MC.DELETED_AT IS NULL`,
      { id: contractId }
    );

    if (!contract) {
      return NextResponse.json(
        { error: 'Not Found', details: `Contract with id ${contractId} not found` },
        { status: 404 }
      );
    }

    // 5. 첨부파일 존재 여부 확인
    const attachment = await executeQuerySingle(
      `SELECT ID FROM MAINTENANCE_CONTRACT_ATTACHMENTS
       WHERE ID = :id AND MAINTENANCE_CONTRACT_ID = :contract_id AND DELETED_AT IS NULL`,
      { id: attachmentId, contract_id: contractId }
    );

    if (!attachment) {
      return NextResponse.json(
        {
          error: 'Not Found',
          details: `Attachment with id ${attachmentId} not found`,
        },
        { status: 404 }
      );
    }

    // 6. Soft Delete 수행
    const now = new Date();
    await executeUpdate(
      `UPDATE MAINTENANCE_CONTRACT_ATTACHMENTS SET DELETED_AT = :deleted_at WHERE ID = :id`,
      { id: attachmentId, deleted_at: now }
    );

    // 7. 성공 응답
    return NextResponse.json(
      { message: 'Attachment deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      `DELETE /api/maintenance/[id]/attachments/[attachmentId] error:`,
      error
    );
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
