const oracledb = require('oracledb');

async function checkHex() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: 'sunjin_admin',
      password: 'sunjin1234',
      connectionString: '192.168.75.194:1521/XEPDB1'
    });

    // Get the constraint condition
    const result = await connection.execute(
      "SELECT SEARCH_CONDITION FROM USER_CONSTRAINTS WHERE CONSTRAINT_NAME = 'CHK_INVENTORY_STATUS'"
    );

    if (result.rows.length > 0) {
      const condition = result.rows[0][0];
      console.log('\n📋 Constraint Condition (as string):', condition);
      console.log('   Length:', condition.length);
      
      // Convert to hex
      const hex = Buffer.from(condition, 'utf8').toString('hex');
      console.log('\n📋 Hex representation:', hex);
      
      // Try to extract the values
      console.log('\n📋 Parsing constraint values:');
      
      // Find all quoted strings
      const valueMatches = condition.match(/'([^']*)'/g);
      if (valueMatches) {
        valueMatches.forEach((match, idx) => {
          const value = match.slice(1, -1); // Remove quotes
          const hex = Buffer.from(value, 'utf8').toString('hex');
          console.log(`   Value ${idx + 1}: "${value}" → hex: ${hex}`);
        });
      }
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

checkHex();
