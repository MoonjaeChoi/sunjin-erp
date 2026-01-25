const { DataSource } = require('typeorm');

async function testIssueTable() {
  const dataSource = new DataSource({
    type: 'oracle',
    host: process.env.ORACLE_HOST || '192.168.75.194',
    port: Number(process.env.ORACLE_PORT) || 1521,
    serviceName: process.env.ORACLE_SERVICE_NAME || 'XEPDB1',
    username: process.env.ORACLE_USERNAME || 'sunjin_admin',
    password: process.env.ORACLE_PASSWORD || 'oracle',
    logging: false,
    synchronize: false,
  });

  try {
    console.log('Initializing database connection...');
    await dataSource.initialize();

    console.log('Testing ISSUE table query...');
    const result = await dataSource.query('SELECT COUNT(*) as count FROM ISSUE');
    console.log('✓ ISSUE table exists!');
    console.log('Row count:', result[0]);

    console.log('\nTesting full query with joins...');
    const fullResult = await dataSource.query(`
      SELECT
        "i"."id",
        "i"."title",
        "c"."name" AS customer_name
      FROM ISSUE "i"
      LEFT JOIN CUSTOMER "c" ON "c"."id" = "i"."customer_id" AND "c"."deleted_at" IS NULL
      WHERE "i"."deleted_at" IS NULL
      OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY
    `);
    console.log('✓ Full query works!');
    console.log('Results:', fullResult);

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

testIssueTable();
