// Generated: 2026-01-25 05:25:00 KST

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';
import { Customer } from '@/entities/Customer';
import { IsNull } from 'typeorm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ds = await getDataSource();
    const repo = ds.getRepository(Customer);

    const customers = await repo.find({
      where: { deleted_at: IsNull() },
      select: ['id', 'name', 'category'],
      order: { name: 'ASC' },
    });

    return NextResponse.json({ customers });
  } catch (error) {
    console.error('GET /api/customers/list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
