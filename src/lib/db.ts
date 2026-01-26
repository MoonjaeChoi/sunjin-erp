// Generated: 2026-01-27 16:00:00 KST

// CRITICAL: Load reflect-metadata immediately when this module is imported
require('reflect-metadata');

import { DataSource } from 'typeorm';

let dataSource: any = null;

// Entity list as plain objects - avoid circular imports at module load time
// by using lazy imports only when getDataSource is called
const ENTITY_PATHS = [
  '@/entities/Task',
  '@/entities/Employee',
  '@/entities/Customer',
  '@/entities/TechSupport',
  '@/entities/Project',
  '@/entities/ProjectAttachment',
  '@/entities/Issue',
  '@/entities/IssueAttachment',
  '@/entities/IssueHistory',
  '@/entities/Inventory',
  '@/entities/InventoryHistory',
  '@/entities/MaintenanceContract',
  '@/entities/MaintenanceContractAttachment',
  '@/entities/MaintenanceContractHistory',
];

async function loadEntitiesWithRetry(maxRetries = 3): Promise<any[]> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const entities: any[] = [];

      // Load entities sequentially to avoid parallel decorator evaluation issues
      for (const path of ENTITY_PATHS) {
        try {
          const mod = await import(path);
          const entityName = path.split('/').pop();
          // Find the export - it's usually the capitalized entity name
          const entityConstructor = mod[entityName!] || Object.values(mod)[0];
          if (entityConstructor) {
            entities.push(entityConstructor as any);
          }
        } catch (moduleError) {
          console.warn(`[DB] Failed to load module ${path}:`, moduleError instanceof Error ? moduleError.message : String(moduleError));
          // Continue with other modules rather than failing completely
        }
      }

      if (entities.length > 0) {
        console.log(`[DB] Loaded ${entities.length} entities successfully`);
        return entities;
      } else if (attempt < maxRetries) {
        console.log(`[DB] No entities loaded on attempt ${attempt}/${maxRetries}, retrying...`);
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
    return dataSource;
  } catch (error) {
    console.error('[DB] Error during initialization:', error instanceof Error ? error.message : String(error));

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
