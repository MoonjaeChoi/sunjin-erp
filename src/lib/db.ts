// Generated: 2026-01-25 20:30:00 KST

// Lazy load reflect-metadata to avoid circular dependencies at build time
let reflectMetadataLoaded = false;
function ensureReflectMetadata() {
  if (!reflectMetadataLoaded) {
    try {
      require('reflect-metadata');
      reflectMetadataLoaded = true;
    } catch (e) {
      // Ignore during build
    }
  }
}

let dataSource: any = null;

export async function getDataSource(): Promise<any> {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  try {
    // Lazy load everything to avoid circular dependencies
    ensureReflectMetadata();
    console.log('[DB] Loading TypeORM modules...');

    const { DataSource } = await import('typeorm');
    const { Task } = await import('@/entities/Task');
    const { Employee } = await import('@/entities/Employee');
    const { Customer } = await import('@/entities/Customer');
    const { TechSupport } = await import('@/entities/TechSupport');
    const { Project } = await import('@/entities/Project');
    const { ProjectAttachment } = await import('@/entities/ProjectAttachment');
    const { Issue } = await import('@/entities/Issue');
    const { IssueAttachment } = await import('@/entities/IssueAttachment');
    const { IssueHistory } = await import('@/entities/IssueHistory');

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
    // If initialization fails (e.g., during build), create minimal datasource
    // to prevent module loading errors
    if (!dataSource) {
      dataSource = { isInitialized: false };
    }
  }

  return dataSource;
}
