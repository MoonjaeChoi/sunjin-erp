// Generated: 2026-01-28 00:30:00 KST

'use client';

import { useState } from 'react';
import { useEmployeeHistory } from '@/hooks/useEmployees';
import { ChangeType, ChangeTypeLabel } from '@/types/employee';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface EmployeeHistoryTabProps {
  employeeId: number;
}

const ChangeTypeBadgeColors: Record<ChangeType, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  DEACTIVATE: 'bg-yellow-100 text-yellow-800',
};

export function EmployeeHistoryTab({ employeeId }: EmployeeHistoryTabProps) {
  const [page, setPage] = useState(1);
  const [changeType, setChangeType] = useState<string>('ALL');

  const { data, isLoading, error } = useEmployeeHistory(employeeId, {
    page,
    limit: 10,
    changeType: changeType !== 'ALL' ? (changeType as ChangeType) : undefined,
  });

  if (error) {
    return (
      <div className="text-red-600 p-4 border border-red-300 rounded-lg">
        오류: {error.message}
      </div>
    );
  }

  const history = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };

  // 변경된 필드 표시
  const renderChangedFields = (fields: Record<string, { before: any; after: any }>) => {
    return Object.entries(fields).map(([key, value]) => (
      <div key={key} className="text-xs text-gray-600">
        <span className="font-medium">{key}:</span>{' '}
        <span className="text-red-500 line-through">{formatValue(value.before)}</span>{' '}
        → <span className="text-green-600">{formatValue(value.after)}</span>
      </div>
    ));
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '(없음)';
    if (typeof value === 'boolean') return value ? '예' : '아니오';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>변경 이력</CardTitle>
        <Select value={changeType} onValueChange={(v) => { setChangeType(v); setPage(1); }}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="유형 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체</SelectItem>
            <SelectItem value="CREATE">생성</SelectItem>
            <SelectItem value="UPDATE">수정</SelectItem>
            <SelectItem value="DEACTIVATE">비활성화</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-center text-gray-500 py-8">변경 이력이 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="border-l-2 border-gray-200 pl-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={ChangeTypeBadgeColors[item.changeType]}>
                    {ChangeTypeLabel[item.changeType]}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {item.changedByName || '시스템'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(item.changedAt).toLocaleString('ko-KR')}
                  </span>
                </div>
                <div className="mt-1">
                  {renderChangedFields(item.changedFields)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <span className="text-sm text-gray-600">
              {pagination.page}/{pagination.totalPages} 페이지
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
