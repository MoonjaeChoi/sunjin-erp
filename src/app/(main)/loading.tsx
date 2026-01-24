// Generated: 2026-01-24 22:30:00 KST

import { Skeleton } from '@/components/ui/skeleton';

/**
 * (main) Route Group 공통 로딩 UI
 *
 * 페이지 전환 시 사이드바/헤더는 유지되고,
 * 콘텐츠 영역만 이 스켈레톤으로 대체됨.
 *
 * 각 모듈에서 필요 시 모듈별 loading.tsx로 재정의 가능.
 *
 * PRD US-8, DT-9 참조
 */
export default function Loading() {
  return (
    <div className="space-y-6">
      {/* 페이지 제목 스켈레톤 */}
      <Skeleton className="h-8 w-48" />

      {/* 필터/액션 영역 스켈레톤 */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24 ml-auto" />
      </div>

      {/* 테이블 헤더 스켈레톤 */}
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />

        {/* 테이블 행 스켈레톤 (5행) */}
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>

      {/* 페이지네이션 스켈레톤 */}
      <div className="flex justify-center gap-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );
}
