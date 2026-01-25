// Generated: 2026-01-25 20:30:00 KST

// Load reflect-metadata immediately for decorators
try {
  require('reflect-metadata');
} catch (e) {
  console.warn('[DB] Warning: reflect-metadata could not be loaded');
}

let dataSource: any = null;

export async function getDataSource(): Promise<any> {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  try {
    console.log('[DB] Loading TypeORM modules...');

    const { DataSource } = require('typeorm');
    console.log('[DB] DataSource imported via require');

    console.log('[DB] Importing entities...');
    const { Task } = require('@/entities/Task');
    const { Employee } = require('@/entities/Employee');
    const { Customer } = require('@/entities/Customer');
    const { TechSupport } = require('@/entities/TechSupport');
    const { Project } = require('@/entities/Project');
    const { ProjectAttachment } = require('@/entities/ProjectAttachment');
    const { Issue } = require('@/entities/Issue');
    const { IssueAttachment } = require('@/entities/IssueAttachment');
    const { IssueHistory } = require('@/entities/IssueHistory');
    console.log('[DB] Entities loaded');

    console.log('[DB] Creating DataSource...');
    dataSource = new DataSource({
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

    console.log('[DB] Initializing DataSource...');
    await dataSource.initialize();
    console.log('[DB] DataSource initialized successfully');
  } catch (error) {
    console.error('[DB] Error during initialization:', error);
    if (error instanceof Error) {
      console.error('[DB] Error stack:', error.stack);
      console.error('[DB] Error name:', error.name);
      console.error('[DB] Error message:', error.message);
    }
    // If initialization fails (e.g., during build), create minimal datasource
    // to prevent module loading errors
    if (!dataSource) {
      dataSource = { isInitialized: false };
    }
  }

  return dataSource;
}
