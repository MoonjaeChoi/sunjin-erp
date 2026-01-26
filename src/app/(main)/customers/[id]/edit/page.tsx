// Generated: 2026-01-28 02:00:00 KST

import { Metadata } from 'next';
import { useRouter } from 'next/navigation';
import { useCustomer } from '@/hooks/useCustomers';
import { CustomerForm } from '@/components/features/customers/CustomerForm';

interface EditCustomerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: EditCustomerPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `고객 수정 - ${id}`,
  };
}

// Client component wrapper to fetch customer data
import { Suspense } from 'react';

function EditCustomerContent({ customerId }: { customerId: number }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">고객 정보 수정</h1>
        <p className="mt-1 text-sm text-gray-500">
          고객 정보를 수정합니다.
        </p>
      </div>

      <CustomerForm />
    </div>
  );
}

export default async function EditCustomerPage({
  params,
}: EditCustomerPageProps) {
  const { id } = await params;
  const customerId = parseInt(id, 10);

  if (isNaN(customerId)) {
    return (
      <div className="text-red-600 p-4 border border-red-300 rounded-lg">
        유효하지 않은 고객 ID입니다.
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="text-center py-8">로딩 중...</div>}>
      <EditCustomerContent customerId={customerId} />
    </Suspense>
  );
}
