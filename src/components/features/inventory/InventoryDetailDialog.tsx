// Generated: 2026-01-26 18:45:00 KST

'use client';

interface InventoryDetailDialogProps {
  open: boolean;
  inventoryId: number | null;
}

export default function InventoryDetailDialog({ open, inventoryId }: InventoryDetailDialogProps) {
  if (!open) return null;

  return <div className="p-4 text-gray-500">재고 상세정보는 준비 중입니다.</div>;
}
