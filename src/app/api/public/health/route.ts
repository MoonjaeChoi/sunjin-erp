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

    // Try a raw SQL query to test database connection
    console.log('[HEALTH] Testing database query...');
    try {
      const queryRunner = ds.createQueryRunner();
      const result = await queryRunner.query('SELECT 1 as test FROM dual');
      await queryRunner.release();

      console.log('[HEALTH] Database query successful, result:', result);

      return NextResponse.json({
        status: 'ok',
        database: 'connected',
        dataSourceInitialized: ds.isInitialized,
        queryTest: !!result
      });
    } catch (queryError) {
      console.error('[HEALTH] Query error:', queryError);
      throw queryError;
    }
  } catch (error) {
    console.error('[HEALTH] Error:', error);
    return NextResponse.json({
      status: 'error',
      error: String(error),
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
