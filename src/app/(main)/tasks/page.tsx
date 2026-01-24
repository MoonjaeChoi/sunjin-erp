// Generated: 2026-01-25 03:45:00 KST

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TaskSearchClient } from '@/components/features/tasks/TaskSearchClient';

export const metadata: Metadata = {
  title: '업무 검색 - Sunjin ERP',
};

export default function TasksPage() {
  return (
    <Suspense>
      <TaskSearchClient />
    </Suspense>
  );
}
