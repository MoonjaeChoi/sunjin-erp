// Generated: 2026-01-27 21:40:00 KST

'use client';

import { MaintenanceContractDetail } from '@/types/maintenance';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertCircle, Loader2 } from 'lucide-react';

interface DeleteConfirmDialogProps {
  contract: MaintenanceContractDetail;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm?: () => void;
  isDeleting?: boolean;
}

/**
 * 유지보수 계약 삭제 확인 다이얼로그
 * - 삭제 대상 계약 정보 표시
 * - 삭제 경고 및 취소 옵션
 * - Soft delete (deleted_at 설정) 처리
 */
export default function DeleteConfirmDialog({
  contract,
  open = false,
  onOpenChange,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            계약 삭제
          </DialogTitle>
          <DialogDescription>
            이 작업은 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800 font-medium">
              다음 계약을 삭제하시겠습니까?
            </p>
            <div className="mt-3 space-y-2 text-sm text-red-700">
              <p>
                <span className="font-medium">계약명:</span> {contract.contract_name}
              </p>
              <p>
                <span className="font-medium">고객사:</span> {contract.customer.name}
              </p>
              <p>
                <span className="font-medium">상태:</span> {contract.contract_status}
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p>
              이 계약은 데이터베이스에서 영구적으로 삭제되며, 관련된 모든 정보도
              삭제됩니다.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange?.(false)}
            disabled={isDeleting}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
