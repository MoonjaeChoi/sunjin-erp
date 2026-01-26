// Generated: 2026-01-26 15:20:00 KST

'use client';

import { useState } from 'react';
import { InventoryRecord, InventoryDataTableProps } from '@/types/inventory';
import { useInventoryFilterStore } from '@/stores/inventoryFilterStore';
import { InventoryService } from '@/lib/inventory-service';
import StatusBadge from './StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown } from 'lucide-react';

export default function InventoryDataTable({
  data,
  pagination,
  isLoading,
}: InventoryDataTableProps) {
  const setSort = useInventoryFilterStore((state) => state.setSort);
  const setPage = useInventoryFilterStore((state) => state.setPage);
  const setDetailOpen = useInventoryFilterStore((state) => state.setDetailOpen);
  const setSelectedInventoryId = useInventoryFilterStore((state) => state.setSelectedInventoryId);
  const sort = useInventoryFilterStore((state) => state.sort);

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">로딩 중...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="p-4 text-center text-gray-500">재고 데이터가 없습니다.</div>;
  }

  const handleSort = (field: string) => {
    if (sort.sortBy === field) {
      setSort(field, sort.order === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSort(field, 'ASC');
    }
  };

  const handleRowClick = (id: number) => {
    setSelectedInventoryId(id);
    setDetailOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const renderSortIcon = (field: string) => {
    if (sort.sortBy !== field) return <ChevronsUpDown className="w-4 h-4 opacity-30" />;
    const rotateClass = sort.order === 'DESC' ? 'rotate-180' : '';
    return <ChevronsUpDown className={'w-4 h-4 ' + rotateClass} />;
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead
                onClick={() => handleSort('category')}
                className="cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  카테고리 {renderSortIcon('category')}
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort('model')}
                className="cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  모델 {renderSortIcon('model')}
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort('serialNumber')}
                className="cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  시리얼번호 {renderSortIcon('serialNumber')}
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort('location')}
                className="cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  위치 {renderSortIcon('location')}
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort('status')}
                className="cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  상태 {renderSortIcon('status')}
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort('purchaseDate')}
                className="cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  구매일 {renderSortIcon('purchaseDate')}
                </div>
              </TableHead>
              <TableHead>구매처</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item: InventoryRecord) => (
              <TableRow
                key={item.id}
                onClick={() => handleRowClick(item.id)}
                className="cursor-pointer hover:bg-gray-50"
              >
                <TableCell className="font-medium">{item.category}</TableCell>
                <TableCell>{item.model}</TableCell>
                <TableCell className="font-mono text-sm">{item.serial_number}</TableCell>
                <TableCell>{item.current_location}</TableCell>
                <TableCell>
                  <StatusBadge status={item.current_status} size="sm" />
                </TableCell>
                <TableCell>{item.purchase_date}</TableCell>
                <TableCell className="text-sm text-gray-600">{item.purchase_from}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
            disabled={pagination.page === 1}
          >
            이전
          </Button>
          <div className="flex items-center gap-1">
            {[...Array(Math.min(5, pagination.totalPages))].map((_, idx) => {
              const pageNum = idx + 1;
              return (
                <Button
                  key={pageNum}
                  variant={pagination.page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            {pagination.totalPages > 5 && <span className="text-gray-400">...</span>}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
            disabled={pagination.page === pagination.totalPages}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
