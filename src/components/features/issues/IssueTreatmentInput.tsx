'use client';

// Generated: 2026-01-25 22:40:00 KST

import { useState } from 'react';
import { Issue } from '@/types/issue';
import { useUpdateIssueMutation } from '@/hooks/issues';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface IssueTreatmentInputProps {
  issue: Issue;
  onSuccess: () => void;
}

function formatMinutes(minutes: number): string {
  if (!minutes || minutes === 0) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `약 ${mins}분`;
  if (mins === 0) return `약 ${hours}시간`;
  return `약 ${hours}시간 ${mins}분`;
}

export default function IssueTreatmentInput({
  issue,
  onSuccess,
}: IssueTreatmentInputProps) {
  const [formData, setFormData] = useState({
    treatment_method: issue.treatment_method || '',
    treatment_time_minutes: issue.treatment_time_minutes || '',
    treatment_result: issue.treatment_result || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const mutation = useUpdateIssueMutation(issue.id);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.treatment_method) {
      newErrors.treatment_method = '처리 방법을 선택해주세요';
    }

    if (formData.treatment_time_minutes) {
      const minutes = parseInt(String(formData.treatment_time_minutes));
      if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
        newErrors.treatment_time_minutes = '1~1440 분 범위로 입력해주세요';
      }
    }

    if (
      formData.treatment_result &&
      formData.treatment_result.length > 4000
    ) {
      newErrors.treatment_result = '처리 결과는 4000자 이하여야 합니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await mutation.mutateAsync({
        treatment_method: (formData.treatment_method || null) as any,
        treatment_time_minutes: formData.treatment_time_minutes
          ? parseInt(String(formData.treatment_time_minutes))
          : undefined,
        treatment_result: formData.treatment_result || undefined,
      });
      onSuccess();
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const treatmentTimeDisplay = formatMinutes(
    parseInt(String(formData.treatment_time_minutes)) || 0
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 처리 방법 - 라디오 버튼 */}
      <div>
        <label className="block text-sm font-medium mb-3">
          처리 방법 <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-col gap-3">
          {[
            { value: 'REMOTE', label: '원격 지원' },
            { value: 'PHONE', label: '전화 지원' },
            { value: 'ONSITE', label: '현장 방문' },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-2">
              <input
                type="radio"
                name="treatment_method"
                value={option.value}
                checked={formData.treatment_method === option.value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    treatment_method: e.target.value,
                  })
                }
                className="w-4 h-4"
              />
              {option.label}
            </label>
          ))}
        </div>
        {errors.treatment_method && (
          <p className="text-sm text-red-500 mt-1">
            {errors.treatment_method}
          </p>
        )}
      </div>

      {/* 소요 시간 */}
      <div>
        <label className="block text-sm font-medium mb-1">
          소요 시간 (분)
        </label>
        <Input
          type="number"
          min="0"
          max="1440"
          value={formData.treatment_time_minutes}
          onChange={(e) =>
            setFormData({ ...formData, treatment_time_minutes: e.target.value })
          }
          placeholder="1~1440"
        />
        {treatmentTimeDisplay && (
          <p className="text-sm text-gray-600 mt-1">{treatmentTimeDisplay}</p>
        )}
        {errors.treatment_time_minutes && (
          <p className="text-sm text-red-500 mt-1">
            {errors.treatment_time_minutes}
          </p>
        )}
      </div>

      {/* 처리 결과 */}
      <div>
        <label className="block text-sm font-medium mb-1">처리 결과</label>
        <textarea
          value={formData.treatment_result}
          onChange={(e) =>
            setFormData({ ...formData, treatment_result: e.target.value })
          }
          placeholder="처리 결과를 입력하세요"
          className="w-full px-3 py-2 border rounded-md"
          rows={4}
          maxLength={4000}
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.treatment_result.length}/4000
        </p>
        {errors.treatment_result && (
          <p className="text-sm text-red-500 mt-1">
            {errors.treatment_result}
          </p>
        )}
      </div>

      {/* 버튼 */}
      <div className="flex gap-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? '저장 중...' : '저장'}
        </Button>
        <Button type="button" variant="outline" onClick={onSuccess}>
          취소
        </Button>
      </div>
    </form>
  );
}
