// Generated: 2026-01-28 01:30:00 KST

'use client';

import { useState } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import { CustomerListQueryParams, ClassificationLabel, ClassificationColors, CLASSIFICATION_OPTIONS } from '@/types/customer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateCustomerDialog } from './CreateCustomerDialog';
import Link from 'next/link';
import { Plus, ArrowUpDown, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export function CustomerList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [classification, setClassification] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const params: CustomerListQueryParams = {
    page,
    limit: 20,
    search: search || undefined,
    classification: classification && classification !== 'ALL' ? [classification] : undefined,
    sortBy: sortBy as any,
    sortOrder,
  };

  const { data, isLoading, error } = useCustomers(params);

  if (error) {
    return <div className="text-red-600 p-4 border border-red-300 rounded-lg">오류: {error.message}</div>;
  }

  const customers = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">검색</label>
          <Input
            placeholder="고객명 검색..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="w-full md:w-48">
          <label className="block text-sm font-medium mb-1">분류</label>
          <Select value={classification} onValueChange={(v) => { setClassification(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="분류 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              {CLASSIFICATION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button className="gap-2 w-full md:w-auto" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          새 고객
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  <button className="flex items-center gap-1" onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}>
                    고객명
                    {sortBy === 'name' && <ArrowUpDown className="h-4 w-4" />}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">분류</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-medium">담당자</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-medium">연락처</th>
                <th className="px-4 py-3 text-center text-sm font-medium">작업</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    고객이 없습니다.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{customer.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge className={ClassificationColors[customer.classification]}>
                        {ClassificationLabel[customer.classification]}
                      </Badge>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-sm">{customer.managerName || '-'}</td>
                    <td className="hidden md:table-cell px-4 py-3 text-sm">{customer.phone || '-'}</td>
                    <td className="px-4 py-3 text-center text-sm">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/customers/${customer.id}`}>
                          <Button variant="ghost" size="sm">상세</Button>
                        </Link>
                        <Link href={`/customers/${customer.id}/edit`}>
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Edit2 className="h-3 w-3" />
                            수정
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            총 {pagination.total}개 ({pagination.page}/{pagination.totalPages})
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={pagination.page === 1}
              onClick={() => setPage(page - 1)}
            >
              이전
            </Button>
            <Button
              variant="outline"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              다음
            </Button>
          </div>
        </div>
      )}

      {/* Create Customer Dialog */}
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
