// Generated: 2026-01-28 01:35:00 KST

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
import { CustomerResponse, CLASSIFICATION_OPTIONS, CUSTOMER_VALIDATION } from '@/types/customer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface CustomerFormProps {
  customer?: CustomerResponse;
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    classification: customer?.classification || 'END_USER',
    address: customer?.address || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    memo: customer?.memo || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isEditMode = !!customer;

  const validateForm = () => {
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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (isEditMode && customer) {
      updateMutation.mutate(
        {
          id: customer.id,
          data: {
            address: formData.address,
            phone: formData.phone,
            email: formData.email,
            memo: formData.memo,
            classification: formData.classification as any,
          },
        },
        {
          onSuccess: () => {
            router.push(`/customers/${customer.id}`);
          },
          onError: (error) => {
            alert(`오류: ${error.message}`);
          },
        }
      );
    } else {
      createMutation.mutate({
        ...formData,
        classification: formData.classification as any,
      }, {
        onSuccess: (newCustomer) => {
          router.push(`/customers/${newCustomer.id}`);
        },
        onError: (error) => {
          alert(`오류: ${error.message}`);
        },
      });
    }
  };

  return (
    <Card className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{isEditMode ? '고객 수정' : '새 고객 등록'}</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">고객명 *</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="고객사명"
            disabled={isEditMode || isLoading}
          />
          {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">분류 *</label>
          <Select value={formData.classification} onValueChange={(v: any) => setFormData({ ...formData, classification: v })}>
            <SelectTrigger>
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

        <div>
          <label className="block text-sm font-medium mb-1">주소</label>
          <Input
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="주소"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">전화</label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="02-1234-5678"
            disabled={isLoading}
          />
          {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">이메일</label>
          <Input
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="contact@company.com"
            type="email"
            disabled={isLoading}
          />
          {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">메모</label>
          <Textarea
            value={formData.memo}
            onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
            placeholder="메모"
            rows={4}
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.memo.length}/{CUSTOMER_VALIDATION.MEMO_MAX_LENGTH}
          </p>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditMode ? '수정하기' : '등록하기'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
