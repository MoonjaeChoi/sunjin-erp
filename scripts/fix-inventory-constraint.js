const oracledb = require('oracledb');

async function fixConstraint() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: 'sunjin_admin',
      password: 'sunjin1234',
      connectionString: '192.168.75.194:1521/XEPDB1'
    });

    console.log('\n🔧 Fixing INVENTORY_STATUS constraint...\n');

    // First, check if there are any invalid values
    console.log('1️⃣ Checking for invalid status values...');
    const checkResult = await connection.execute(
      "SELECT DISTINCT CURRENT_STATUS FROM INVENTORY WHERE CURRENT_STATUS NOT IN ('재고', '출고', '고장', '폐기')"
    );

    if (checkResult.rows.length > 0) {
      console.log(`   ⚠️ Found ${checkResult.rows.length} invalid values, updating to '재고'...`);
      const updateResult = await connection.execute(
        "UPDATE INVENTORY SET CURRENT_STATUS = '재고' WHERE CURRENT_STATUS NOT IN ('재고', '출고', '고장', '폐기')",
        {},
        { autoCommit: true }
      );
      console.log(`   ✓ Updated ${updateResult.rowsAffected} rows`);
    } else {
      console.log('   ✓ All values are valid');
    }

    // Drop the old constraint
    console.log('\n2️⃣ Dropping old CHK_INVENTORY_STATUS constraint...');
    try {
      await connection.execute(
        'ALTER TABLE INVENTORY DROP CONSTRAINT CHK_INVENTORY_STATUS',
        {},
        { autoCommit: true }
      );
      console.log('   ✓ Constraint dropped');
    } catch (err) {
      if (err.message.includes('ORA-02443')) {
        console.log('   ℹ️ Constraint does not exist or already dropped');
      } else {
        throw err;
      }
    }

    // Create new constraint with proper Korean characters
    console.log('\n3️⃣ Creating new CHK_INVENTORY_STATUS constraint...');
    const createConstraintSql = "ALTER TABLE INVENTORY ADD CONSTRAINT CHK_INVENTORY_STATUS CHECK (CURRENT_STATUS IN ('재고', '출고', '고장', '폐기'))";
    
    await connection.execute(
      createConstraintSql,
      {},
      { autoCommit: true }
    );
    console.log('   ✓ Constraint created');

    // Verify
    console.log('\n4️⃣ Verifying constraint...');
    const verifyResult = await connection.execute(
      "SELECT SEARCH_CONDITION FROM USER_CONSTRAINTS WHERE CONSTRAINT_NAME = 'CHK_INVENTORY_STATUS'"
    );

    if (verifyResult.rows.length > 0) {
      console.log(`   ✓ Constraint found: ${verifyResult.rows[0][0]}`);
    }

    console.log('\n✅ Constraint fixed successfully!');

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    if (err.message.includes('ORA-02290')) {
      console.error('   The constraint is still not accepting the values');
    }
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

fixConstraint();
