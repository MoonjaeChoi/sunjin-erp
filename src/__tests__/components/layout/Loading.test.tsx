// Generated: 2026-01-24 22:40:00 KST

import React from 'react';
import { render } from '@testing-library/react';
import Loading from '@/app/(main)/loading';

describe('Loading', () => {
  it('should render skeleton elements', () => {
    const { container } = render(<Loading />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render 5 table row skeletons', () => {
    const { container } = render(<Loading />);
    // Table rows: h-12 w-full skeletons
    const tableRows = container.querySelectorAll('.h-12.w-full');
    expect(tableRows).toHaveLength(5);
  });

  it('should render page title skeleton', () => {
    const { container } = render(<Loading />);
    const titleSkeleton = container.querySelector('.h-8.w-48');
    expect(titleSkeleton).toBeInTheDocument();
  });

  it('should render pagination skeletons', () => {
    const { container } = render(<Loading />);
    const paginationSkeletons = container.querySelectorAll('.h-8.w-8');
    expect(paginationSkeletons).toHaveLength(3);
  });
});
