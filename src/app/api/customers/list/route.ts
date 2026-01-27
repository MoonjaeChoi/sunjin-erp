// Generated: 2026-01-27 23:58:00 KST

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery } from '@/lib/db-direct';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = `
      SELECT "id", "name", "category"
      FROM CUSTOMER
      WHERE "deleted_at" IS NULL
      ORDER BY "name" ASC
    `;

    const result = await executeQuery(sql);
    return NextResponse.json({ customers: result.rows });
  } catch (error) {
    console.error('GET /api/customers/list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
