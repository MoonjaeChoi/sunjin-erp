// Generated: 2026-01-26 18:00:00 KST

const oracledb = require('oracledb');

async function testConnection() {
  let conn;
  try {
    console.log('Connecting to Oracle...');
    console.log('Host:', process.env.ORACLE_HOST || '192.168.75.194');
    console.log('Port:', process.env.ORACLE_PORT || 1521);
    console.log('Service:', process.env.ORACLE_SERVICE_NAME || 'XEPDB1');
    console.log('User:', process.env.ORACLE_USERNAME || 'sunjin_admin');

    conn = await oracledb.getConnection({
      user: process.env.ORACLE_USERNAME || 'sunjin_admin',
      password: process.env.ORACLE_PASSWORD || 'sunjin1234',
      connectString: `${process.env.ORACLE_HOST || '192.168.75.194'}:${process.env.ORACLE_PORT || 1521}/${process.env.ORACLE_SERVICE_NAME || 'XEPDB1'}`,
    });

    console.log('✓ Connection successful!');

    // Test simple query
    const result = await conn.execute('SELECT 1 as test FROM dual');
    console.log('✓ Query successful:', result.rows);

  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (closeError) {
        console.error('Close error:', closeError.message);
      }
    }
  }
}

testConnection();
