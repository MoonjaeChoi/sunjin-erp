// Generated: 2026-01-24 21:30:00 KST

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { MainShell } from '@/components/layout/MainShell';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return <MainShell session={session}>{children}</MainShell>;
}
