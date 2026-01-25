'use client';

// Generated: 2026-01-25 18:05:00 KST

import { IssueHistory } from '@/types/issue';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface IssueHistoryListProps {
  histories: IssueHistory[];
}

const changeTypeLabels: Record<string, string> = {
  STATUS_CHANGE: '상태 변경',
  ASSIGNEE_CHANGE: '담당자 변경',
  SEVERITY_CHANGE: '심각도 변경',
  STATUS_ROLLBACK: '상태 되돌림',
  ATTACHMENT_UPLOADED: '파일 업로드',
  ATTACHMENT_DELETED: '파일 삭제',
  COMMENT_ADDED: '댓글 추가',
};

export default function IssueHistoryList({
  histories,
}: IssueHistoryListProps) {
  if (!histories || histories.length === 0) {
    return <p className="text-gray-500">변경 이력이 없습니다.</p>;
  }

  return (
    <div className="space-y-3">
      {histories.map((history, index) => (
        <div key={index} className="p-3 bg-gray-50 rounded">
          <div className="flex justify-between items-start mb-1">
            <div className="flex gap-2 items-center">
              <span className="font-medium">
                {changeTypeLabels[history.change_type] || history.change_type}
              </span>
              {history.old_value && history.new_value && (
                <span className="text-sm text-gray-600">
                  {history.old_value} → {history.new_value}
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500">
              {format(new Date(history.changed_at), 'yyyy-MM-dd HH:mm', {
                locale: ko,
              })}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            담당자: {history.changed_by?.name || 'Unknown'}
          </p>
          {history.remark && (
            <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
              {history.remark}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
