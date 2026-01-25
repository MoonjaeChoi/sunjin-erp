'use client';

// Generated: 2026-01-25 18:05:00 KST

import { useState } from 'react';
import { Issue } from '@/types/issue';
import { useUpdateIssueMutation } from '@/hooks/issues';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface IssueDetailFormProps {
  issue: Issue;
  onSuccess: () => void;
}

export default function IssueDetailForm({
  issue,
  onSuccess,
}: IssueDetailFormProps) {
  const [formData, setFormData] = useState({
    treatment_method: issue.treatment_method || '',
    treatment_time_minutes: issue.treatment_time_minutes || '',
    treatment_result: issue.treatment_result || '',
  });

  const mutation = useUpdateIssueMutation(issue.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mutation.mutateAsync({
        treatment_method: formData.treatment_method as any,
        treatment_time_minutes: formData.treatment_time_minutes
          ? parseInt(formData.treatment_time_minutes)
          : undefined,
        treatment_result: formData.treatment_result || undefined,
      });
      onSuccess();
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">처리 방법</label>
        <select
          value={formData.treatment_method}
          onChange={(e) =>
            setFormData({ ...formData, treatment_method: e.target.value })
          }
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="">선택</option>
          <option value="REMOTE">원격 지원</option>
          <option value="PHONE">전화 지원</option>
          <option value="ONSITE">현장 방문</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">소요 시간 (분)</label>
        <Input
          type="number"
          min="0"
          max="1440"
          value={formData.treatment_time_minutes}
          onChange={(e) =>
            setFormData({ ...formData, treatment_time_minutes: e.target.value })
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">처리 결과</label>
        <textarea
          value={formData.treatment_result}
          onChange={(e) =>
            setFormData({ ...formData, treatment_result: e.target.value })
          }
          className="w-full px-3 py-2 border rounded-md"
          rows={4}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit">저장</Button>
        <Button type="button" variant="outline" onClick={onSuccess}>
          취소
        </Button>
      </div>
    </form>
  );
}
