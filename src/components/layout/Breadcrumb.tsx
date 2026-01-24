// Generated: 2026-01-24 22:20:00 KST

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb as BreadcrumbUI,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useBreadcrumbStore } from '@/stores/breadcrumb-store';
import { buildBreadcrumbs } from '@/lib/breadcrumb-utils';
import { Fragment } from 'react';

export function Breadcrumb() {
  const pathname = usePathname();
  const { dynamicLabels } = useBreadcrumbStore();
  const segments = buildBreadcrumbs(pathname, dynamicLabels);

  if (segments.length === 0) return null;

  return (
    <BreadcrumbUI>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;

          return (
            <Fragment key={segment.path}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={segment.path}>{segment.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </BreadcrumbUI>
  );
}

