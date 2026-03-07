// Generated: 2026-01-27 16:00:00 KST

import { DataSource } from 'typeorm';

let dataSource: any = null;

// Entity list - these will be loaded at runtime
// Using relative paths that work in compiled output
const ENTITY_IMPORTS = {
  Task: () => import('../entities/Task').then(m => m.Task),
  Employee: () => import('../entities/Employee').then(m => m.Employee),
  Customer: () => import('../entities/Customer').then(m => m.Customer),
  TechSupport: () => import('../entities/TechSupport').then(m => m.TechSupport),
  Project: () => import('../entities/Project').then(m => m.Project),
  ProjectAttachment: () => import('../entities/ProjectAttachment').then(m => m.ProjectAttachment),
  Issue: () => import('../entities/Issue').then(m => m.Issue),
  IssueAttachment: () => import('../entities/IssueAttachment').then(m => m.IssueAttachment),
  IssueHistory: () => import('../entities/IssueHistory').then(m => m.IssueHistory),
  Inventory: () => import('../entities/Inventory').then(m => m.Inventory),
  InventoryHistory: () => import('../entities/InventoryHistory').then(m => m.InventoryHistory),
  MaintenanceContract: () => import('../entities/MaintenanceContract').then(m => m.MaintenanceContract),
  MaintenanceContractAttachment: () => import('../entities/MaintenanceContractAttachment').then(m => m.MaintenanceContractAttachment),
  MaintenanceContractHistory: () => import('../entities/MaintenanceContractHistory').then(m => m.MaintenanceContractHistory),
};

async function loadEntitiesWithRetry(maxRetries = 3): Promise<any[]> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const entities: any[] = [];
      const entityNames = Object.keys(ENTITY_IMPORTS);

      // Load entities sequentially to avoid parallel decorator evaluation issues
      for (const entityName of entityNames) {
        try {
          const importFn = ENTITY_IMPORTS[entityName as keyof typeof ENTITY_IMPORTS];
          const entity = await importFn();
          if (entity) {
            entities.push(entity);
          }
        } catch (moduleError) {
          console.warn(`[DB] Failed to load entity ${entityName}:`, moduleError instanceof Error ? moduleError.message : String(moduleError));
          // Continue with other entities rather than failing completely
        }
      }

      if (entities.length > 0) {
        console.log(`[DB] Loaded ${entities.length}/${entityNames.length} entities successfully`);
        return entities;
      } else if (attempt < maxRetries) {
        console.log(`[DB] No entities loaded on attempt ${attempt}/${maxRetries}, retrying in 100ms...`);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`[DB] Attempt ${attempt}/${maxRetries} failed:`, error instanceof Error ? error.message : String(error));
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  throw new Error('Failed to load entities after multiple retries');
}

export async function getDataSource(): Promise<any> {
  // Return cached instance if available
  if (dataSource?.isInitialized) {
    return dataSource;
  }

  try {
    const entities = await loadEntitiesWithRetry();

    dataSource = new DataSource({
      type: 'oracle',
      host: process.env.ORACLE_HOST || 'localhost',
      port: Number(process.env.ORACLE_PORT) || 1521,
      serviceName: process.env.ORACLE_SERVICE_NAME || 'FREEPDB1',
      username: process.env.ORACLE_USERNAME || 'sunjin_admin',
      password: process.env.ORACLE_PASSWORD || '',
      entities: entities,
      migrations: ['src/migrations/*.ts'],
      synchronize: false,
      logging: false,  // Disable logging to reduce verbosity
      extra: {
        charset: 'AL32UTF8',
      },
    });

    try {
      console.log('[DB] About to initialize DataSource...');
      await dataSource.initialize();
      console.log('[DB] TypeORM DataSource initialized successfully');
      return dataSource;
    } catch (initError) {
      console.error('[DB] DataSource.initialize() failed:', initError instanceof Error ? initError.message : String(initError));
      if (initError instanceof Error) {
        console.error('[DB] Error stack:', initError.stack);
      }
      throw initError;
    }
  } catch (error) {
    console.error('[DB] Outer catch - Error during initialization:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('[DB] Full stack:', error.stack);
    }

    // Return a graceful fallback to prevent application crashes
    // The API handlers will detect !isInitialized and return appropriate errors
    dataSource = {
      isInitialized: false,
      initialize: async () => { throw new Error('Not initialized'); },
      createQueryRunner: () => { throw new Error('Not initialized'); },
    };

    return dataSource;
  }
}
