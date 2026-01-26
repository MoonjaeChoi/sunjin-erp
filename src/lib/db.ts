// Generated: 2026-01-27 15:00:00 KST

// CRITICAL: Load reflect-metadata FIRST before any other imports
// This must be at the absolute top of the file, before any other module loads
require('reflect-metadata');

import { DataSource } from 'typeorm';

let dataSource: any = null;
let entityImportsLoaded = false;
let cachedEntities: any[] = [];

async function loadEntities(): Promise<any[]> {
  if (entityImportsLoaded) {
    return cachedEntities;
  }

  try {
    // Dynamically import entities at runtime
    // reflect-metadata has already been loaded by require() at module top
    const Task = await import('@/entities/Task').then(m => m.Task);
    const Employee = await import('@/entities/Employee').then(m => m.Employee);
    const Customer = await import('@/entities/Customer').then(m => m.Customer);
    const TechSupport = await import('@/entities/TechSupport').then(m => m.TechSupport);
    const Project = await import('@/entities/Project').then(m => m.Project);
    const ProjectAttachment = await import('@/entities/ProjectAttachment').then(m => m.ProjectAttachment);
    const Issue = await import('@/entities/Issue').then(m => m.Issue);
    const IssueAttachment = await import('@/entities/IssueAttachment').then(m => m.IssueAttachment);
    const IssueHistory = await import('@/entities/IssueHistory').then(m => m.IssueHistory);
    const Inventory = await import('@/entities/Inventory').then(m => m.Inventory);
    const InventoryHistory = await import('@/entities/InventoryHistory').then(m => m.InventoryHistory);
    const MaintenanceContract = await import('@/entities/MaintenanceContract').then(m => m.MaintenanceContract);
    const MaintenanceContractAttachment = await import('@/entities/MaintenanceContractAttachment').then(m => m.MaintenanceContractAttachment);
    const MaintenanceContractHistory = await import('@/entities/MaintenanceContractHistory').then(m => m.MaintenanceContractHistory);

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
    console.log('[DB] Entities loaded successfully');
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
