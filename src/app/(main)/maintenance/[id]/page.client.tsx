// Generated: 2026-01-27 02:20:00 KST

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft, MoreVertical } from 'lucide-react';
import { useMaintenanceContractDetail, useMaintenanceContractMutations } from '@/hooks/useMaintenanceContracts';
import { useExpiryWarning } from '@/hooks/useMaintenanceUtils';
import ContractDetailTabs from '@/components/features/maintenance/ContractDetailTabs';
import UpdateMaintenanceContractForm from '@/components/features/maintenance/UpdateMaintenanceContractForm';
import StatusChangeForm from '@/components/features/maintenance/StatusChangeForm';

interface MaintenanceDetailPageClientProps {
  contractId: number;
}

/**
 * 유지보수 계약 상세 페이지 (Client Component)
 * - 계약 기본 정보 표시
 * - 첨부파일 목록
 * - 변경 이력
 * - 상태 변경, 수정, 삭제 액션
 */
export default function MaintenanceDetailPageClient({
  contractId,
}: MaintenanceDetailPageClientProps) {
  const router = useRouter();
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isStatusChangeFormOpen, setIsStatusChangeFormOpen] = useState(false);

  // 계약 상세 조회
  const { data: detailResponse, isLoading, error, refetch } = useMaintenanceContractDetail(contractId);
  const contract = detailResponse?.data;

  // 뮤테이션
  const { deleteMutation } = useMaintenanceContractMutations();

  // 유틸리티 (React Hook Rules - 조건부가 아닌 항상 호출해야 함)
  const expiryWarning = useExpiryWarning(contract?.end_date || new Date().toISOString());

  // 삭제 처리
  const handleDelete = async () => {
    if (!confirm('이 계약을 삭제하시겠습니까?')) return;

    try {
      await deleteMutation.mutateAsync(contractId);
      router.push('/maintenance');
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-gray-200 rounded-lg animate-pulse" />
        <div className="space-y-4">
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">오류가 발생했습니다: {error.message}</p>
        </div>
        <Link href="/maintenance">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로 돌아가기
          </Button>
        </Link>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <p className="text-sm text-yellow-700">계약을 찾을 수 없습니다.</p>
        </div>
        <Link href="/maintenance">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로 돌아가기
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-600">
        <Link href="/maintenance" className="text-blue-600 hover:underline">
          유지보수 계약
        </Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="text-gray-900 font-medium truncate">{contract.contract_name}</span>
      </nav>

      {/* Header with Status Badge and Action Menu */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{contract.contract_name}</h1>
          <div className="mt-2 flex items-center gap-3">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                contract.contract_status === '활성'
                  ? 'bg-green-100 text-green-800'
                  : contract.contract_status === '종료'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {contract.contract_status}
            </span>
            {expiryWarning && (
              <span
                className={`text-xs font-medium ${
                  expiryWarning.level === 'danger'
                    ? 'text-red-600'
                    : expiryWarning.level === 'warning'
                    ? 'text-yellow-600'
                    : expiryWarning.level === 'soon'
                    ? 'text-orange-600'
                    : 'text-gray-600'
                }`}
              >
                {expiryWarning.message}
              </span>
            )}
          </div>
        </div>

        {/* Action Menu */}
        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowActionMenu(!showActionMenu)}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
          {showActionMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border bg-white shadow-lg z-10">
              <button
                onClick={() => {
                  setShowActionMenu(false);
                  setIsEditFormOpen(true);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                수정
              </button>
              <button
                onClick={() => {
                  setShowActionMenu(false);
                  setIsStatusChangeFormOpen(true);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                상태 변경
              </button>
              <button
                onClick={() => {
                  setShowActionMenu(false);
                  handleDelete();
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expiry Warning Alert */}
      {contract && expiryWarning && expiryWarning.level !== 'safe' && (
        <div
          className={`rounded-lg border p-4 ${
            expiryWarning.level === 'danger'
              ? 'border-red-200 bg-red-50'
              : expiryWarning.level === 'warning'
              ? 'border-yellow-200 bg-yellow-50'
              : 'border-orange-200 bg-orange-50'
          }`}
        >
          <p
            className={`text-sm font-medium ${
              expiryWarning.level === 'danger'
                ? 'text-red-800'
                : expiryWarning.level === 'warning'
                ? 'text-yellow-800'
                : 'text-orange-800'
            }`}
          >
            ⚠️ {expiryWarning.message}
          </p>
        </div>
      )}

      {/* Detail Tabs */}
      <ContractDetailTabs
        contract={contract}
        isLoading={isLoading}
        onEdit={() => router.push(`/maintenance/${contractId}/edit`)}
        onDelete={handleDelete}
        onStatusChange={() => {
          // Status change 액션 (2071_18에서 구현)
          console.log('Status change action - to be implemented in 2071_18');
        }}
      />

      {/* Back Button */}
      <div className="flex justify-start">
        <Link href="/maintenance">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로 돌아가기
          </Button>
        </Link>
      </div>

      {/* Modal Dialogs */}
      {contract && (
        <>
          <UpdateMaintenanceContractForm
            contract={contract}
            open={isEditFormOpen}
            onOpenChange={setIsEditFormOpen}
            onSuccess={() => {
              refetch();
            }}
          />
          <StatusChangeForm
            contract={contract}
            open={isStatusChangeFormOpen}
            onOpenChange={setIsStatusChangeFormOpen}
            onSuccess={() => {
              refetch();
            }}
          />
        </>
      )}
    </div>
  );
}
