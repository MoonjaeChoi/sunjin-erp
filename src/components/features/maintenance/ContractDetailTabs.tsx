// Generated: 2026-01-27 02:15:00 KST

'use client';

import { MaintenanceContractDetail } from '@/types/maintenance';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, History as HistoryIcon } from 'lucide-react';
import { useState } from 'react';
import MaintenanceContractDetailView from './MaintenanceContractDetailView';
import MaintenanceContractAttachments from './MaintenanceContractAttachments';
import MaintenanceContractHistory from './MaintenanceContractHistory';

interface ContractDetailTabsProps {
  contract: MaintenanceContractDetail;
  isLoading?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatusChange?: () => void;
  onAttachmentDelete?: (attachmentId: number) => void;
  onAttachmentUpload?: () => void;
  onAttachmentDownload?: (attachmentId: number, fileName: string) => void;
  onAttachmentsPageChange?: (page: number) => void;
  onHistoryPageChange?: (page: number) => void;
}

/**
 * 계약 상세 탭 컨테이너 컴포넌트
 * - 기본 정보 탭
 * - 첨부파일 탭 (파일 수 배지)
 * - 변경 이력 탭 (이력 수 배지)
 */
export default function ContractDetailTabs({
  contract,
  isLoading = false,
  onEdit,
  onDelete,
  onStatusChange,
  onAttachmentDelete,
  onAttachmentUpload,
  onAttachmentDownload,
  onAttachmentsPageChange,
  onHistoryPageChange,
}: ContractDetailTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const attachmentCount = contract.attachments?.length || 0;
  const historyCount = contract.histories?.length || 0;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview" className="text-xs sm:text-sm">
          기본 정보
        </TabsTrigger>
        <TabsTrigger value="attachments" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">첨부파일</span>
          <span className="sm:hidden">파일</span>
          {attachmentCount > 0 && (
            <Badge variant="secondary" className="ml-0 sm:ml-1 text-xs">
              {attachmentCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
          <HistoryIcon className="h-4 w-4" />
          <span className="hidden sm:inline">변경이력</span>
          <span className="sm:hidden">이력</span>
          {historyCount > 0 && (
            <Badge variant="secondary" className="ml-0 sm:ml-1 text-xs">
              {historyCount}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="mt-6">
        <MaintenanceContractDetailView
          contract={contract}
          isLoading={isLoading}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />
      </TabsContent>

      {/* Attachments Tab */}
      <TabsContent value="attachments" className="mt-6">
        <div className="rounded-lg border bg-white p-6">
          <MaintenanceContractAttachments
            contractId={contract.id}
            attachments={contract.attachments || []}
            isLoading={isLoading}
            onDelete={onAttachmentDelete}
            onUpload={onAttachmentUpload}
            onDownload={onAttachmentDownload}
            onPageChange={onAttachmentsPageChange}
          />
        </div>
      </TabsContent>

      {/* History Tab */}
      <TabsContent value="history" className="mt-6">
        <div className="rounded-lg border bg-white p-6">
          <MaintenanceContractHistory
            contractId={contract.id}
            histories={contract.histories || []}
            isLoading={isLoading}
            onPageChange={onHistoryPageChange}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
