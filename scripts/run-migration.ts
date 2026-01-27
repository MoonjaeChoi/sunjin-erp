// Generated: 2026-01-28 16:00:00 KST

/**
 * Database Migration Runner
 *
 * Usage: npx tsx scripts/run-migration.ts <migration-file>
 * Example: npx tsx scripts/run-migration.ts 2101_001_create_notice_tables.sql
 */

import * as fs from 'fs';
import * as path from 'path';

async function runMigration(filename: string) {
  const oracledb = require('oracledb');

  const migrationPath = path.join(__dirname, '../src/migrations', filename);

  if (!fs.existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  // Split SQL by semicolons, but handle comments and strings properly
  const statements = sql
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  console.log(`Running migration: ${filename}`);
  console.log(`Found ${statements.length} statements`);

  let connection: any = null;

  try {
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USERNAME || 'sunjin_admin',
      password: process.env.ORACLE_PASSWORD || '',
      connectionString: `${process.env.ORACLE_HOST || 'localhost'}:${process.env.ORACLE_PORT || 1521}/${process.env.ORACLE_SERVICE_NAME || 'XEPDB1'}`,
    });

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;

      console.log(`\n[${i + 1}/${statements.length}] Executing...`);
      console.log(stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''));

      try {
        await connection.execute(stmt);
        console.log('✓ Success');
      } catch (err: any) {
        // ORA-00955: name is already used by an existing object
        if (err.errorNum === 955) {
          console.log('⚠ Already exists, skipping');
        } else {
          console.error(`✗ Error: ${err.message}`);
          throw err;
        }
      }
    }

    await connection.commit();
    console.log('\n✓ Migration completed successfully');

  } catch (err) {
    console.error('\n✗ Migration failed:', err);
    if (connection) {
      await connection.rollback();
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

// Main
const filename = process.argv[2];
if (!filename) {
  console.log('Usage: npx tsx scripts/run-migration.ts <migration-file>');
  console.log('Available migrations:');

  const migrationsDir = path.join(__dirname, '../src/migrations');
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    files.forEach(f => console.log(`  - ${f}`));
  }

  process.exit(1);
}

runMigration(filename);
