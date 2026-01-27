// Generated: 2026-01-28 04:00:00 KST

import { Metadata } from 'next';
import { EditCustomerContent } from '@/components/features/customers/EditCustomerContent';

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

  return <EditCustomerContent customerId={customerId} />;
}
