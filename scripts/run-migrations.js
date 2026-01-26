#!/usr/bin/env node
// Generated: 2026-01-27 01:30:00 KST
// Database migration runner for sunjin-erp

const { DataSource } = require('typeorm');
const path = require('path');
const fs = require('fs');

async function runMigrations() {
  console.log('');
  console.log('='.repeat(50));
  console.log('🔄 Database Migration Runner');
  console.log('='.repeat(50));
  console.log('');

  // Validate environment
  if (!process.env.ORACLE_HOST || !process.env.ORACLE_USERNAME || !process.env.ORACLE_PASSWORD) {
    console.error('⚠️  Missing Oracle credentials');
    return false;
  }

  console.log('Configuration:');
  console.log(`  Host: ${process.env.ORACLE_HOST}`);
  console.log(`  User: ${process.env.ORACLE_USERNAME}`);
  console.log('');

  const migrationsDir = path.join(__dirname, '../src/migrations');
  const entitiesDir = path.join(__dirname, '../src/entities');

  const hasMigrations = fs.existsSync(migrationsDir) &&
    fs.readdirSync(migrationsDir).filter(f => f.endsWith('.ts')).length > 0;

  console.log(`Migrations: ${hasMigrations ? '✓ Found' : '✗ Not found'}`);
  console.log('');

  if (!hasMigrations) {
    console.log('⚠️  No migrations found');
    return true;
  }

  try {
    console.log('Initializing DataSource...');
    const appDataSource = new DataSource({
      type: 'oracle',
      host: process.env.ORACLE_HOST,
      port: parseInt(process.env.ORACLE_PORT || '1521'),
      serviceName: process.env.ORACLE_SERVICE_NAME || 'XEPDB1',
      username: process.env.ORACLE_USERNAME,
      password: process.env.ORACLE_PASSWORD,
      entities: [entitiesDir + '/**/*.ts'],
      migrations: [migrationsDir + '/**/*.ts'],
      synchronize: false,
      logging: ['error'],
    });

    await appDataSource.initialize();
    console.log('✓ Connection established');

    console.log('Running migrations...');
    const migrations = await appDataSource.runMigrations();

    if (migrations && migrations.length > 0) {
      console.log(`✓ Executed ${migrations.length} migration(s)`);
    } else {
      console.log('✓ Database is up to date');
    }

    await appDataSource.destroy();
    console.log('✓ Success');
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

runMigrations()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
