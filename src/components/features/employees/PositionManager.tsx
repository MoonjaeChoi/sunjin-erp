// Generated: 2026-01-28 00:30:00 KST

'use client';

import { useState } from 'react';
import { usePositions, useDeletePosition } from '@/hooks/useEmployees';
import { Position } from '@/types/employee';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PositionForm } from './PositionForm';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function PositionManager() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [deletingPosition, setDeletingPosition] = useState<Position | null>(null);

  const { data: positions, isLoading, error } = usePositions();
  const deleteMutation = useDeletePosition();

  const handleEdit = (position: Position) => {
    setEditingPosition(position);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingPosition) return;

    try {
      await deleteMutation.mutateAsync(deletingPosition.id);
      toast.success(`'${deletingPosition.name}' 직급이 삭제되었습니다.`);
      setDeletingPosition(null);
    } catch (error: any) {
      toast.error(error.message || '직급 삭제에 실패했습니다.');
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingPosition(null);
  };

  if (error) {
    return <div className="text-red-600 p-4 border border-red-300 rounded-lg">오류: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">직급 목록</h2>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          새 직급
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : !positions || positions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">직급이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">레벨</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">직급명</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">코드</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position) => (
                    <tr key={position.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="outline">Lv.{position.level}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{position.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">{position.code}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(position)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingPosition(position)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 직급 생성/수정 다이얼로그 */}
      <PositionForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        position={editingPosition}
      />

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deletingPosition} onOpenChange={() => setDeletingPosition(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>직급 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &apos;{deletingPosition?.name}&apos; 직급을 삭제하시겠습니까?
              이 직급을 가진 직원이 있으면 삭제할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
