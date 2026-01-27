// Generated: 2026-01-28 03:00:00 KST

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useCreateCustomer } from '@/hooks/useCustomers';
import { CLASSIFICATION_OPTIONS, CUSTOMER_VALIDATION } from '@/types/customer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Loader2 } from 'lucide-react';

interface CreateCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  classification: string;
  address: string;
  phone: string;
  email: string;
  memo: string;
}

const initialFormData: FormData = {
  name: '',
  classification: 'END_USER',
  address: '',
  phone: '',
  email: '',
  memo: '',
};

/**
 * 새 고객 등록 다이얼로그
 * - 고객 기본 정보 입력 (이름, 분류)
 * - 연락처 정보 (주소, 전화, 이메일)
 * - 메모
 */
export function CreateCustomerDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCustomerDialogProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateCustomer();
  const isSubmitting = createMutation.isPending;

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData(initialFormData);
      setErrors({});
    }
  }, [open]);

  // Handle input change
  const handleInputChange = useCallback(
    (field: keyof FormData, value: string) => {
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

    if (!formData.name.trim()) {
      newErrors.name = '고객명은 필수입니다.';
    } else if (formData.name.length > CUSTOMER_VALIDATION.NAME_MAX_LENGTH) {
      newErrors.name = `고객명은 ${CUSTOMER_VALIDATION.NAME_MAX_LENGTH}자 이하여야 합니다.`;
    }

    if (formData.phone && !CUSTOMER_VALIDATION.PHONE_PATTERN.test(formData.phone)) {
      newErrors.phone = '전화번호 형식이 올바르지 않습니다.';
    }

    if (formData.email && !CUSTOMER_VALIDATION.EMAIL_PATTERN.test(formData.email)) {
      newErrors.email = '이메일 형식이 올바르지 않습니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    createMutation.mutate(
      {
        name: formData.name,
        classification: formData.classification as any,
        address: formData.address || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        memo: formData.memo || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
        onError: (error) => {
          setErrors({
            submit: error instanceof Error ? error.message : '오류가 발생했습니다',
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 고객 등록</DialogTitle>
          <DialogDescription>
            고객 정보를 입력하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Submit Error */}
          {errors.submit && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* Customer Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              고객명 *
            </label>
            <Input
              id="name"
              placeholder="고객사명"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Classification */}
          <div className="space-y-2">
            <label htmlFor="classification" className="text-sm font-medium">
              분류 *
            </label>
            <Select
              value={formData.classification}
              onValueChange={(v) => handleInputChange('classification', v)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="classification">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLASSIFICATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium">
              주소
            </label>
            <Input
              id="address"
              placeholder="주소"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">
              전화
            </label>
            <Input
              id="phone"
              placeholder="02-1234-5678"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="text-xs text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              이메일
            </label>
            <Input
              id="email"
              type="email"
              placeholder="contact@company.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Memo */}
          <div className="space-y-2">
            <label htmlFor="memo" className="text-sm font-medium">
              메모
            </label>
            <Textarea
              id="memo"
              placeholder="메모"
              value={formData.memo}
              onChange={(e) => handleInputChange('memo', e.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
            <p className="text-xs text-gray-500">
              {formData.memo.length}/{CUSTOMER_VALIDATION.MEMO_MAX_LENGTH}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
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
