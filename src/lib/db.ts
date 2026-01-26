// Generated: 2026-01-27 15:45:00 KST

// CRITICAL: Load reflect-metadata immediately when this module is imported
// This must be before any TypeORM entity is imported or evaluated
require('reflect-metadata');

// Only import entities at runtime to avoid build-time circular dependencies
import { DataSource } from 'typeorm';

let dataSource: any = null;
let entitiesLoaded = false;
let cachedEntities: any[] = [];

async function ensureEntitiesLoaded(): Promise<any[]> {
  if (entitiesLoaded && cachedEntities.length > 0) {
    return cachedEntities;
  }

  try {
    // Delay entity import until runtime to avoid build-time circular dependencies
    // This ensures reflect-metadata is fully loaded before decorators are evaluated
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

    entitiesLoaded = true;
    return cachedEntities;
  } catch (error) {
    console.error('[DB] Failed to load entities:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function getDataSource(): Promise<any> {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  try {
    const entities = await ensureEntitiesLoaded();

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
    // If initialization fails (e.g., during build), create minimal datasource
    // to prevent module loading errors
    if (!dataSource) {
      dataSource = { isInitialized: false };
    }
  }

  return dataSource;
}
