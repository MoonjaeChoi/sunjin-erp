'use client';

// Generated: 2026-01-25 22:25:00 KST

import { useState } from 'react';
import { useCreateIssueMutation } from '@/hooks/issues';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface IssueCreateFormProps {
  onSuccess?: () => void;
}

export default function IssueCreateForm({ onSuccess }: IssueCreateFormProps) {
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

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/issues');
      }
    } catch (error: any) {
      console.error('Create issue failed:', error);
    }
  };

  return (
    <Card className="p-6 max-w-2xl">
      <form onSubmit={onSubmit} className="space-y-6">
        {/* 고객사 */}
        <div>
          <label className="block text-sm font-medium mb-2">
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
              <SelectItem value="1">고객사 A</SelectItem>
              <SelectItem value="2">고객사 B</SelectItem>
              <SelectItem value="3">고객사 C</SelectItem>
            </SelectContent>
          </Select>
          {errors.customer_id && (
            <p className="text-sm text-red-500 mt-1">{errors.customer_id}</p>
          )}
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium mb-2">
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
          <label className="block text-sm font-medium mb-3">
            심각도 <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col gap-3">
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
          <label className="block text-sm font-medium mb-2">
            설명 <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder="장애 내용"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-md min-h-32 resize-none"
          />
          {errors.description && (
            <p className="text-sm text-red-500 mt-1">{errors.description}</p>
          )}
        </div>

        {/* 담당자 (선택) */}
        <div>
          <label className="block text-sm font-medium mb-2">담당자</label>
          <Select
            value={formData.assigned_to_id}
            onValueChange={(value) =>
              setFormData({ ...formData, assigned_to_id: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="미지정" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">미지정</SelectItem>
              <SelectItem value="1">담당자 A</SelectItem>
              <SelectItem value="2">담당자 B</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 버튼 */}
        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            취소
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? '등록중...' : '등록'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
