// Generated: 2026-01-28 16:00:00 KST

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, X } from 'lucide-react';
import { useNoticeFilterStore } from '@/stores/noticeFilterStore';
import { NOTICE_TYPES, type NoticeType, type NoticeSortBy } from '@/types/notice';

export default function NoticeFilters() {
  const {
    type,
    search,
    sortBy,
    setType,
    setSearch,
    setSortBy,
    reset,
  } = useNoticeFilterStore();

  // Local search state for debounce
  const [searchInput, setSearchInput] = useState(search);

  // Sync local state with store
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, search, setSearch]);

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
  };

  const handleReset = () => {
    setSearchInput('');
    reset();
  };

  const hasActiveFilters = type !== 'all' || search !== '' || sortBy !== 'latest';

  return (
    <div className="space-y-4">
      {/* Type Tabs */}
      <Tabs value={type} onValueChange={(value) => setType(value as NoticeType | 'all')}>
        <TabsList>
          <TabsTrigger value="all">전체</TabsTrigger>
          {NOTICE_TYPES.map((t) => (
            <TabsTrigger key={t} value={t}>
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search and Sort */}
      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="제목 또는 내용 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as NoticeSortBy)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="정렬" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">최신순</SelectItem>
            <SelectItem value="viewCount">조회순</SelectItem>
            <SelectItem value="commentCount">댓글순</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Button */}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={handleReset}>
            <X className="h-4 w-4 mr-1" />
            필터 초기화
          </Button>
        )}
      </div>
    </div>
  );
}
