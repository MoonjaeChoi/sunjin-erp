'use client';

// Generated: 2026-01-25 22:25:00 KST

import { useRouter } from 'next/navigation';
import IssueCreateForm from '@/components/features/issues/IssueCreateForm';

export default function IssueCreatePageClient() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/issues');
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">신규 장애 등록</h1>
      <IssueCreateForm onSuccess={handleSuccess} />
    </div>
  );
}
