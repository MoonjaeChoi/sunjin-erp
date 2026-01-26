// Generated: 2026-01-26 21:20:00 KST

'use client';

import { useInventoryDetailQuery } from '@/hooks/inventory';
import { useInventoryFilterStore } from '@/stores/inventoryFilterStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import StatusBadge from './StatusBadge';
import InventoryHistory from './InventoryHistory';
import { InventoryStatusLabel } from '@/types/inventory';

export default function InventoryDetailDialog() {
  const isDetailOpen = useInventoryFilterStore((state) => state.isDetailOpen);
  const selectedInventoryId = useInventoryFilterStore((state) => state.selectedInventoryId);
  const setDetailOpen = useInventoryFilterStore((state) => state.setDetailOpen);

  const { data: inventory, isLoading } = useInventoryDetailQuery(selectedInventoryId);

  const handleOpenChange = (open: boolean) => {
    setDetailOpen(open);
  };

  if (!isDetailOpen || !selectedInventoryId) {
    return null;
  }

  return (
    <Dialog open={isDetailOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>재고 상세정보</DialogTitle>
          <DialogDescription>
            {inventory?.category} - {inventory?.model}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !inventory ? (
          <div className="p-4 text-center text-gray-500">재고 정보를 찾을 수 없습니다.</div>
        ) : (
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">기본정보</TabsTrigger>
              <TabsTrigger value="history">변경이력</TabsTrigger>
            </TabsList>

            {/* 기본정보 탭 */}
            <TabsContent value="basic" className="space-y-6 py-4">
              {/* 상태 및 과기 정보 */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 font-medium">현재 상태</p>
                  <div className="mt-2">
                    <StatusBadge status={inventory.current_status} size="md" />
                  </div>
                </div>
                {inventory.isOverdue && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium">과기 상태</p>
                    <div className="mt-2">
                      <Badge className="bg-red-500">
                        과기 ({inventory.overdueDays}일)
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {/* 기본 정보 - 2열 그리드 */}
              <div className="grid grid-cols-2 gap-4">
                {/* 카테고리 */}
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">카테고리</p>
                  <p className="text-sm">{inventory.category}</p>
                </div>

                {/* 모델 */}
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">모델</p>
                  <p className="text-sm">{inventory.model}</p>
                </div>

                {/* 시리얼번호 */}
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">시리얼번호</p>
                  <p className="text-sm font-mono">{inventory.serial_number}</p>
                </div>

                {/* 구매일 */}
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">구매일</p>
                  <p className="text-sm">{new Date(inventory.purchase_date).toLocaleDateString('ko-KR')}</p>
                </div>

                {/* 구매처 */}
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">구매처</p>
                  <p className="text-sm">{inventory.purchase_from}</p>
                </div>

                {/* 현재 위치 */}
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">현재 위치</p>
                  <p className="text-sm">{inventory.current_location}</p>
                </div>
              </div>

              {/* 비고 */}
              {inventory.notes && (
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">비고</p>
                  <p className="text-sm whitespace-pre-wrap">{inventory.notes}</p>
                </div>
              )}

              {/* 구분선 */}
              <hr className="my-4" />

              {/* 감사 정보 - 2열 그리드 */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-3">감사 정보</p>
                <div className="grid grid-cols-2 gap-4">
                  {/* 생성자 */}
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">생성자</p>
                    <p className="text-sm">{inventory.created_by.name}</p>
                    {inventory.created_by.department && (
                      <p className="text-xs text-gray-500">{inventory.created_by.department}</p>
                    )}
                  </div>

                  {/* 생성일 */}
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">생성일</p>
                    <p className="text-sm">
                      {new Date(inventory.created_at).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* 수정자 */}
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">수정자</p>
                    <p className="text-sm">{inventory.updated_by.name}</p>
                    {inventory.updated_by.department && (
                      <p className="text-xs text-gray-500">{inventory.updated_by.department}</p>
                    )}
                  </div>

                  {/* 수정일 */}
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">수정일</p>
                    <p className="text-sm">
                      {new Date(inventory.updated_at).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 변경이력 탭 */}
            <TabsContent value="history" className="py-4">
              {inventory.histories && inventory.histories.length > 0 ? (
                <InventoryHistory histories={inventory.histories} />
              ) : (
                <div className="p-4 text-center text-gray-500">변경 이력이 없습니다.</div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
