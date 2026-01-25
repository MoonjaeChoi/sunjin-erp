'use client';

// Generated: 2026-01-25 22:35:00 KST

import { useUpdateIssueMutation } from '@/hooks/issues';

interface IssuePublicToggleProps {
  issueId: number;
  isPublic: number;
  canEdit: boolean;
}

export default function IssuePublicToggle({
  issueId,
  isPublic,
  canEdit,
}: IssuePublicToggleProps) {
  const updateMutation = useUpdateIssueMutation(issueId);

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked ? 1 : 0;
    updateMutation.mutate({
      is_public: newValue,
    });
  };

  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={isPublic === 1}
        onChange={handleToggle}
        disabled={!canEdit || updateMutation.isPending}
        className="w-4 h-4"
      />
      <span className={canEdit ? 'text-gray-700' : 'text-gray-500'}>
        같은 부서원 조회 가능
      </span>
    </label>
  );
}
