#!/usr/bin/env node

// Generated: 2026-01-26 21:00:00 KST

const oracledb = require('oracledb');

async function checkConstraints() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: 'sunjin_admin',
      password: 'sunjin1234',
      connectionString: '192.168.75.194:1521/XEPDB1'
    });

    console.log('\n📋 INVENTORY Table Definition:\n');

    // Get table columns
    const columnsResult = await connection.execute(
      'SELECT COLUMN_NAME, DATA_TYPE, DATA_DEFAULT, NULLABLE FROM USER_TAB_COLUMNS WHERE TABLE_NAME = \'INVENTORY\' ORDER BY COLUMN_ID'
    );

    columnsResult.rows.forEach(row => {
      const nullable = row[3] === 'Y' ? 'NULL' : 'NOT NULL';
      const defaultVal = row[2] ? ` DEFAULT: ${row[2]}` : '';
      console.log(`  ${row[0]}: ${row[1]} (${nullable})${defaultVal}`);
    });

    // Get constraints
    console.log('\n📋 Constraints:\n');
    const constraintsResult = await connection.execute(
      'SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE, SEARCH_CONDITION FROM USER_CONSTRAINTS WHERE TABLE_NAME = \'INVENTORY\' ORDER BY CONSTRAINT_NAME'
    );

    constraintsResult.rows.forEach(row => {
      const [name, type, condition] = row;
      console.log(`  ${name} (${type})`);
      if (condition) {
        console.log(`    → ${condition}`);
      }
    });

    // Check existing records to see what values are used
    console.log('\n📊 Current CURRENT_STATUS values in DB:\n');
    const statusResult = await connection.execute(
      'SELECT DISTINCT CURRENT_STATUS FROM INVENTORY'
    );

    if (statusResult.rows.length === 0) {
      console.log('  (No records yet)');
    } else {
      statusResult.rows.forEach(row => {
        const val = row[0] || '(empty/null)';
        const len = row[0] ? row[0].length : 0;
        console.log(`  "${val}" (length: ${len}, bytes: ${Buffer.byteLength(val, 'utf8')})`);
      });
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

checkConstraints();
