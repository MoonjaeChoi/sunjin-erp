#!/usr/bin/env node

// Generated: 2026-01-26 21:00:00 KST

const oracledb = require('oracledb');

async function checkSchema() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: 'sunjin_admin',
      password: 'sunjin1234',
      connectionString: '192.168.75.194:1521/FREEPDB1'
    });

    // Check table structure
    const result = await connection.execute(
      'SELECT COLUMN_NAME, DATA_TYPE, NULLABLE FROM USER_TAB_COLUMNS WHERE TABLE_NAME = \'EMPLOYEE\' ORDER BY COLUMN_ID'
    );

    console.log('\n📋 EMPLOYEE table columns:');
    result.rows.forEach(row => {
      const nullable = row[2] === 'Y' ? 'NULL' : 'NOT NULL';
      console.log(`  ${row[0]}: ${row[1]} (${nullable})`);
    });

    // Get sample data
    console.log('\n📊 Sample records:');
    const sampleResult = await connection.execute(
      'SELECT * FROM EMPLOYEE WHERE ROWNUM <= 3'
    );

    if (sampleResult.metaData) {
      console.log('Columns:', sampleResult.metaData.map((m, i) => `${i}: ${m.name}`).join(', '));
    }

    sampleResult.rows.forEach((row, idx) => {
      console.log(`Record ${idx + 1}:`, row);
    });

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

checkSchema();
