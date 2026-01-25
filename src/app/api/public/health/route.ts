// Generated: 2026-01-25 14:30:00 KST

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    console.log('[HEALTH] Checking database connection...');

    const { getDataSource } = await import('@/lib/db');
    const ds = await getDataSource();

    console.log('[HEALTH] DataSource initialized:', ds.isInitialized);

    if (!ds.isInitialized) {
      return NextResponse.json({
        status: 'error',
        message: 'Database not initialized',
        dataSource: { isInitialized: false }
      }, { status: 500 });
    }

    // Try a simple query
    console.log('[HEALTH] Testing query...');
    const { Employee } = await import('@/entities/Employee');
    const repo = ds.getRepository(Employee);
    const count = await repo.count();

    console.log('[HEALTH] Employee count:', count);

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      employees: count,
      dataSourceInitialized: ds.isInitialized
    });
  } catch (error) {
    console.error('[HEALTH] Error:', error);
    return NextResponse.json({
      status: 'error',
      error: String(error),
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
