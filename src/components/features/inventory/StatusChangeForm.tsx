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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStatusChangeInventoryMutation, useInventoryListQuery } from '@/hooks/inventory';
import { InventoryStatusLabel } from '@/types/inventory';
import type { StatusChangeInventoryRequest, InventoryStatus } from '@/types/inventory';

interface StatusChangeFormProps {
  open: boolean;
  onClose: () => void;
}

interface FormState {
  inventory_id: number | null;
  current_status: InventoryStatus | '';
  reason: string;
}

function getInitialForm(): FormState {
  return {
    inventory_id: null,
    current_status: '',
    reason: '',
  };
}

// 상태 전환 규칙
const STATE_TRANSITIONS: Record<InventoryStatus, InventoryStatus[]> = {
  '재고': ['출고', '고장', '폐기'],
  '출고': ['재고', '고장'],
  '고장': ['폐기'],
  '폐기': [],
};

export default function StatusChangeForm({ open, onClose }: StatusChangeFormProps) {
  const [form, setForm] = useState<FormState>(getInitialForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { data: listData } = useInventoryListQuery({ statuses: ['재고', '출고', '고장'] });
  const { mutateAsync: statusChange, isPending } = useStatusChangeInventoryMutation(
    form.inventory_id || 0
  );

  // Dialog 열릴 때 폼 초기화
  useEffect(() => {
    if (open) {
      setForm(getInitialForm());
      setErrors({});
    }
  }, [open]);

  const inventoryItems = listData?.data || [];
  const selectedItem = inventoryItems.find((item) => item.id === form.inventory_id);
  const currentStatus = selectedItem?.current_status as InventoryStatus | undefined;
  const allowedStatuses = currentStatus ? STATE_TRANSITIONS[currentStatus] : [];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // inventory_id 검증
    if (!form.inventory_id) {
      newErrors.inventory_id = '장비를 선택하세요.';
    }

    // current_status 검증
    if (!form.current_status) {
      newErrors.current_status = '변경할 상태를 선택하세요.';
    }

    // reason 검증 (필수)
    if (!form.reason.trim()) {
      newErrors.reason = '사유를 입력하세요.';
    } else if (form.reason.length > 200) {
      newErrors.reason = '사유는 200자 이하로 입력하세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const data: StatusChangeInventoryRequest = {
      current_status: form.current_status as InventoryStatus,
      reason: form.reason.trim(),
    };

    try {
      await statusChange(data);
      toast.success('상태 변경이 완료되었습니다.');
      onClose();
    } catch (error: any) {
      toast.error(error.message || '상태 변경에 실패했습니다.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>상태 변경</DialogTitle>
          <DialogDescription>장비의 상태를 변경합니다.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 장비 선택 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              장비 <span className="text-destructive">*</span>
            </label>
            <Select
              value={form.inventory_id ? String(form.inventory_id) : '__placeholder__'}
              onValueChange={(v) => {
                if (v !== '__placeholder__') {
                  setForm({ ...form, inventory_id: Number(v), current_status: '' });
                  // 선택 변경시 상태 에러 초기화
                  if (errors.current_status) {
                    const newErrors = { ...errors };
                    delete newErrors.current_status;
                    setErrors(newErrors);
                  }
                }
              }}
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
                    {item.category} - {item.model} (SN: {item.serial_number}) [
                    {InventoryStatusLabel[item.current_status]}]
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.inventory_id && (
              <p className="text-xs text-destructive">{errors.inventory_id}</p>
            )}
          </div>

          {/* 현재 상태 표시 */}
          {currentStatus && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                현재 상태: <span className="font-medium">{InventoryStatusLabel[currentStatus]}</span>
              </p>
            </div>
          )}

          {/* 변경할 상태 선택 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              변경할 상태 <span className="text-destructive">*</span>
            </label>
            <Select
              value={form.current_status || '__placeholder__'}
              onValueChange={(v) =>
                v !== '__placeholder__' && setForm({ ...form, current_status: v as InventoryStatus })
              }
              disabled={!currentStatus || allowedStatuses.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="상태를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__placeholder__" disabled hidden>
                  상태를 선택하세요
                </SelectItem>
                {allowedStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {InventoryStatusLabel[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.current_status && (
              <p className="text-xs text-destructive">{errors.current_status}</p>
            )}
            {!currentStatus && (
              <p className="text-xs text-muted-foreground">장비를 먼저 선택하세요.</p>
            )}
            {currentStatus && allowedStatuses.length === 0 && (
              <p className="text-xs text-muted-foreground">
                현재 상태에서 상태 변경이 불가능합니다.
              </p>
            )}
          </div>

          {/* 사유 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              사유 <span className="text-destructive">*</span>
            </label>
            <Textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="상태 변경 사유를 입력하세요"
              rows={4}
              maxLength={200}
            />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !form.inventory_id || !form.current_status}
          >
            {isPending ? '처리 중...' : '변경'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
