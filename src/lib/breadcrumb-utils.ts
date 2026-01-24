// Generated: 2026-01-24 22:20:00 KST

import { breadcrumbMap, dynamicSegmentLabels } from '@/lib/breadcrumb-config';

export interface BreadcrumbSegmentData {
  path: string;
  label: string;
}

/**
 * pathname을 분석하여 Breadcrumb 세그먼트 배열 생성
 */
export function buildBreadcrumbs(
  pathname: string,
  dynamicLabels: Record<string, string>
): BreadcrumbSegmentData[] {
  const parts = pathname.split('/').filter(Boolean);
  const segments: BreadcrumbSegmentData[] = [];

  let currentPath = '';

  for (const part of parts) {
    currentPath += `/${part}`;

    // 1. 정적 경로 매핑 확인
    if (breadcrumbMap[currentPath]) {
      segments.push({ path: currentPath, label: breadcrumbMap[currentPath] });
      continue;
    }

    // 2. 공통 동적 세그먼트 (new, edit 등)
    if (dynamicSegmentLabels[part]) {
      segments.push({ path: currentPath, label: dynamicSegmentLabels[part] });
      continue;
    }

    // 3. 동적 세그먼트 resolver 확인
    if (dynamicLabels[currentPath]) {
      segments.push({ path: currentPath, label: dynamicLabels[currentPath] });
      continue;
    }

    // 4. Fallback: 세그먼트 그대로 표시
    segments.push({ path: currentPath, label: part });
  }

  return segments;
}
