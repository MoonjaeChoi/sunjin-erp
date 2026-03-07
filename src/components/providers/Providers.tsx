// Generated: 2026-01-24 21:20:00 KST

'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/ui/toaster';
import { makeQueryClient } from '@/lib/query-client';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <SessionProvider basePath="/sunjin/api/auth" refetchOnWindowFocus={true}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  );
}
