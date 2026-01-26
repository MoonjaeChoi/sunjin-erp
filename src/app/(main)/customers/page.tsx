// Generated: 2026-01-28 02:00:00 KST

import { Metadata } from 'next';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CustomerList } from '@/components/features/customers/CustomerList';

export const metadata: Metadata = {
  title: '고객 관리',
};

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">고객 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            고객 정보를 조회하고 관리합니다.
          </p>
        </div>
        <Link href="/customers/new" className="sm:flex-shrink-0">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            새 고객 등록
          </Button>
        </Link>
      </div>

      <CustomerList />
    </div>
  );
}
