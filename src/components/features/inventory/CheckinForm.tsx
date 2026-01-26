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
import { useCheckinInventoryMutation, useInventoryListQuery } from '@/hooks/inventory';
import type { CheckinInventoryRequest } from '@/types/inventory';

interface CheckinFormProps {
  open: boolean;
  onClose: () => void;
}

interface FormState {
  inventory_id: number | null;
  current_location: string;
  reason: string;
}

function getInitialForm(): FormState {
  return {
    inventory_id: null,
    current_location: '',
    reason: '',
  };
}

export default function CheckinForm({ open, onClose }: CheckinFormProps) {
  const [form, setForm] = useState<FormState>(getInitialForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { data: listData } = useInventoryListQuery({ statuses: ['출고'] });
  const { mutateAsync: checkin, isPending } = useCheckinInventoryMutation(form.inventory_id || 0);

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

    // current_location 검증
    if (!form.current_location.trim()) {
      newErrors.current_location = '반납 위치를 입력하세요.';
    } else if (form.current_location.length > 200) {
      newErrors.current_location = '반납 위치는 200자 이하로 입력하세요.';
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

    const data: CheckinInventoryRequest = {
      current_location: form.current_location.trim(),
      ...(form.reason && { reason: form.reason.trim() }),
    };

    try {
      await checkin(data);
      toast.success('반납 처리가 완료되었습니다.');
      onClose();
    } catch (error: any) {
      toast.error(error.message || '반납 처리에 실패했습니다.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>반납 처리</DialogTitle>
          <DialogDescription>출고된 장비를 반납 처리합니다.</DialogDescription>
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

          {/* 반납 위치 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              반납 위치 <span className="text-destructive">*</span>
            </label>
            <Input
              value={form.current_location}
              onChange={(e) => setForm({ ...form, current_location: e.target.value })}
              placeholder="반납 위치를 입력하세요"
              maxLength={200}
            />
            {errors.current_location && (
              <p className="text-xs text-destructive">{errors.current_location}</p>
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
            {isPending ? '처리 중...' : '반납'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
