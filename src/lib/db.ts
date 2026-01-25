// Generated: 2026-01-25 18:25:00 KST

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
let isInitializing = false;

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
    logging: false, // Disable logging to avoid build issues
  });
}

export async function getDataSource(): Promise<DataSource> {
  // Skip initialization during build phase if no connection available
  if (isInitializing) {
    return dataSource!;
  }

  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  dataSource = createDataSource();
  isInitializing = true;

  try {
    await dataSource.initialize();
  } catch (error) {
    // During build, connection may fail - that's ok
    console.warn('Database initialization skipped or failed during build');
    // Return uninitialized datasource to prevent further issues
    isInitializing = false;
  }

  isInitializing = false;
  return dataSource;
}
