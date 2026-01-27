// Generated: 2026-01-28 00:30:00 KST

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useCreatePosition, useUpdatePosition } from '@/hooks/useEmployees';
import { Position, PositionFormData } from '@/types/employee';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface PositionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: Position | null;
}

export function PositionForm({ open, onOpenChange, position }: PositionFormProps) {
  const isEdit = !!position;

  const createMutation = useCreatePosition();
  const updateMutation = useUpdatePosition(position?.id || 0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PositionFormData>({
    defaultValues: {
      name: '',
      level: '',
    },
  });

  // 폼 초기화
  useEffect(() => {
    if (open && position) {
      reset({
        name: position.name,
        level: position.level.toString(),
      });
    } else if (open) {
      reset({
        name: '',
        level: '',
      });
    }
  }, [open, position, reset]);

  const onSubmit = async (data: PositionFormData) => {
    try {
      const payload = {
        name: data.name.trim(),
        level: parseInt(data.level, 10),
      };

      if (isEdit) {
        await updateMutation.mutateAsync(payload);
        toast.success('직급이 수정되었습니다.');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('직급이 생성되었습니다.');
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || '오류가 발생했습니다.');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? '직급 수정' : '새 직급 생성'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? '직급 정보를 수정합니다. 코드는 변경할 수 없습니다.'
              : '새로운 직급을 생성합니다. 코드는 자동으로 생성됩니다.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">직급명 *</Label>
            <Input
              id="name"
              {...register('name', { required: '직급명은 필수입니다.' })}
              placeholder="예: 과장"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">레벨 * (1-10, 낮을수록 높은 직급)</Label>
            <Input
              id="level"
              type="number"
              min={1}
              max={10}
              {...register('level', {
                required: '레벨은 필수입니다.',
                min: { value: 1, message: '레벨은 1 이상이어야 합니다.' },
                max: { value: 10, message: '레벨은 10 이하여야 합니다.' },
              })}
              placeholder="예: 3"
            />
            {errors.level && <p className="text-sm text-red-500">{errors.level.message}</p>}
            <p className="text-xs text-gray-500">
              1: 가장 높은 직급 (예: 대표이사), 10: 가장 낮은 직급 (예: 인턴)
            </p>
          </div>

          {isEdit && position && (
            <div className="space-y-2">
              <Label>코드</Label>
              <Input value={position.code} disabled />
              <p className="text-xs text-gray-500">코드는 자동 생성되며 수정할 수 없습니다.</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? '수정' : '생성'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
