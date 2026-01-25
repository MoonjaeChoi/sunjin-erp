'use client';

// Generated: 2026-01-25 22:30:00 KST

import { useIssueDetailQuery } from '@/hooks/issues';
import IssueDetail from '@/components/features/issues/IssueDetail';
import { Skeleton } from '@/components/ui/skeleton';

interface IssueDetailPageClientProps {
  issueId: number;
}

export default function IssueDetailPageClient({ issueId }: IssueDetailPageClientProps) {
  const { data, isLoading, isError } = useIssueDetailQuery(issueId);

  if (isLoading) return <IssueDetailSkeleton />;
  if (isError) return <div>오류가 발생했습니다.</div>;
  
  const detailData = (data as any) || {};
  if (!detailData.data) return <div>데이터를 찾을 수 없습니다.</div>;

  return <IssueDetail issue={detailData.data} />;
}

function IssueDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <Skeleton className="h-8 w-96" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
