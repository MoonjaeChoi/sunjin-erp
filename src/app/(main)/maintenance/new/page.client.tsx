// Generated: 2026-01-27 01:05:00 KST

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

/**
 * 신규 유지보수 계약 등록 페이지 (Client Component)
 * - 계약 정보 입력 폼
 * - 폼 제출 및 유효성 검사
 * - 이전 페이지로 이동
 */
export default function MaintenanceCreatePageClient() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Form submission logic will be implemented in 2071_17
    // Placeholder for now
    console.log('Form submission - to be implemented in 2071_17');

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center text-sm text-gray-600">
        <Link href="/maintenance" className="text-blue-600 hover:underline">
          유지보수 계약
        </Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="text-gray-900 font-medium">신규 계약 등록</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">신규 계약 등록</h1>
        <p className="mt-1 text-sm text-gray-500">
          새로운 유지보수 계약 정보를 입력합니다.
        </p>
      </div>

      {/* Form - Placeholder for 2071_17 CreateMaintenanceContractForm */}
      <div className="rounded-lg border bg-white p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Placeholder form fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                고객사 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled
                placeholder="고객사 선택 (2071_17에서 구현)"
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-400 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                계약명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled
                placeholder="계약명 입력 (2071_17에서 구현)"
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-400 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                계약 유형 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled
                placeholder="계약 유형 선택 (2071_17에서 구현)"
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-400 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                담당자 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled
                placeholder="담당자 선택 (2071_17에서 구현)"
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-400 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-400 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-400 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                계약금액
              </label>
              <input
                type="number"
                disabled
                placeholder="계약금액 (선택사항)"
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-400 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비고
            </label>
            <textarea
              disabled
              placeholder="추가 설명 (선택사항)"
              rows={4}
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-400 text-sm"
            />
          </div>

          {/* Form Note */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-xs text-blue-700">
              실제 폼 필드 및 유효성 검사는 2071_17 CreateMaintenanceContractForm 컴포넌트에서 구현됩니다.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-6 border-t">
            <Link href="/maintenance">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                취소
              </Button>
            </Link>
            <Button disabled={isSubmitting}>
              {isSubmitting ? '등록 중...' : '계약 등록'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
