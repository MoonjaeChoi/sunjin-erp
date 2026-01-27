// Generated: 2026-01-27 03:50:00 KST

'use client';

import { useState, useCallback } from 'react';
import {
  CreateMaintenanceContractRequest,
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

interface CreateMaintenanceContractFormProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * 유지보수 계약 신규 등록 폼
 * - 계약 기본 정보 (이름, 고객사, 계약유형)
 * - 담당자
 * - 시작일, 종료일
 * - 계약금액
 * - 비고
 */
export default function CreateMaintenanceContractForm({
  open = false,
  onOpenChange,
  onSuccess,
}: CreateMaintenanceContractFormProps) {
  const { createMutation } = useMaintenanceContractMutations();

  // Form State
  const [formData, setFormData] = useState<CreateMaintenanceContractRequest>({
    contract_name: '',
    customer_id: 0,
    contract_type: '',
    assigned_employee_id: 0,
    start_date: '',
    end_date: '',
    contract_amount: undefined,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input change
  const handleInputChange = useCallback(
    (field: keyof CreateMaintenanceContractRequest, value: any) => {
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
    if (formData.customer_id <= 0) {
      newErrors.customer_id = '고객사는 필수입니다';
    }
    if (!formData.contract_type?.trim()) {
      newErrors.contract_type = '계약유형은 필수입니다';
    }
    if (formData.assigned_employee_id <= 0) {
      newErrors.assigned_employee_id = '담당자는 필수입니다';
    }
    if (!formData.start_date) {
      newErrors.start_date = '시작일은 필수입니다';
    }
    if (!formData.end_date) {
      newErrors.end_date = '종료일은 필수입니다';
    }
    if (!formData.contract_amount || formData.contract_amount <= 0) {
      newErrors.contract_amount = '계약금액은 0보다 커야 합니다';
    }

    // Validate date range
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (startDate >= endDate) {
        newErrors.end_date = '종료일은 시작일보다 이후여야 합니다';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await createMutation.mutateAsync(formData);
      onOpenChange?.(false);
      onSuccess?.();
      // Reset form
      setFormData({
        contract_name: '',
        customer_id: 0,
        contract_type: '',
        assigned_employee_id: 0,
        start_date: '',
        end_date: '',
        contract_amount: undefined,
        notes: '',
      });
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
          <DialogTitle>신규 계약 등록</DialogTitle>
          <DialogDescription>
            유지보수 계약의 기본 정보를 입력하세요.
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
                placeholder="예: ABC Corp 유지보수 계약"
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

            {/* Customer & Contract Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="customer_id" className="text-sm font-medium">
                  고객사 *
                </label>
                <Select
                  value={formData.customer_id > 0 ? String(formData.customer_id) : undefined}
                  onValueChange={(value) =>
                    handleInputChange('customer_id', parseInt(value))
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="customer_id">
                    <SelectValue placeholder="고객사 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">ABC Corporation</SelectItem>
                    <SelectItem value="2">XYZ Industries</SelectItem>
                    <SelectItem value="3">Tech Solutions Inc</SelectItem>
                  </SelectContent>
                </Select>
                {errors.customer_id && (
                  <p className="text-xs text-red-600">{errors.customer_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="contract_type" className="text-sm font-medium">
                  계약유형 *
                </label>
                <Input
                  id="contract_type"
                  placeholder="예: 매월유지보수"
                  value={formData.contract_type}
                  onChange={(e) =>
                    handleInputChange('contract_type', e.target.value)
                  }
                  disabled={isSubmitting}
                />
                {errors.contract_type && (
                  <p className="text-xs text-red-600">{errors.contract_type}</p>
                )}
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">담당자</h3>
            <div className="space-y-2">
              <label
                htmlFor="assigned_employee_id"
                className="text-sm font-medium"
              >
                담당자 *
              </label>
              <Select
                value={formData.assigned_employee_id > 0 ? String(formData.assigned_employee_id) : undefined}
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

          {/* Contract Period */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">계약기간</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="start_date" className="text-sm font-medium">
                  시작일 *
                </label>
                <Input
                  id="start_date"
                  type="date"
                  value={String(formData.start_date)}
                  onChange={(e) =>
                    handleInputChange('start_date', e.target.value)
                  }
                  disabled={isSubmitting}
                />
                {errors.start_date && (
                  <p className="text-xs text-red-600">{errors.start_date}</p>
                )}
              </div>

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
            </div>
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
                placeholder="0"
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
                placeholder="추가 정보를 입력하세요"
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
            등록
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
