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
import { INVENTORY_CATEGORIES } from '@/types/inventory';
import { useCreateInventoryMutation } from '@/hooks/inventory';
import type { CreateInventoryRequest } from '@/types/inventory';

interface CreateInventoryFormProps {
  open: boolean;
  onClose: () => void;
}

interface FormState {
  category: string;
  model: string;
  serial_number: string;
  purchase_date: string;
  purchase_from: string;
  current_location: string;
  notes: string;
}

function getInitialForm(): FormState {
  return {
    category: '',
    model: '',
    serial_number: '',
    purchase_date: '',
    purchase_from: '',
    current_location: '',
    notes: '',
  };
}

export default function CreateInventoryForm({ open, onClose }: CreateInventoryFormProps) {
  const { mutateAsync, isPending } = useCreateInventoryMutation();
  const [form, setForm] = useState<FormState>(getInitialForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dialog 열릴 때 폼 초기화
  useEffect(() => {
    if (open) {
      setForm(getInitialForm());
      setErrors({});
    }
  }, [open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // category 검증
    if (!form.category) {
      newErrors.category = '카테고리를 선택하세요.';
    }

    // model 검증
    if (!form.model.trim()) {
      newErrors.model = '모델명을 입력하세요.';
    } else if (form.model.length > 100) {
      newErrors.model = '모델명은 100자 이하로 입력하세요.';
    }

    // serial_number 검증
    if (!form.serial_number.trim()) {
      newErrors.serial_number = '시리얼번호를 입력하세요.';
    } else if (form.serial_number.length > 100) {
      newErrors.serial_number = '시리얼번호는 100자 이하로 입력하세요.';
    }

    // purchase_date 검증
    if (!form.purchase_date) {
      newErrors.purchase_date = '구매일을 입력하세요.';
    } else if (form.purchase_date > new Date().toISOString().split('T')[0]) {
      newErrors.purchase_date = '구매일은 오늘 이전이어야 합니다.';
    }

    // purchase_from 검증
    if (!form.purchase_from.trim()) {
      newErrors.purchase_from = '구매처를 입력하세요.';
    } else if (form.purchase_from.length > 100) {
      newErrors.purchase_from = '구매처는 100자 이하로 입력하세요.';
    }

    // current_location 검증
    if (!form.current_location.trim()) {
      newErrors.current_location = '현재위치를 입력하세요.';
    } else if (form.current_location.length > 200) {
      newErrors.current_location = '현재위치는 200자 이하로 입력하세요.';
    }

    // notes 검증 (선택사항)
    if (form.notes && form.notes.length > 500) {
      newErrors.notes = '비고는 500자 이하로 입력하세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const data: CreateInventoryRequest = {
      category: form.category,
      model: form.model.trim(),
      serial_number: form.serial_number.trim(),
      purchase_date: form.purchase_date,
      purchase_from: form.purchase_from.trim(),
      current_location: form.current_location.trim(),
      ...(form.notes && { notes: form.notes.trim() }),
    };

    try {
      await mutateAsync(data);
      toast.success('입고 등록이 완료되었습니다.');
      onClose();
    } catch (error: any) {
      toast.error(error.message || '등록에 실패했습니다.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>신규 입고 등록</DialogTitle>
          <DialogDescription>새로운 장비를 재고에 등록합니다.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 카테고리 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              카테고리 <span className="text-destructive">*</span>
            </label>
            <Select
              value={form.category || '__placeholder__'}
              onValueChange={(v) => v !== '__placeholder__' && setForm({ ...form, category: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__placeholder__" disabled hidden>
                  선택하세요
                </SelectItem>
                {INVENTORY_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
          </div>

          {/* 모델명 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              모델명 <span className="text-destructive">*</span>
            </label>
            <Input
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              placeholder="모델명을 입력하세요"
              maxLength={100}
            />
            {errors.model && <p className="text-xs text-destructive">{errors.model}</p>}
          </div>

          {/* 시리얼번호 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              시리얼번호 <span className="text-destructive">*</span>
            </label>
            <Input
              value={form.serial_number}
              onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
              placeholder="시리얼번호를 입력하세요"
              maxLength={100}
            />
            {errors.serial_number && (
              <p className="text-xs text-destructive">{errors.serial_number}</p>
            )}
          </div>

          {/* 구매일 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              구매일 <span className="text-destructive">*</span>
            </label>
            <Input
              type="date"
              value={form.purchase_date}
              onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
            />
            {errors.purchase_date && (
              <p className="text-xs text-destructive">{errors.purchase_date}</p>
            )}
          </div>

          {/* 구매처 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              구매처 <span className="text-destructive">*</span>
            </label>
            <Input
              value={form.purchase_from}
              onChange={(e) => setForm({ ...form, purchase_from: e.target.value })}
              placeholder="구매처를 입력하세요"
              maxLength={100}
            />
            {errors.purchase_from && (
              <p className="text-xs text-destructive">{errors.purchase_from}</p>
            )}
          </div>

          {/* 현재위치 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              현재위치 <span className="text-destructive">*</span>
            </label>
            <Input
              value={form.current_location}
              onChange={(e) => setForm({ ...form, current_location: e.target.value })}
              placeholder="현재위치를 입력하세요"
              maxLength={200}
            />
            {errors.current_location && (
              <p className="text-xs text-destructive">{errors.current_location}</p>
            )}
          </div>

          {/* 비고 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">비고</label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="비고를 입력하세요 (선택사항)"
              rows={3}
              maxLength={500}
            />
            {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? '등록 중...' : '등록'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
