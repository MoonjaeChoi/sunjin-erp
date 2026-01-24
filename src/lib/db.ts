// Generated: 2026-01-24 23:30:00 KST

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Task } from '@/entities/Task';
import { Employee } from '@/entities/Employee';
import { Customer } from '@/entities/Customer';
import { TechSupport } from '@/entities/TechSupport';

let dataSource: DataSource | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  dataSource = new DataSource({
    type: 'oracle',
    host: process.env.ORACLE_HOST || 'localhost',
    port: Number(process.env.ORACLE_PORT) || 1521,
    serviceName: process.env.ORACLE_SERVICE_NAME || 'XEPDB1',
    username: process.env.ORACLE_USERNAME || 'sunjin_admin',
    password: process.env.ORACLE_PASSWORD || '',
    entities: [Task, Employee, Customer, TechSupport],
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
  });

  await dataSource.initialize();
  return dataSource;
}
