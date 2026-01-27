// Generated: 2026-01-27 03:55:00 KST

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  MaintenanceContractDetail,
  UpdateMaintenanceContractRequest,
} from '@/types/maintenance';
import { useMaintenanceContractMutations } from '@/hooks/useMaintenanceContracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Loader2 } from 'lucide-react';

interface UpdateMaintenanceContractFormProps {
  contract: MaintenanceContractDetail;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * 유지보수 계약 수정 폼
 * - 계약 정보 수정 (계약명, 계약유형, 담당자 등)
 * - 계약기간 수정
 * - 계약금액 수정
 * - 비고 수정
 */
export default function UpdateMaintenanceContractForm({
  contract,
  open = false,
  onOpenChange,
  onSuccess,
}: UpdateMaintenanceContractFormProps) {
  const { updateMutation } = useMaintenanceContractMutations();

  // Form State
  const [formData, setFormData] = useState<UpdateMaintenanceContractRequest>({
    contract_name: contract.contract_name,
    assigned_employee_id: contract.assigned_employee_id,
    end_date: contract.end_date
      ? new Date(contract.end_date).toISOString().split('T')[0]
      : '',
    contract_amount: contract.contract_amount,
    notes: contract.notes,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when contract changes
  useEffect(() => {
    if (contract) {
      setFormData({
        contract_name: contract.contract_name,
        assigned_employee_id: contract.assigned_employee_id,
        end_date: contract.end_date
          ? new Date(contract.end_date).toISOString().split('T')[0]
          : '',
        contract_amount: contract.contract_amount,
        notes: contract.notes,
      });
      setErrors({});
    }
  }, [contract, open]);

  // Handle input change
  const handleInputChange = useCallback(
    (field: keyof UpdateMaintenanceContractRequest, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.contract_name?.trim()) {
      newErrors.contract_name = '계약명은 필수입니다';
    }
    if (formData.assigned_employee_id && formData.assigned_employee_id <= 0) {
      newErrors.assigned_employee_id = '담당자는 필수입니다';
    }
    if (!formData.end_date) {
      newErrors.end_date = '종료일은 필수입니다';
    }
    if (formData.contract_amount && formData.contract_amount <= 0) {
      newErrors.contract_amount = '계약금액은 0보다 커야 합니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await updateMutation.mutateAsync({
        id: contract.id,
        data: formData,
      });
      onOpenChange?.(false);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>계약 정보 수정</DialogTitle>
          <DialogDescription>
            유지보수 계약의 정보를 수정하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Submit Error */}
          {errors.submit && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">기본 정보</h3>

            {/* Contract Name */}
            <div className="space-y-2">
              <label htmlFor="contract_name" className="text-sm font-medium">
                계약명 *
              </label>
              <Input
                id="contract_name"
                value={formData.contract_name}
                onChange={(e) =>
                  handleInputChange('contract_name', e.target.value)
                }
                disabled={isSubmitting}
              />
              {errors.contract_name && (
                <p className="text-xs text-red-600">{errors.contract_name}</p>
              )}
            </div>

            {/* Assigned Employee */}
            <div className="space-y-2">
              <label
                htmlFor="assigned_employee_id"
                className="text-sm font-medium"
              >
                담당자
              </label>
              <Select
                value={formData.assigned_employee_id && formData.assigned_employee_id > 0 ? String(formData.assigned_employee_id) : undefined}
                onValueChange={(value) =>
                  handleInputChange('assigned_employee_id', parseInt(value))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="assigned_employee_id">
                  <SelectValue placeholder="담당자 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">김철수 (지원팀)</SelectItem>
                  <SelectItem value="2">이영희 (기술팀)</SelectItem>
                  <SelectItem value="3">박민준 (영업팀)</SelectItem>
                </SelectContent>
              </Select>
              {errors.assigned_employee_id && (
                <p className="text-xs text-red-600">
                  {errors.assigned_employee_id}
                </p>
              )}
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <label htmlFor="end_date" className="text-sm font-medium">
              종료일 *
            </label>
            <Input
              id="end_date"
              type="date"
              value={String(formData.end_date)}
              onChange={(e) =>
                handleInputChange('end_date', e.target.value)
              }
              disabled={isSubmitting}
            />
            {errors.end_date && (
              <p className="text-xs text-red-600">{errors.end_date}</p>
            )}
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">
              계약 정보
            </h3>

            <div className="space-y-2">
              <label htmlFor="contract_amount" className="text-sm font-medium">
                계약금액 (원) *
              </label>
              <Input
                id="contract_amount"
                type="number"
                value={formData.contract_amount || ''}
                onChange={(e) =>
                  handleInputChange(
                    'contract_amount',
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                disabled={isSubmitting}
                min="0"
              />
              {errors.contract_amount && (
                <p className="text-xs text-red-600">{errors.contract_amount}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">기타</h3>

            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                비고
              </label>
              <Textarea
                id="notes"
                value={formData.notes ?? ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange?.(false)}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
