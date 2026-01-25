// Generated: 2026-01-26 09:50:00 KST

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ds = await getDataSource();
    const queryRunner = ds.createQueryRunner();

    try {
      const sql = `
        SELECT "id", "name", "category"
        FROM CUSTOMER
        WHERE "deleted_at" IS NULL
        ORDER BY "name" ASC
      `;

      const customers = await queryRunner.query(sql);

      return NextResponse.json({ customers });
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('GET /api/customers/list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
