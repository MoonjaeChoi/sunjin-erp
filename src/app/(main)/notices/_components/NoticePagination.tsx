// Generated: 2026-01-28 16:00:00 KST

'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useNoticeFilterStore } from '@/stores/noticeFilterStore';

interface NoticePaginationProps {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function NoticePagination({ pagination }: NoticePaginationProps) {
  const { setPage } = useNoticeFilterStore();
  const { page, totalPages, total } = pagination;

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  // Calculate page range to show (5 pages at a time)
  const getPageRange = () => {
    const range: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    const adjustedStart = Math.max(1, end - 4);

    for (let i = adjustedStart; i <= end; i++) {
      range.push(i);
    }
    return range;
  };

  const pageRange = getPageRange();

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        전체 {total}개 중 {(page - 1) * pagination.pageSize + 1}-
        {Math.min(page * pagination.pageSize, total)}개
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setPage(1)}
          disabled={!canGoPrev}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setPage(page - 1)}
          disabled={!canGoPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pageRange.map((p) => (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="icon"
            onClick={() => setPage(p)}
          >
            {p}
          </Button>
        ))}

        <Button
          variant="outline"
          size="icon"
          onClick={() => setPage(page + 1)}
          disabled={!canGoNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setPage(totalPages)}
          disabled={!canGoNext}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
