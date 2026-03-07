#!/usr/bin/env node

// Generated: 2026-01-26 21:00:00 KST
// Script to update kim user's role to MANAGER on staging server

const oracledb = require('oracledb');

async function updateKimRole() {
  let connection;
  try {
    // Use environment variables from .env or command-line
    const config = {
      user: process.env.ORACLE_USERNAME || 'sunjin_admin',
      password: process.env.ORACLE_PASSWORD || 'sunjin_123',
      connectionString: `${process.env.ORACLE_HOST || '192.168.75.194'}:${process.env.ORACLE_PORT || '1521'}/${process.env.ORACLE_SERVICE_NAME || 'FREEPDB1'}`
    };

    console.log('🔐 Connecting to Oracle database...');
    connection = await oracledb.getConnection(config);
    console.log('✓ Connected successfully');

    // Check current role
    console.log('\n📋 Checking current kim user...');
    const checkResult = await connection.execute(
      'SELECT "id", "username", "name", "role" FROM "EMPLOYEE" WHERE "username" = :username',
      { username: 'kim' }
    );

    if (checkResult.rows.length > 0) {
      const [id, username, name, role] = checkResult.rows[0];
      console.log(`   ID: ${id}`);
      console.log(`   Username: ${username}`);
      console.log(`   Name: ${name}`);
      console.log(`   Current role: ${role}`);

      if (role === 'MANAGER') {
        console.log('\n✓ kim already has MANAGER role');
        return;
      }

      // Update role to MANAGER
      console.log('\n🔄 Updating role to MANAGER...');
      const updateResult = await connection.execute(
        'UPDATE "EMPLOYEE" SET "role" = :role WHERE "username" = :username',
        { role: 'MANAGER', username: 'kim' },
        { autoCommit: true }
      );

      console.log(`✅ Updated ${updateResult.rowsAffected} row(s)`);

      // Verify
      console.log('\n✓ Verifying update...');
      const verifyResult = await connection.execute(
        'SELECT "id", "username", "name", "role" FROM "EMPLOYEE" WHERE "username" = :username',
        { username: 'kim' }
      );

      if (verifyResult.rows.length > 0) {
        const [id, username, name, newRole] = verifyResult.rows[0];
        console.log(`   ID: ${id}`);
        console.log(`   Username: ${username}`);
        console.log(`   Name: ${name}`);
        console.log(`   New role: ${newRole}`);

        if (newRole === 'MANAGER') {
          console.log('\n✅ SUCCESS: kim role updated to MANAGER');
        } else {
          console.log(`\n⚠️ WARNING: Role is ${newRole}, expected MANAGER`);
        }
      }
    } else {
      console.log('❌ User kim not found in EMPLOYEE table');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.message.includes('invalid username/password')) {
      console.error('\nPlease check:');
      console.error('- ORACLE_USERNAME environment variable');
      console.error('- ORACLE_PASSWORD environment variable');
      console.error('- Server connection string');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

updateKimRole();
