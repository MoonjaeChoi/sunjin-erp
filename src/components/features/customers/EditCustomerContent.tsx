// Generated: 2026-01-28 04:00:00 KST

'use client';

import { useCustomer } from '@/hooks/useCustomers';
import { CustomerForm } from './CustomerForm';

interface EditCustomerContentProps {
  customerId: number;
}

export function EditCustomerContent({ customerId }: EditCustomerContentProps) {
  const { data: customer, isLoading, error } = useCustomer(customerId);

  if (error) {
    return (
      <div className="text-red-600 p-4 border border-red-300 rounded-lg">
        오류: {error.message}
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">로딩 중...</div>;
  }

  if (!customer) {
    return (
      <div className="text-gray-500 text-center py-8">
        고객을 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">고객 정보 수정</h1>
        <p className="mt-1 text-sm text-gray-500">
          {customer.name} ({customer.code}) 정보를 수정합니다.
        </p>
      </div>

      <CustomerForm customer={customer} />
    </div>
  );
}
