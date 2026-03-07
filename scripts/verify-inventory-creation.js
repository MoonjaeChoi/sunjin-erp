#!/usr/bin/env node

// Generated: 2026-01-26 21:00:00 KST

const oracledb = require('oracledb');

async function verifyCreation() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: 'sunjin_admin',
      password: 'sunjin1234',
      connectionString: '192.168.75.194:1521/FREEPDB1'
    });

    console.log('\n📊 Verifying inventory creation...\n');

    // Get latest records
    const result = await connection.execute(
      'SELECT ID, CATEGORY, MODEL, SERIAL_NUMBER, CURRENT_STATUS, CREATED_BY_ID, CREATED_AT FROM INVENTORY ORDER BY CREATED_AT DESC FETCH FIRST 5 ROWS ONLY'
    );

    if (result.rows.length === 0) {
      console.log('❌ No records found');
      return;
    }

    console.log(`✅ Found ${result.rows.length} latest inventory records:\n`);

    result.rows.forEach((row, idx) => {
      const [id, category, model, serial, status, createdById, createdAt] = row;
      console.log(`${idx + 1}. ID: ${id}`);
      console.log(`   Category: ${category}`);
      console.log(`   Model: ${model}`);
      console.log(`   Serial: ${serial}`);
      console.log(`   Status: ${status}`);
      console.log(`   Created By: ${createdById} (kim = 1)`);
      console.log(`   Created At: ${createdAt}`);
      console.log('');
    });

    // Count total
    const countResult = await connection.execute(
      'SELECT COUNT(*) FROM INVENTORY WHERE DELETED_AT IS NULL'
    );

    console.log(`📈 Total active records: ${countResult.rows[0][0]}`);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

verifyCreation();
