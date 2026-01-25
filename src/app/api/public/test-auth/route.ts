// Generated: 2026-01-25 14:45:00 KST

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    console.log('[TEST-AUTH] Testing credentials:', { username });

    // Test 1: Database connection
    console.log('[TEST-AUTH] Step 1: Testing database connection...');
    const { getDataSource } = await import('@/lib/db');
    const ds = await getDataSource();

    if (!ds.isInitialized) {
      return NextResponse.json({
        success: false,
        step: 'database',
        message: 'Database not initialized'
      }, { status: 500 });
    }
    console.log('[TEST-AUTH] Database OK');

    // Test 2: Query employee
    console.log('[TEST-AUTH] Step 2: Querying employee...');
    const queryRunner = ds.createQueryRunner();
    try {
      const result = await queryRunner.query(
        `SELECT "id", "name", "username", "password_hash", "role", "department_id"
         FROM EMPLOYEE
         WHERE "username" = :username AND "deleted_at" IS NULL`,
        [username]
      );

      if (!result || result.length === 0) {
        console.log('[TEST-AUTH] Employee not found');
        return NextResponse.json({
          success: false,
          step: 'query',
          message: `Employee not found: ${username}`,
          found: false
        });
      }

      const employee = result[0];
      console.log('[TEST-AUTH] Employee found:', {
        id: employee.id,
        username: employee.username,
        name: employee.name
      });

      // Test 3: Password verification
      console.log('[TEST-AUTH] Step 3: Verifying password...');
      const bcrypt = await import('bcryptjs');
      const isValid = await bcrypt.default.compare(password, employee.password_hash);

      if (!isValid) {
        console.log('[TEST-AUTH] Invalid password');
        return NextResponse.json({
          success: false,
          step: 'password',
          message: 'Invalid password',
          found: true,
          passwordHash: employee.password_hash.substring(0, 20) + '...',
          inputPassword: password
        });
      }

      console.log('[TEST-AUTH] Password valid, login successful');
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        user: {
          id: employee.id,
          username: employee.username,
          name: employee.name,
          role: employee.role
        }
      });
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('[TEST-AUTH] Error:', error);
    return NextResponse.json({
      success: false,
      step: 'error',
      message: String(error),
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
