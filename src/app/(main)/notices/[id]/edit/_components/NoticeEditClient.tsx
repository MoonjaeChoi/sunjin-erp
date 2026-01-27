// Generated: 2026-01-28 16:00:00 KST

'use client';

import { useNotice } from '@/hooks/notices';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import NoticeForm from '../../../_components/NoticeForm';

interface NoticeEditClientProps {
  noticeId: number;
}

export default function NoticeEditClient({ noticeId }: NoticeEditClientProps) {
  const { data, isLoading, isError, error } = useNotice(noticeId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-40 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data?.data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive">
            {isError ? (error as Error).message : '게시물을 불러올 수 없습니다'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return <NoticeForm mode="edit" notice={data.data} />;
}
