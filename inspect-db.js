// Generated: 2026-01-27 KST
// Inspect what objects exist in the staging database

const oracledb = require('oracledb');

async function inspectDatabase() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USERNAME || 'sunjin_admin',
      password: process.env.ORACLE_PASSWORD || '',
      connectionString: `${process.env.ORACLE_HOST || 'localhost'}:${process.env.ORACLE_PORT || 1521}/${process.env.ORACLE_SERVICE_NAME || 'XEPDB1'}`
    });

    console.log('=== EXISTING SEQUENCES ===');
    const seqResult = await connection.execute(`
      SELECT sequence_name FROM user_sequences ORDER BY sequence_name
    `);
    if (seqResult.rows.length > 0) {
      seqResult.rows.forEach(row => console.log('  ' + row[0]));
    } else {
      console.log('  (none)');
    }

    console.log('\n=== EXISTING TABLES ===');
    const tableResult = await connection.execute(`
      SELECT table_name FROM user_tables ORDER BY table_name
    `);
    if (tableResult.rows.length > 0) {
      tableResult.rows.forEach(row => console.log('  ' + row[0]));
    } else {
      console.log('  (none)');
    }

    console.log('\n=== CUSTOMER TABLE COLUMNS ===');
    try {
      const colResult = await connection.execute(`
        SELECT column_name, data_type, nullable
        FROM user_tab_columns
        WHERE table_name = 'CUSTOMER'
        ORDER BY column_id
      `);
      if (colResult.rows.length > 0) {
        colResult.rows.forEach(row => {
          console.log(`  ${row[0].padEnd(25)} ${row[1].padEnd(15)} ${row[2]}`);
        });
      } else {
        console.log('  (table not found)');
      }
    } catch (e) {
      console.log('  (cannot query - table may not exist)');
    }

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

inspectDatabase();
