// Generated: 2026-01-27 14:30:00 KST

// Note: reflect-metadata is loaded in instrumentation.ts to ensure it's available
// before any TypeORM decorators are evaluated. We use dynamic imports below to avoid
// circular dependency issues at build time.

import 'reflect-metadata';
import { DataSource } from 'typeorm';

let dataSource: any = null;
let entityImportsLoaded = false;
let cachedEntities: any[] = [];

async function loadEntities(): Promise<any[]> {
  if (entityImportsLoaded) {
    return cachedEntities;
  }

  try {
    // Dynamically import entities at runtime to avoid circular dependency at build time
    const [
      { Task },
      { Employee },
      { Customer },
      { TechSupport },
      { Project },
      { ProjectAttachment },
      { Issue },
      { IssueAttachment },
      { IssueHistory },
      { Inventory },
      { InventoryHistory },
      { MaintenanceContract },
      { MaintenanceContractAttachment },
      { MaintenanceContractHistory },
    ] = await Promise.all([
      import('@/entities/Task'),
      import('@/entities/Employee'),
      import('@/entities/Customer'),
      import('@/entities/TechSupport'),
      import('@/entities/Project'),
      import('@/entities/ProjectAttachment'),
      import('@/entities/Issue'),
      import('@/entities/IssueAttachment'),
      import('@/entities/IssueHistory'),
      import('@/entities/Inventory'),
      import('@/entities/InventoryHistory'),
      import('@/entities/MaintenanceContract'),
      import('@/entities/MaintenanceContractAttachment'),
      import('@/entities/MaintenanceContractHistory'),
    ]);

    cachedEntities = [
      Task,
      Employee,
      Customer,
      TechSupport,
      Project,
      ProjectAttachment,
      Issue,
      IssueAttachment,
      IssueHistory,
      Inventory,
      InventoryHistory,
      MaintenanceContract,
      MaintenanceContractAttachment,
      MaintenanceContractHistory,
    ];

    entityImportsLoaded = true;
    return cachedEntities;
  } catch (error) {
    console.error('[DB] Failed to load entities:', error);
    throw error;
  }
}

export async function getDataSource(): Promise<any> {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  try {
    const entities = await loadEntities();

    dataSource = new DataSource({
      type: 'oracle',
      host: process.env.ORACLE_HOST || 'localhost',
      port: Number(process.env.ORACLE_PORT) || 1521,
      serviceName: process.env.ORACLE_SERVICE_NAME || 'XEPDB1',
      username: process.env.ORACLE_USERNAME || 'sunjin_admin',
      password: process.env.ORACLE_PASSWORD || '',
      entities: entities,
      migrations: ['src/migrations/*.ts'],
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
      extra: {
        charset: 'AL32UTF8',
        fetchAsString: ['CLOB', 'VARCHAR', 'VARCHAR2', 'CHAR'],
        fetchAsBuffer: ['BLOB'],
        preFetchRowCount: 100,
      },
    });

    await dataSource.initialize();
    console.log('[DB] TypeORM DataSource initialized successfully');
  } catch (error) {
    console.error('[DB] Error during initialization:', error instanceof Error ? error.message : String(error));
    // If initialization fails, create minimal datasource to prevent runtime errors
    if (!dataSource) {
      dataSource = { isInitialized: false };
    }
  }

  return dataSource;
}
