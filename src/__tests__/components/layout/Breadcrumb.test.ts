// Generated: 2026-01-24 22:20:00 KST

import { buildBreadcrumbs } from '@/lib/breadcrumb-utils';

describe('buildBreadcrumbs', () => {
  it('should parse static path correctly', () => {
    const result = buildBreadcrumbs('/customers', {});
    expect(result).toEqual([
      { path: '/customers', label: '고객 관리' },
    ]);
  });

  it('should parse dashboard path', () => {
    const result = buildBreadcrumbs('/dashboard', {});
    expect(result).toEqual([
      { path: '/dashboard', label: '대시보드' },
    ]);
  });

  it('should handle new segment', () => {
    const result = buildBreadcrumbs('/customers/new', {});
    expect(result).toEqual([
      { path: '/customers', label: '고객 관리' },
      { path: '/customers/new', label: '등록' },
    ]);
  });

  it('should handle edit segment', () => {
    const result = buildBreadcrumbs('/customers/123/edit', {});
    expect(result).toEqual([
      { path: '/customers', label: '고객 관리' },
      { path: '/customers/123', label: '123' },
      { path: '/customers/123/edit', label: '수정' },
    ]);
  });

  it('should use dynamic label from store', () => {
    const dynamicLabels = { '/customers/123': '삼성전자' };
    const result = buildBreadcrumbs('/customers/123', dynamicLabels);
    expect(result).toEqual([
      { path: '/customers', label: '고객 관리' },
      { path: '/customers/123', label: '삼성전자' },
    ]);
  });

  it('should fallback to raw segment name for unknown paths', () => {
    const result = buildBreadcrumbs('/customers/456', {});
    expect(result).toEqual([
      { path: '/customers', label: '고객 관리' },
      { path: '/customers/456', label: '456' },
    ]);
  });

  it('should return empty array for root path', () => {
    const result = buildBreadcrumbs('/', {});
    expect(result).toEqual([]);
  });
});
