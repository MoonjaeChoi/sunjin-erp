import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: 'oracle',
  host: process.env.ORACLE_HOST || 'localhost',
  port: Number(process.env.ORACLE_PORT || '1521'),
  serviceName: process.env.ORACLE_SERVICE_NAME || 'XEPDB1',
  username: process.env.ORACLE_USERNAME || 'sunjin_admin',
  password: process.env.ORACLE_PASSWORD || '',
  entities: ['src/entities/*.ts'],
  migrations: ['src/migrations/*.ts'],
  logging: ['error'],
  synchronize: false,
});

async function initDb() {
  try {
    console.log('\n🔄 Connecting to database...');
    await dataSource.initialize();
    console.log('✓ Connected\n');
    
    console.log('Running migrations...');
    const migrations = await dataSource.runMigrations();
    console.log(`✓ Ran ${migrations.length} migration(s)\n`);
    
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

initDb();
