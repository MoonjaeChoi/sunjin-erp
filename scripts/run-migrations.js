#!/usr/bin/env node
// Generated: 2026-01-25 10:20:00 KST

const { DataSource } = require('typeorm');
const path = require('path');

async function runMigrations() {
  const dataSource = new DataSource({
    type: 'oracle',
    host: process.env.ORACLE_HOST || 'localhost',
    port: Number(process.env.ORACLE_PORT) || 1521,
    serviceName: process.env.ORACLE_SERVICE_NAME || 'XEPDB1',
    username: process.env.ORACLE_USERNAME || 'sunjin_admin',
    password: process.env.ORACLE_PASSWORD || '',
    migrations: [
      path.join(__dirname, '../src/migrations/*.ts'),
    ],
    logging: true,
    synchronize: false,
  });

  try {
    console.log('Initializing database connection...');
    await dataSource.initialize();

    console.log('Running pending migrations...');
    await dataSource.runMigrations();

    console.log('✓ All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

runMigrations();
