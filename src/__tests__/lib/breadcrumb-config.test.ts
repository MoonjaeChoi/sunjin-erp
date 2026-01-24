// Generated: 2026-01-24 22:40:00 KST

import { breadcrumbMap, dynamicSegmentLabels } from '@/lib/breadcrumb-config';

describe('breadcrumbMap', () => {
  it('should have 10 static route entries', () => {
    expect(Object.keys(breadcrumbMap)).toHaveLength(10);
  });

  it('should map /dashboard to 대시보드', () => {
    expect(breadcrumbMap['/dashboard']).toBe('대시보드');
  });

  it('should map /customers to 고객 관리', () => {
    expect(breadcrumbMap['/customers']).toBe('고객 관리');
  });

  it('should map /employees to 직원 관리', () => {
    expect(breadcrumbMap['/employees']).toBe('직원 관리');
  });

  it('should have all module routes', () => {
    const expectedPaths = [
      '/dashboard', '/tasks', '/support', '/projects',
      '/issues', '/inventory', '/maintenance', '/customers',
      '/employees', '/notices',
    ];
    expectedPaths.forEach((path) => {
      expect(breadcrumbMap[path]).toBeDefined();
    });
  });
});

describe('dynamicSegmentLabels', () => {
  it('should map new to 등록', () => {
    expect(dynamicSegmentLabels['new']).toBe('등록');
  });

  it('should map edit to 수정', () => {
    expect(dynamicSegmentLabels['edit']).toBe('수정');
  });

  it('should have exactly 2 entries', () => {
    expect(Object.keys(dynamicSegmentLabels)).toHaveLength(2);
  });
});
