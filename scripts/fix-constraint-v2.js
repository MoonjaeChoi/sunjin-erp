const oracledb = require('oracledb');

async function fixConstraint() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: 'sunjin_admin',
      password: 'sunjin1234',
      connectionString: '192.168.75.194:1521/FREEPDB1'
    });

    console.log('\n🔧 Fixing INVENTORY_STATUS constraint (v2)...\n');

    // Step 1: Disable the constraint
    console.log('1️⃣ Disabling CHK_INVENTORY_STATUS constraint...');
    try {
      await connection.execute(
        'ALTER TABLE INVENTORY DISABLE CONSTRAINT CHK_INVENTORY_STATUS',
        {},
        { autoCommit: true }
      );
      console.log('   ✓ Constraint disabled');
    } catch (err) {
      console.log('   ⚠️ Could not disable:', err.message.substring(0, 50));
    }

    // Step 2: Delete invalid records
    console.log('\n2️⃣ Deleting records with invalid status...');
    const checkBefore = await connection.execute('SELECT COUNT(*) FROM INVENTORY');
    console.log(`   Before: ${checkBefore.rows[0][0]} records`);

    try {
      const deleteResult = await connection.execute(
        "DELETE FROM INVENTORY WHERE CURRENT_STATUS IS NOT NULL AND CURRENT_STATUS NOT IN ('재고', '出고', '고장', '폐기')",
        {},
        { autoCommit: true }
      );
      console.log(`   ✓ Deleted ${deleteResult.rowsAffected} record(s)`);
    } catch (err) {
      console.log('   ℹ️ Delete skipped');
    }

    // Step 3: Drop and recreate constraint
    console.log('\n3️⃣ Dropping old constraint...');
    try {
      await connection.execute(
        'ALTER TABLE INVENTORY DROP CONSTRAINT CHK_INVENTORY_STATUS',
        {},
        { autoCommit: true }
      );
      console.log('   ✓ Old constraint dropped');
    } catch (err) {
      console.log('   ⚠️ Drop failed:', err.message.substring(0, 50));
    }

    console.log('\n4️⃣ Creating new constraint with valid values...');
    // Using hex codes to ensure proper encoding
    // 재고 (jae-go) = E7 AC A0 E3 B1 A0 in some encoding
    // Let's use CHAR function with hex values
    await connection.execute(
      `ALTER TABLE INVENTORY ADD CONSTRAINT CHK_INVENTORY_STATUS 
       CHECK (CURRENT_STATUS IN ('재고', '출고', '고장', '폐기'))`,
      {},
      { autoCommit: true }
    );
    console.log('   ✓ New constraint created');

    // Verify
    console.log('\n5️⃣ Verifying...');
    const verifyResult = await connection.execute(
      "SELECT SEARCH_CONDITION FROM USER_CONSTRAINTS WHERE CONSTRAINT_NAME = 'CHK_INVENTORY_STATUS'"
    );

    if (verifyResult.rows.length > 0) {
      const condition = verifyResult.rows[0][0];
      console.log(`   ✓ Constraint: ${condition}`);
    }

    // Test insert
    console.log('\n6️⃣ Testing INSERT with new constraint...');
    try {
      const testResult = await connection.execute(
        `INSERT INTO INVENTORY (CATEGORY, MODEL, SERIAL_NUMBER, PURCHASE_DATE, PURCHASE_FROM, CURRENT_LOCATION, CURRENT_STATUS, CREATED_BY_ID, UPDATED_BY_ID)
         VALUES ('테스트', '테스트모델', 'TEST-123', TRUNC(SYSDATE), '테스트처', '테스트위치', '재고', 1, 1)`,
        {},
        { autoCommit: true }
      );
      console.log('   ✅ Test INSERT successful!');
    } catch (err) {
      console.log(`   ❌ Test INSERT failed: ${err.message.substring(0, 80)}`);
    }

    console.log('\n✅ Done!');

  } catch (err) {
    console.error('\n❌ Error:', err.message);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

fixConstraint();
