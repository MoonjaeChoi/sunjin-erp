// Generated: 2026-01-26 18:00:00 KST

const oracledb = require('oracledb');

async function testCreateTable() {
  let conn;
  try {
    console.log('Connecting to Oracle...');
    conn = await oracledb.getConnection({
      user: process.env.ORACLE_USERNAME || 'sunjin_admin',
      password: process.env.ORACLE_PASSWORD || 'sunjin1234',
      connectString: `${process.env.ORACLE_HOST || '192.168.75.194'}:${process.env.ORACLE_PORT || 1521}/${process.env.ORACLE_SERVICE_NAME || 'XEPDB1'}`,
    });
    console.log('✓ Connection successful!');

    // Test CREATE TABLE statement
    console.log('Testing CREATE TABLE...');
    const sql = `CREATE TABLE test_maintenance_contracts (id NUMBER PRIMARY KEY, customer_id NUMBER NOT NULL, contract_name VARCHAR2(255) NOT NULL, contract_type VARCHAR2(100) NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, assigned_employee_id NUMBER NOT NULL, contract_amount NUMBER(15, 2), contract_status VARCHAR2(50) NOT NULL, notes CLOB, created_at DATE NOT NULL, updated_at DATE NOT NULL, created_by_id NUMBER, updated_by_id NUMBER, deleted_at DATE)`;

    console.log('SQL:', sql);
    const result = await conn.execute(sql);
    console.log('✓ Table created successfully!');

    // Clean up
    await conn.execute('DROP TABLE test_maintenance_contracts');
    console.log('✓ Test table dropped');

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error('Error details:', error);
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

testCreateTable();
