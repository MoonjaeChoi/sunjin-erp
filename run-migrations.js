// Generated: 2026-01-27 KST
// Simple migration runner script

const { DataSource } = require('typeorm');
const path = require('path');

async function runMigrations() {
  const dataSource = new DataSource({
    type: 'oracle',
    host: process.env.ORACLE_HOST || 'localhost',
    port: Number(process.env.ORACLE_PORT) || 1521,
    serviceName: process.env.ORACLE_SERVICE_NAME || 'XEPDB1',
    username: process.env.ORACLE_USERNAME || 'sunjin_admin',
    password: process.env.ORACLE_PASSWORD || '',
    migrations: [
      'src/migrations/1737799500000_create_issue_tables.ts',
      'src/migrations/1737799600000-create-inventory-tables.ts',
      'src/migrations/20260124000000-CreateDepartmentTable.ts',
      'src/migrations/20260124010000-CreateEmployeeTable.ts',
      'src/migrations/20260124230000-CreateTaskTable.ts',
      'src/migrations/20260125051000-CreateCustomerTable.ts',
      'src/migrations/20260125053000-CreateTechSupportTable.ts',
      'src/migrations/20260125083000-CreateProjectTable.ts',
      'src/migrations/20260126000000-CreateMaintenanceContractTable.ts',
      'src/migrations/20260126000001-CreateMaintenanceContractAttachmentTable.ts',
      'src/migrations/20260126000002-CreateMaintenanceContractHistoryTable.ts',
      'src/migrations/20260127230000-UpdateCustomerAndCreateContactHistoryTables.ts',
    ],
    synchronize: false,
    logging: ['error'],
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected');
    
    const migrations = await dataSource.runMigrations();
    console.log(`✅ Executed ${migrations.length} migrations`);
    
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

runMigrations();
