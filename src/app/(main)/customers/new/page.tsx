// Generated: 2026-01-28 02:00:00 KST

import { Metadata } from 'next';
import { CustomerForm } from '@/components/features/customers/CustomerForm';

export const metadata: Metadata = {
  title: '새 고객 등록',
};

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">새 고객 등록</h1>
        <p className="mt-1 text-sm text-gray-500">
          새로운 고객을 시스템에 등록합니다.
        </p>
      </div>

      <CustomerForm />
    </div>
  );
}
