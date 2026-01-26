// Generated: 2026-01-28 01:45:00 KST

'use client';

import { useState, useRef, useEffect } from 'react';
import { useCustomerSearch } from '@/hooks/useCustomers';
import { CustomerListItem, ClassificationLabel, ClassificationColors } from '@/types/customer';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';

interface CustomerSearchProps {
  onSelect: (customer: CustomerListItem) => void;
  onAddNew?: () => void;
  placeholder?: string;
}

export function CustomerSearch({ onSelect, onAddNew, placeholder = '고객 검색...' }: CustomerSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: results, isLoading } = useCustomerSearch(query, 10);
  const displayResults = results || [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (customer: CustomerListItem) => {
    onSelect(customer);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="pl-10"
        />
      </div>

      {open && query && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border bg-white shadow-lg"
        >
          {isLoading ? (
            <div className="px-4 py-8 text-center text-gray-500">검색 중...</div>
          ) : displayResults.length === 0 ? (
            <div className="px-4 py-8 space-y-3">
              <div className="text-center text-sm text-gray-500">검색 결과가 없습니다.</div>
              {onAddNew && (
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={onAddNew}>
                  <Plus className="h-4 w-4" />
                  새 고객 추가
                </Button>
              )}
            </div>
          ) : (
            <ul className="space-y-0">
              {displayResults.map((customer) => (
                <li key={customer.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(customer)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{customer.name}</div>
                        <div className="text-xs text-gray-500">{customer.code}</div>
                      </div>
                      <Badge className={ClassificationColors[customer.classification]}>
                        {ClassificationLabel[customer.classification]}
                      </Badge>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
