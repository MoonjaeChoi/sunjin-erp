'use client';

// Generated: 2026-01-25 22:50:00 KST

import { IssueHistory } from '@/types/issue';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface IssueHistoryLogProps {
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

const statusLabels: Record<string, string> = {
  INTAKE: '접수',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
};

const severityLabels: Record<string, string> = {
  CRITICAL: '심각',
  HIGH: '높음',
  MEDIUM: '보통',
  LOW: '낮음',
};

function formatChangeContent(
  changeType: string,
  oldValue: string | null,
  newValue: string | null
): string {
  switch (changeType) {
    case 'STATUS_CHANGE':
      return `${statusLabels[oldValue || ''] || oldValue || '미정'} → ${statusLabels[newValue || ''] || newValue || '미정'}`;
    case 'SEVERITY_CHANGE':
      return `${severityLabels[oldValue || ''] || oldValue || '미정'} → ${severityLabels[newValue || ''] || newValue || '미정'}`;
    case 'ASSIGNEE_CHANGE':
      return `${oldValue || '미지정'} → ${newValue || '미지정'}`;
    case 'ATTACHMENT_UPLOADED':
      return `파일: ${newValue || ''}`;
    case 'ATTACHMENT_DELETED':
      return `파일: ${oldValue || ''}`;
    case 'STATUS_ROLLBACK':
      return '진행중으로 되돌림';
    default:
      return oldValue && newValue ? `${oldValue} → ${newValue}` : newValue || oldValue || '-';
  }
}

export default function IssueHistoryLog({
  histories,
}: IssueHistoryLogProps) {
  if (!histories || histories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        변경 이력이 없습니다.
      </div>
    );
  }

  // Sort by changed_at descending (newest first)
  const sortedHistories = [...histories].sort((a, b) => {
    const dateA = new Date(a.changed_at).getTime();
    const dateB = new Date(b.changed_at).getTime();
    return dateB - dateA;
  });

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>시간</TableHead>
            <TableHead>변경 타입</TableHead>
            <TableHead>변경 내용</TableHead>
            <TableHead>변경자</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedHistories.map((history, index) => (
            <TableRow key={index}>
              <TableCell className="whitespace-nowrap">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">
                    {history.changed_at
                      ? format(new Date(history.changed_at), 'yyyy-MM-dd HH:mm:ss', {
                          locale: ko,
                        })
                      : '-'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {history.changed_at
                      ? formatDistanceToNow(new Date(history.changed_at), {
                          addSuffix: true,
                          locale: ko,
                        })
                      : '-'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {changeTypeLabels[history.change_type] || history.change_type}
              </TableCell>
              <TableCell>
                {formatChangeContent(
                  history.change_type,
                  history.old_value,
                  history.new_value
                )}
                {history.remark && (
                  <div className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">
                    ({history.remark})
                  </div>
                )}
              </TableCell>
              <TableCell>{history.changed_by?.name || 'Unknown'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
