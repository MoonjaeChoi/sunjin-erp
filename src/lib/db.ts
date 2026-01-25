// Generated: 2026-01-25 18:15:00 KST

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Task } from '@/entities/Task';
import { Employee } from '@/entities/Employee';
import { Customer } from '@/entities/Customer';
import { TechSupport } from '@/entities/TechSupport';
import { Project } from '@/entities/Project';
import { ProjectAttachment } from '@/entities/ProjectAttachment';
import { Issue } from '@/entities/Issue';
import { IssueAttachment } from '@/entities/IssueAttachment';
import { IssueHistory } from '@/entities/IssueHistory';

let dataSource: DataSource | null = null;

function createDataSource(): DataSource {
  return new DataSource({
    type: 'oracle',
    host: process.env.ORACLE_HOST || 'localhost',
    port: Number(process.env.ORACLE_PORT) || 1521,
    serviceName: process.env.ORACLE_SERVICE_NAME || 'XEPDB1',
    username: process.env.ORACLE_USERNAME || 'sunjin_admin',
    password: process.env.ORACLE_PASSWORD || '',
    entities: [
      Task,
      Employee,
      Customer,
      TechSupport,
      Project,
      ProjectAttachment,
      Issue,
      IssueAttachment,
      IssueHistory,
    ],
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
  });
}

export async function getDataSource(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  dataSource = createDataSource();

  try {
    await dataSource.initialize();
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    // During build, connection may fail - that's ok
    console.warn('Database initialization warning:', (error as any)?.message);
  }

  return dataSource;
}
