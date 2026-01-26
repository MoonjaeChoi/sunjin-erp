// Generated: 2026-01-28 02:00:00 KST

import { Metadata } from 'next';
import { CustomerDetail } from '@/components/features/customers/CustomerDetail';

interface CustomerDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: CustomerDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `고객 상세 - ${id}`,
  };
}

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
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
    <div className="space-y-6">
      <CustomerDetail customerId={customerId} />
    </div>
  );
}
