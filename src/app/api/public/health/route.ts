// Generated: 2026-01-25 14:30:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db-direct';

export async function GET(req: NextRequest) {
  try {
    console.log('[HEALTH] Checking database connection...');

    // Test database connection using direct oracledb
    const result = await executeQuery('SELECT 1 as test FROM dual');

    console.log('[HEALTH] Database query successful');

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      queryTest: !!result,
      timestamp: new Date().toISOString()
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
