// Generated: 2026-01-27 KST
// TypeORM configuration for migrations
// Note: Entities are excluded to avoid path alias resolution issues

import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'oracle',
  host: process.env.ORACLE_HOST || 'localhost',
  port: Number(process.env.ORACLE_PORT) || 1521,
  serviceName: process.env.ORACLE_SERVICE_NAME || 'FREEPDB1',
  username: process.env.ORACLE_USERNAME || 'sunjin_admin',
  password: process.env.ORACLE_PASSWORD || '',
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: ['error'],
});
