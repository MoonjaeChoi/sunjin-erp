// Generated: 2026-01-24 22:20:00 KST

import { useBreadcrumbStore } from '@/stores/breadcrumb-store';

describe('breadcrumb-store', () => {
  beforeEach(() => {
    useBreadcrumbStore.setState({ dynamicLabels: {} });
  });

  it('should have empty dynamic labels initially', () => {
    const state = useBreadcrumbStore.getState();
    expect(state.dynamicLabels).toEqual({});
  });

  it('should set a dynamic label', () => {
    useBreadcrumbStore.getState().setLabel('/customers/123', '삼성전자');
    const state = useBreadcrumbStore.getState();
    expect(state.dynamicLabels['/customers/123']).toBe('삼성전자');
  });

  it('should set multiple dynamic labels', () => {
    const { setLabel } = useBreadcrumbStore.getState();
    setLabel('/customers/123', '삼성전자');
    setLabel('/customers/456', 'LG전자');
    const state = useBreadcrumbStore.getState();
    expect(state.dynamicLabels['/customers/123']).toBe('삼성전자');
    expect(state.dynamicLabels['/customers/456']).toBe('LG전자');
  });

  it('should clear all labels', () => {
    const { setLabel, clearLabels } = useBreadcrumbStore.getState();
    setLabel('/customers/123', '삼성전자');
    clearLabels();
    const state = useBreadcrumbStore.getState();
    expect(state.dynamicLabels).toEqual({});
  });
});
