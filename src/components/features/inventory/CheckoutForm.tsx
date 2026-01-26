// Generated: 2026-01-26 20:00:00 KST

'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCheckoutInventoryMutation, useInventoryListQuery } from '@/hooks/inventory';
import type { CheckoutInventoryRequest } from '@/types/inventory';

interface CheckoutFormProps {
  open: boolean;
  onClose: () => void;
}

interface FormState {
  inventory_id: number | null;
  checkout_location: string;
  expected_checkin_date: string;
  reason: string;
}

function getInitialForm(): FormState {
  return {
    inventory_id: null,
    checkout_location: '',
    expected_checkin_date: '',
    reason: '',
  };
}

export default function CheckoutForm({ open, onClose }: CheckoutFormProps) {
  const [form, setForm] = useState<FormState>(getInitialForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { data: listData } = useInventoryListQuery({ statuses: ['재고'] });
  const { mutateAsync: checkout, isPending } = useCheckoutInventoryMutation(form.inventory_id || 0);

  // Dialog 열릴 때 폼 초기화
  useEffect(() => {
    if (open) {
      setForm(getInitialForm());
      setErrors({});
    }
  }, [open]);

  const inventoryItems = listData?.data || [];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // inventory_id 검증
    if (!form.inventory_id) {
      newErrors.inventory_id = '장비를 선택하세요.';
    }

    // checkout_location 검증
    if (!form.checkout_location.trim()) {
      newErrors.checkout_location = '사용처를 입력하세요.';
    } else if (form.checkout_location.length > 200) {
      newErrors.checkout_location = '사용처는 200자 이하로 입력하세요.';
    }

    // expected_checkin_date 검증 (선택사항이지만 입력시 미래날짜 확인)
    if (form.expected_checkin_date) {
      const today = new Date().toISOString().split('T')[0];
      if (form.expected_checkin_date < today) {
        newErrors.expected_checkin_date = '반납예정일은 오늘 이후여야 합니다.';
      }
    }

    // reason 검증 (선택사항)
    if (form.reason && form.reason.length > 200) {
      newErrors.reason = '사유는 200자 이하로 입력하세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const data: CheckoutInventoryRequest = {
      checkout_location: form.checkout_location.trim(),
      ...(form.expected_checkin_date && { expected_checkin_date: form.expected_checkin_date }),
      ...(form.reason && { reason: form.reason.trim() }),
    };

    try {
      await checkout(data);
      toast.success('출고 처리가 완료되었습니다.');
      onClose();
    } catch (error: any) {
      toast.error(error.message || '출고 처리에 실패했습니다.');
    }
  };

  const selectedItem = inventoryItems.find((item) => item.id === form.inventory_id);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>출고 처리</DialogTitle>
          <DialogDescription>재고에 있는 장비를 출고 처리합니다.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 장비 선택 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              장비 <span className="text-destructive">*</span>
            </label>
            <Select
              value={form.inventory_id ? String(form.inventory_id) : '__placeholder__'}
              onValueChange={(v) =>
                v !== '__placeholder__' && setForm({ ...form, inventory_id: Number(v) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="장비를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__placeholder__" disabled hidden>
                  장비를 선택하세요
                </SelectItem>
                {inventoryItems.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.category} - {item.model} (SN: {item.serial_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.inventory_id && (
              <p className="text-xs text-destructive">{errors.inventory_id}</p>
            )}
          </div>

          {/* 사용처 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              사용처 <span className="text-destructive">*</span>
            </label>
            <Input
              value={form.checkout_location}
              onChange={(e) => setForm({ ...form, checkout_location: e.target.value })}
              placeholder="프로젝트명, 부서명 또는 담당자명 입력"
              maxLength={200}
            />
            {errors.checkout_location && (
              <p className="text-xs text-destructive">{errors.checkout_location}</p>
            )}
          </div>

          {/* 반납예정일 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">반납예정일</label>
            <Input
              type="date"
              value={form.expected_checkin_date}
              onChange={(e) => setForm({ ...form, expected_checkin_date: e.target.value })}
            />
            {errors.expected_checkin_date && (
              <p className="text-xs text-destructive">{errors.expected_checkin_date}</p>
            )}
          </div>

          {/* 사유 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">사유</label>
            <Textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="사유를 입력하세요 (선택사항)"
              rows={3}
              maxLength={200}
            />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !form.inventory_id}>
            {isPending ? '처리 중...' : '출고'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
