// Generated: 2026-01-28 16:00:00 KST

'use client';

import Link from 'next/link';
import { useNotices } from '@/hooks/notices';
import { useNoticeFilterStore } from '@/stores/noticeFilterStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Eye, MessageCircle, Paperclip } from 'lucide-react';
import NoticeFilters from './NoticeFilters';
import NoticePagination from './NoticePagination';
import { NOTICE_TYPE_COLORS, type NoticeType } from '@/types/notice';

interface NoticeListClientProps {
  userRole: string;
}

export default function NoticeListClient({ userRole }: NoticeListClientProps) {
  const { getQueryParams } = useNoticeFilterStore();
  const params = getQueryParams();
  const { data, isLoading, isError, error } = useNotices(params);

  const canCreate = ['MANAGER', 'ADMIN'].includes(userRole);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">공지사항</h1>
          <p className="text-muted-foreground">회사 공지사항 및 게시물을 확인하세요</p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/notices/new">
              <Plus className="h-4 w-4 mr-1" />
              게시물 작성
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <NoticeFilters />

      {/* Content */}
      {isLoading ? (
        <NoticeListSkeleton />
      ) : isError ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{(error as Error).message}</p>
          </CardContent>
        </Card>
      ) : data?.data.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">게시물이 없습니다</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data?.data.map((notice) => (
            <Card key={notice.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <Link href={`/notices/${notice.id}`} className="block">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={NOTICE_TYPE_COLORS[notice.type as NoticeType]}>
                          {notice.type}
                        </Badge>
                        <h3 className="font-medium truncate">{notice.title}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{notice.authorName}</span>
                        <span>{formatDate(notice.createdAt)}</span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {notice.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5" />
                          {notice.commentCount}
                        </span>
                        {notice.attachmentCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Paperclip className="h-3.5 w-3.5" />
                            {notice.attachmentCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <NoticePagination pagination={data.pagination} />
      )}
    </div>
  );
}

function NoticeListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-64" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
