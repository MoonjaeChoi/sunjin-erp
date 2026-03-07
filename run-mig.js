const { DataSource } = require('typeorm');

const appDataSource = new DataSource({
  type: 'oracle',
  host: process.env.ORACLE_HOST || 'localhost',
  port: Number(process.env.ORACLE_PORT) || 1521,
  serviceName: process.env.ORACLE_SERVICE_NAME || 'FREEPDB1',
  username: process.env.ORACLE_USERNAME || 'sunjin_admin',
  password: process.env.ORACLE_PASSWORD || '',
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: ['error'],
});

appDataSource
  .initialize()
  .then(async () => {
    console.log('Database connected');
    const migrations = await appDataSource.runMigrations();
    console.log(`Ran ${migrations.length} migrations successfully`);
    await appDataSource.destroy();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
