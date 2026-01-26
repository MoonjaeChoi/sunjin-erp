'use client';

// Generated: 2026-01-25 18:05:00 KST

import { useState } from 'react';
import { useCreateIssueMutation } from '@/hooks/issues';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface IssueCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers?: Array<{ id: number; name: string }>;
  employees?: Array<{ id: number; name: string }>;
}

export default function IssueCreateDialog({
  open,
  onOpenChange,
  customers = [],
  employees = [],
}: IssueCreateDialogProps) {
  const router = useRouter();
  const createMutation = useCreateIssueMutation();

  const [formData, setFormData] = useState({
    customer_id: '',
    title: '',
    severity: 'MEDIUM',
    description: '',
    assigned_to_id: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_id) {
      newErrors.customer_id = '고객사를 선택해주세요';
    }
    if (!formData.title) {
      newErrors.title = '제목은 필수입니다';
    }
    if (formData.title && formData.title.length > 255) {
      newErrors.title = '제목은 255자 이하여야 합니다';
    }
    if (!formData.description) {
      newErrors.description = '설명은 필수입니다';
    }
    if (formData.description && formData.description.length < 10) {
      newErrors.description = '설명은 최소 10자 이상이어야 합니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await createMutation.mutateAsync({
        customer_id: parseInt(formData.customer_id),
        title: formData.title,
        severity: formData.severity as any,
        description: formData.description,
        assigned_to_id: formData.assigned_to_id
          ? parseInt(formData.assigned_to_id)
          : undefined,
      });

      setFormData({
        customer_id: '',
        title: '',
        severity: 'MEDIUM',
        description: '',
        assigned_to_id: '',
      });
      setErrors({});
      onOpenChange(false);
      router.refresh();
    } catch (error: any) {
      console.error('Create issue failed:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>신규 장애 등록</DialogTitle>
          <DialogDescription>새로운 장애 건을 등록합니다.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* 고객사 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              고객사 <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.customer_id}
              onValueChange={(value) =>
                setFormData({ ...formData, customer_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customer_id && (
              <p className="text-sm text-red-500 mt-1">{errors.customer_id}</p>
            )}
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              제목 <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="장애 제목"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          {/* 심각도 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              심각도 <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col gap-2">
              {[
                { value: 'CRITICAL', label: '심각 (P1)' },
                { value: 'HIGH', label: '높음 (P2)' },
                { value: 'MEDIUM', label: '보통 (P3)' },
                { value: 'LOW', label: '낮음 (P4)' },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="severity"
                    value={option.value}
                    checked={formData.severity === option.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        severity: e.target.value,
                      })
                    }
                    className="w-4 h-4"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              설명 <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="장애 내용"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md min-h-24 resize-none"
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description}</p>
            )}
          </div>

          {/* 담당자 (선택) */}
          <div>
            <label className="block text-sm font-medium mb-1">담당자</label>
            <Select
              value={formData.assigned_to_id || '__none__'}
              onValueChange={(value) =>
                setFormData({ ...formData, assigned_to_id: value === '__none__' ? '' : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="미지정" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">미지정</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id.toString()}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 버튼 */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? '등록중...' : '등록'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
