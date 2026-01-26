// Generated: 2026-01-27 04:00:00 KST

'use client';

import { useState, useCallback } from 'react';
import {
  MaintenanceContractDetail,
  ContractStatus,
  ChangeStatusRequest,
} from '@/types/maintenance';
import {
  useStatusBadge,
  useStatusTransition,
} from '@/hooks/useMaintenanceUtils';
import { useMaintenanceContractMutations } from '@/hooks/useMaintenanceContracts';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle } from 'lucide-react';

interface StatusChangeFormProps {
  contract: MaintenanceContractDetail;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * 계약 상태 변경 폼
 * - 현재 상태 표시
 * - 변경 가능한 상태 목록 (useStatusTransition 이용)
 * - 변경 사유 입력
 * - 상태 변경 처리
 */
export default function StatusChangeForm({
  contract,
  open = false,
  onOpenChange,
  onSuccess,
}: StatusChangeFormProps) {
  const { changeStatusMutation } = useMaintenanceContractMutations();

  // Utility hooks
  const currentBadgeProps = useStatusBadge(
    contract.contract_status as ContractStatus
  );
  const { validNextStatuses } = useStatusTransition(
    contract.contract_status as ContractStatus
  );

  // Form State
  const [formData, setFormData] = useState<ChangeStatusRequest>({
    status: contract.contract_status as ContractStatus,
    reason: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      status: contract.contract_status as ContractStatus,
      reason: '',
    });
    setErrors({});
  }, [contract]);

  // Handle status change
  const handleStatusChange = useCallback((status: string) => {
    setFormData((prev) => ({
      ...prev,
      status: status as ContractStatus,
    }));
    if (errors.status) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.status;
        return newErrors;
      });
    }
  }, [errors]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.status) {
      newErrors.status = '변경할 상태를 선택하세요';
    }
    if (formData.status === contract.contract_status) {
      newErrors.status = '현재 상태와 같은 상태로 변경할 수 없습니다';
    }
    if (!formData.reason?.trim()) {
      newErrors.reason = '변경 사유는 필수입니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await changeStatusMutation.mutateAsync({
        id: contract.id,
        data: formData,
      });
      onOpenChange?.(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : '오류가 발생했습니다',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>계약 상태 변경</DialogTitle>
          <DialogDescription>
            계약의 상태를 변경하고 변경 사유를 입력하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Submit Error */}
          {errors.submit && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* Current Status Display */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">현재 상태</h3>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
              <Badge
                variant={
                  contract.contract_status === '활성'
                    ? 'default'
                    : contract.contract_status === '종료'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {contract.contract_status}
              </Badge>
              <span className="text-sm text-gray-600">
                {contract.contract_name}
              </span>
            </div>
          </div>

          {/* Status Transition Info */}
          {validNextStatuses.length === 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  상태 변경 불가
                </p>
                <p className="text-sm text-amber-800 mt-1">
                  현재 상태에서는 변경할 수 있는 다음 상태가 없습니다.
                </p>
              </div>
            </div>
          )}

          {/* New Status Selection */}
          {validNextStatuses.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">
                변경할 상태
              </h3>

              <div className="space-y-2">
                <label htmlFor="new_status" className="text-sm font-medium">
                  상태 *
                </label>
                <Select
                  value={formData.status}
                  onValueChange={handleStatusChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="new_status">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {validNextStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-xs text-red-600">{errors.status}</p>
                )}
              </div>
            </div>
          )}

          {/* Change Reason */}
          {validNextStatuses.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">
                변경 사유
              </h3>

              <div className="space-y-2">
                <label htmlFor="reason" className="text-sm font-medium">
                  사유 *
                </label>
                <Textarea
                  id="reason"
                  placeholder="변경 사유를 입력하세요"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                  rows={3}
                />
                {errors.reason && (
                  <p className="text-xs text-red-600">{errors.reason}</p>
                )}
              </div>
            </div>
          )}

          {/* Status Transition Rules (Info) */}
          <div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="font-medium text-blue-900 mb-1">상태 변경 규칙</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>활성 → 종료, 갱신예정</li>
              <li>종료 → 갱신예정</li>
              <li>갱신예정 → 활성</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange?.(false);
              resetForm();
            }}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || validNextStatuses.length === 0}
          >
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            상태 변경
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
