// Generated: 2026-01-26 15:25:00 KST

'use client';

import { useInventoryDetailQuery } from '@/hooks/inventory';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryService } from '@/lib/inventory-service';
import StatusBadge from './StatusBadge';

interface InventoryDetailDialogProps {
  open: boolean;
  inventoryId: number | null;
}

export default function InventoryDetailDialog({ open, inventoryId }: InventoryDetailDialogProps) {
  const { data: inventory, isLoading } = useInventoryDetailQuery(inventoryId);

  if (!inventory) return null;

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>재고 상세정보</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="p-4 text-center text-gray-500">로딩 중...</div>
        ) : (
          <Tabs defaultValue="detail" className="w-full">
            <TabsList>
              <TabsTrigger value="detail">기본정보</TabsTrigger>
              <TabsTrigger value="history">변경이력</TabsTrigger>
            </TabsList>

            <TabsContent value="detail" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">ID</p>
                  <p className="text-lg">{inventory.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">카테고리</p>
                  <p className="text-lg">{inventory.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">모델</p>
                  <p className="text-lg">{inventory.model}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">시리얼번호</p>
                  <p className="font-mono text-sm">{inventory.serial_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">현재위치</p>
                  <p className="text-lg">{inventory.current_location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">상태</p>
                  <StatusBadge status={inventory.current_status} size="md" />
                  {inventory.isOverdue && (
                    <p className="text-xs text-red-600 mt-1">과기: {inventory.overdueDays}일</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">구매일</p>
                  <p className="text-lg">{inventory.purchase_date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">구매처</p>
                  <p className="text-lg">{inventory.purchase_from}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-600">비고</p>
                  <p className="text-lg">{inventory.notes || '-'}</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-600">등록자</p>
                  <p className="text-sm">{inventory.created_by.name} ({inventory.created_by.department || '-'})</p>
                  <p className="text-xs text-gray-500">{inventory.created_at}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">수정자</p>
                  <p className="text-sm">{inventory.updated_by.name} ({inventory.updated_by.department || '-'})</p>
                  <p className="text-xs text-gray-500">{inventory.updated_at}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="space-y-3">
                {inventory.histories && inventory.histories.length > 0 ? (
                  inventory.histories.map((history) => (
                    <div key={history.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium">{InventoryService.formatChangeTypeForDisplay(history.change_type)}</p>
                        <p className="text-xs text-gray-500">{history.changed_at}</p>
                      </div>
                      <div className="text-sm space-y-1">
                        {history.previous_status && history.new_status && (
                          <p>상태: <span className="text-gray-600">{history.previous_status} → {history.new_status}</span></p>
                        )}
                        {history.previous_location && history.new_location && (
                          <p>위치: <span className="text-gray-600">{history.previous_location} → {history.new_location}</span></p>
                        )}
                        {history.checkout_location && (
                          <p>사용처: <span className="text-gray-600">{history.checkout_location}</span></p>
                        )}
                        {history.expected_checkin_date && (
                          <p>반납예정일: <span className="text-gray-600">{history.expected_checkin_date}</span></p>
                        )}
                        {history.reason && (
                          <p>사유: <span className="text-gray-600">{history.reason}</span></p>
                        )}
                        <p className="text-xs text-gray-500">변경자: {history.changed_by.name}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">변경이력이 없습니다.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
