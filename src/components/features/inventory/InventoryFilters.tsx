// Generated: 2026-01-26 15:15:00 KST

'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInventoryFilterStore } from '@/stores/inventoryFilterStore';
import { INVENTORY_CATEGORIES, InventoryStatus } from '@/types/inventory';

const INVENTORY_STATUSES: InventoryStatus[] = ['재고', '출고', '고장', '폐기'];

export default function InventoryFilters() {
  const filters = useInventoryFilterStore((state) => state.filters);
  const updateFilter = useInventoryFilterStore((state) => state.updateFilter);
  const clearFilters = useInventoryFilterStore((state) => state.clearFilters);

  const toggleCategory = (category: string) => {
    const updated = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    updateFilter('categories', updated);
  };

  const toggleStatus = (status: InventoryStatus) => {
    const updated = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    updateFilter('statuses', updated);
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
      {/* 검색 */}
      <div>
        <Input
          placeholder="모델명, 시리얼번호, 구매처로 검색..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="w-full"
        />
      </div>

      {/* 위치 필터 */}
      <div>
        <Input
          placeholder="위치로 검색..."
          value={filters.location}
          onChange={(e) => updateFilter('location', e.target.value)}
          className="w-full"
        />
      </div>

      {/* 카테고리 필터 */}
      <div>
        <p className="text-sm font-medium mb-2">카테고리</p>
        <div className="flex flex-wrap gap-2">
          {INVENTORY_CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={filters.categories.includes(category) ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* 상태 필터 */}
      <div>
        <p className="text-sm font-medium mb-2">상태</p>
        <div className="flex flex-wrap gap-2">
          {INVENTORY_STATUSES.map((status) => (
            <Button
              key={status}
              variant={filters.statuses.includes(status) ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleStatus(status)}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* 초기화 */}
      <div>
        <Button variant="outline" onClick={clearFilters} className="w-full">
          필터 초기화
        </Button>
      </div>
    </div>
  );
}
