// Generated: 2026-01-26 19:00:00 KST

const { DataSource } = require('typeorm');
const { Inventory } = require('../src/entities/Inventory');
const { InventoryHistory } = require('../src/entities/InventoryHistory');

const AppDataSource = new DataSource({
  type: 'oracle',
  host: process.env.ORACLE_HOST || 'localhost',
  port: parseInt(process.env.ORACLE_PORT || '1521'),
  serviceName: process.env.ORACLE_SERVICE_NAME || 'FREEPDB1',
  username: process.env.ORACLE_USERNAME || 'sunjin_admin',
  password: process.env.ORACLE_PASSWORD,
  entities: [Inventory, InventoryHistory],
  migrations: ['./src/migrations/*.ts'],
  synchronize: false,
  logging: true,
});

AppDataSource.initialize()
  .then(async () => {
    console.log('Running migrations...');
    await AppDataSource.runMigrations();
    console.log('✅ Migrations completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
