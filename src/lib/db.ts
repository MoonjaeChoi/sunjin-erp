// Generated: 2026-01-25 20:30:00 KST

// Load reflect-metadata immediately for decorators
try {
  require('reflect-metadata');
} catch (e) {
  console.warn('[DB] Warning: reflect-metadata could not be loaded');
}

// Set Oracle character set environment variables for proper UTF-8 handling
if (typeof process !== 'undefined') {
  process.env.NLS_LANG = 'KOREAN_KOREA.AL32UTF8';
}

let dataSource: any = null;

export async function getDataSource(): Promise<any> {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  try {
    const { DataSource } = require('typeorm');
    const { Task } = require('@/entities/Task');
    const { Employee } = require('@/entities/Employee');
    const { Customer } = require('@/entities/Customer');
    const { TechSupport } = require('@/entities/TechSupport');
    const { Project } = require('@/entities/Project');
    const { ProjectAttachment } = require('@/entities/ProjectAttachment');
    const { Issue } = require('@/entities/Issue');
    const { IssueAttachment } = require('@/entities/IssueAttachment');
    const { IssueHistory } = require('@/entities/IssueHistory');
    const { Inventory } = require('@/entities/Inventory');
    const { InventoryHistory } = require('@/entities/InventoryHistory');
    const { MaintenanceContract } = require('@/entities/MaintenanceContract');
    const { MaintenanceContractAttachment } = require('@/entities/MaintenanceContractAttachment');
    const { MaintenanceContractHistory } = require('@/entities/MaintenanceContractHistory');

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
        Inventory,
        InventoryHistory,
        MaintenanceContract,
        MaintenanceContractAttachment,
        MaintenanceContractHistory,
      ],
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
