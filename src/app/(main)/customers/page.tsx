// Generated: 2026-01-28 02:00:00 KST

'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerList } from '@/components/features/customers/CustomerList';
import { CreateCustomerDialog } from '@/components/features/customers/CreateCustomerDialog';
import { toast } from 'sonner';

export default function CustomersPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">고객 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            고객 정보를 조회하고 관리합니다.
          </p>
        </div>
        <Button
          className="gap-2 w-full sm:w-auto sm:flex-shrink-0"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          새 고객 등록
        </Button>
      </div>

      <CustomerList />

      {/* Create Customer Dialog for header button */}
      <CreateCustomerDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          toast.success('고객이 등록되었습니다.');
        }}
      />
    </div>
  );
}
