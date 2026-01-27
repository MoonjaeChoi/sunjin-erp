// Generated: 2026-01-28 00:30:00 KST

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateDepartment, useUpdateDepartment } from '@/hooks/useEmployees';
import { DepartmentWithChildren, DepartmentFormData } from '@/types/employee';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface DepartmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: DepartmentWithChildren | null;
  departments: DepartmentWithChildren[];
}

export function DepartmentForm({ open, onOpenChange, department, departments }: DepartmentFormProps) {
  const isEdit = !!department;

  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment(department?.id || 0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormData>({
    defaultValues: {
      name: '',
      code: '',
      description: '',
      parentDepartmentId: '',
    },
  });

  const watchParentId = watch('parentDepartmentId');

  // 폼 초기화
  useEffect(() => {
    if (open && department) {
      reset({
        name: department.name,
        code: department.code,
        description: department.description || '',
        parentDepartmentId: department.parentDepartmentId?.toString() || '',
      });
    } else if (open) {
      reset({
        name: '',
        code: '',
        description: '',
        parentDepartmentId: '',
      });
    }
  }, [open, department, reset]);

  // 부서 목록 평탄화 (자기 자신과 하위 부서 제외)
  const flattenDepartments = (
    depts: DepartmentWithChildren[],
    excludeId?: number,
    level = 0
  ): { id: number; name: string; level: number }[] => {
    return depts.flatMap((dept) => {
      if (dept.id === excludeId) return [];
      return [
        { id: dept.id, name: dept.name, level },
        ...flattenDepartments(dept.children || [], excludeId, level + 1),
      ];
    });
  };
  const flatDepartments = flattenDepartments(departments, department?.id);

  const onSubmit = async (data: DepartmentFormData) => {
    try {
      const payload = {
        name: data.name.trim(),
        code: data.code.trim(),
        description: data.description?.trim() || undefined,
        parentDepartmentId: data.parentDepartmentId ? parseInt(data.parentDepartmentId, 10) : undefined,
      };

      if (isEdit) {
        await updateMutation.mutateAsync(payload);
        toast.success('부서가 수정되었습니다.');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('부서가 생성되었습니다.');
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
          <DialogTitle>{isEdit ? '부서 수정' : '새 부서 생성'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? '부서 정보를 수정합니다.'
              : '새로운 부서를 생성합니다. 부서 계층은 최대 5단계까지 가능합니다.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">부서명 *</Label>
            <Input
              id="name"
              {...register('name', { required: '부서명은 필수입니다.' })}
              placeholder="예: 개발팀"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">부서 코드 *</Label>
            <Input
              id="code"
              {...register('code', { required: '부서 코드는 필수입니다.' })}
              placeholder="예: DEV"
              disabled={isEdit}
            />
            {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
            {isEdit && <p className="text-xs text-gray-500">부서 코드는 수정할 수 없습니다.</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="부서에 대한 설명을 입력하세요"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>상위 부서</Label>
            <Select
              value={watchParentId || 'NONE'}
              onValueChange={(v) => setValue('parentDepartmentId', v === 'NONE' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="상위 부서 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">없음 (최상위)</SelectItem>
                {flatDepartments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {'　'.repeat(dept.level)}{dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
