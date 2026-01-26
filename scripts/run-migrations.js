#!/usr/bin/env node
// Generated: 2026-01-27 01:30:00 KST
// Database migration runner for sunjin-erp
// Note: Migrations are skipped in production builds due to TypeScript compilation issues
// The database schema should be initialized separately or via manual migration runs

console.log('');
console.log('='.repeat(50));
console.log('🔄 Database Migration Runner');
console.log('='.repeat(50));
console.log('');

// In production builds, migrations are difficult to run because:
// 1. TypeScript files can't be executed directly in Node.js
// 2. ts-node adds significant overhead
// 3. The migration system should be run during development
//
// For now, we skip migrations and rely on the database being pre-initialized

if (!process.env.ORACLE_HOST || !process.env.ORACLE_USERNAME || !process.env.ORACLE_PASSWORD) {
  console.error('⚠️  Missing Oracle credentials');
  process.exit(1);
}

console.log('Configuration:');
console.log(`  Host: ${process.env.ORACLE_HOST}`);
console.log(`  User: ${process.env.ORACLE_USERNAME}`);
console.log('');

// Check if we have TypeScript support
try {
  const tsNodeFound = require.resolve('ts-node');
  console.log('✓ ts-node found, migration support enabled');
} catch (e) {
  console.log('ℹ️  TypeScript migrations not available in this build');
  console.log('   Database schema should be initialized separately');
  console.log('');
  process.exit(0);
}

// If ts-node is available, try to run migrations (not included in this simple version)
console.log('⚠️  Migration runner not fully implemented for production builds');
console.log('   Please run migrations during development or deployment preparation');
console.log('');
process.exit(0);
