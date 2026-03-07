// Generated: 2026-01-27 KST
// Simple Oracle direct migration status checker - avoids TypeORM ESM/CommonJS issues

const oracledb = require('oracledb');

async function checkMigrationsStatus() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USERNAME || 'sunjin_admin',
      password: process.env.ORACLE_PASSWORD || '',
      connectionString: `${process.env.ORACLE_HOST || 'localhost'}:${process.env.ORACLE_PORT || 1521}/${process.env.ORACLE_SERVICE_NAME || 'FREEPDB1'}`
    });

    console.log('✅ Connected to Oracle');

    // Check if CUSTOMER table has deleted_at column
    try {
      const result = await connection.execute(`
        SELECT COUNT(*) as cnt FROM user_tab_columns
        WHERE table_name = 'CUSTOMER' AND column_name = 'DELETED_AT'
      `);

      const deletedAtExists = result.rows[0][0] > 0;

      if (deletedAtExists) {
        console.log('✅ CUSTOMER table has DELETED_AT column - Migrations appear to be complete!');
      } else {
        console.log('⚠️  CUSTOMER table missing DELETED_AT column');
        console.log('❌ Migrations have NOT been applied yet');
        console.log('\n📝 To apply migrations, run from development machine:');
        console.log('   export ORACLE_HOST=192.168.75.194');
        console.log('   export ORACLE_PORT=1521');
        console.log('   export ORACLE_SERVICE_NAME=FREEPDB1');
        console.log('   export ORACLE_USERNAME=sunjin_admin');
        console.log('   export ORACLE_PASSWORD=sunjin1234');
        console.log('   npx typeorm migration:run --dataSource ormconfig.ts');
      }
    } catch (e) {
      console.log('⚠️  Cannot query CUSTOMER table');
      console.log('    Table may not exist yet');
    }

    await connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkMigrationsStatus();
