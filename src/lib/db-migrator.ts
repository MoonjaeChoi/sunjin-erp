// Generated: 2026-01-27 01:35:00 KST
// TypeORM DataSource for running migrations
// This file is used with: npx typeorm migration:run --dataSource src/lib/db-migrator.ts

import { DataSource } from 'typeorm';

export const dataSource = new DataSource({
  type: 'oracle',
  host: process.env.ORACLE_HOST || 'localhost',
  port: Number(process.env.ORACLE_PORT) || 1521,
  serviceName: process.env.ORACLE_SERVICE_NAME || 'FREEPDB1',
  username: process.env.ORACLE_USERNAME || 'sunjin_admin',
  password: process.env.ORACLE_PASSWORD || '',
  entities: ['src/entities/*.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: ['error'],
});
