// Generated: 2026-01-27 23:45:00 KST
// Production migration runner - uses compiled JavaScript migrations

const { DataSource } = require('typeorm');
const path = require('path');
const fs = require('fs');

async function runMigrations() {
  console.log('');
  console.log('='.repeat(50));
  console.log('🔄 Database Migration Runner');
  console.log('='.repeat(50));
  console.log('');

  // Validate environment
  if (!process.env.ORACLE_HOST || !process.env.ORACLE_USERNAME || !process.env.ORACLE_PASSWORD) {
    console.error('❌ Missing Oracle credentials');
    console.error('   Required: ORACLE_HOST, ORACLE_USERNAME, ORACLE_PASSWORD');
    process.exit(1);
  }

  console.log('Configuration:');
  console.log(`  Host: ${process.env.ORACLE_HOST}`);
  console.log(`  Port: ${process.env.ORACLE_PORT || 1521}`);
  console.log(`  Service: ${process.env.ORACLE_SERVICE_NAME || 'FREEPDB1'}`);
  console.log(`  User: ${process.env.ORACLE_USERNAME}`);
  console.log('');

  // Determine migration path based on environment
  // In production (Docker), use compiled JS; in development, use TS
  let migrationsPath = path.join(__dirname, 'dist', 'migrations', '*.js');

  if (!fs.existsSync(path.join(__dirname, 'dist', 'migrations'))) {
    // Fallback to TypeScript files for development
    migrationsPath = path.join(__dirname, 'src', 'migrations', '*.ts');
    console.log('ℹ️  Using TypeScript migrations (development mode)');
  } else {
    console.log('ℹ️  Using compiled JavaScript migrations (production mode)');
  }

  const dataSource = new DataSource({
    type: 'oracle',
    host: process.env.ORACLE_HOST || 'localhost',
    port: Number(process.env.ORACLE_PORT) || 1521,
    serviceName: process.env.ORACLE_SERVICE_NAME || 'FREEPDB1',
    username: process.env.ORACLE_USERNAME || 'sunjin_admin',
    password: process.env.ORACLE_PASSWORD || '',
    migrations: [migrationsPath],
    migrationsTableName: 'typeorm_migrations',
    synchronize: false,
    logging: ['error', 'warn', 'migration'],
  });

  try {
    console.log('📡 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connected');
    console.log('');

    console.log('🔍 Checking pending migrations...');
    const pendingMigrations = await dataSource.showMigrations();

    if (pendingMigrations) {
      console.log('📋 Running migrations...');
      const executedMigrations = await dataSource.runMigrations();
      console.log(`✅ Executed ${executedMigrations.length} migration(s)`);

      if (executedMigrations.length > 0) {
        executedMigrations.forEach((m, i) => {
          console.log(`   ${i + 1}. ${m.name}`);
        });
      }
    } else {
      console.log('✅ No pending migrations');
    }

    console.log('');
    await dataSource.destroy();
    console.log('✅ Migration complete');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Migration error:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    console.error('');
    process.exit(1);
  }
}

runMigrations();
