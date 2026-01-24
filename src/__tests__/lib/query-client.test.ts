// Generated: 2026-01-24 21:20:00 KST

import { makeQueryClient } from '@/lib/query-client';

describe('makeQueryClient', () => {
  it('should create a QueryClient with 5min staleTime', () => {
    const client = makeQueryClient();
    const defaults = client.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(5 * 60 * 1000);
  });

  it('should not retry on 401 errors', () => {
    const client = makeQueryClient();
    const retry = client.getDefaultOptions().queries?.retry as Function;
    expect(retry(1, { status: 401 })).toBe(false);
  });

  it('should retry up to 3 times on other errors', () => {
    const client = makeQueryClient();
    const retry = client.getDefaultOptions().queries?.retry as Function;
    expect(retry(1, { status: 500 })).toBe(true);
    expect(retry(2, { status: 500 })).toBe(true);
    expect(retry(3, { status: 500 })).toBe(false);
  });
});
