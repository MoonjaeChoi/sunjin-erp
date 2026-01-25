const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

async function createTables() {
  let conn;
  try {
    conn = await oracledb.getConnection({
      user: process.env.ORACLE_USERNAME,
      password: process.env.ORACLE_PASSWORD,
      connectionString: process.env.ORACLE_HOST + ':' + process.env.ORACLE_PORT + '/' + process.env.ORACLE_SERVICE_NAME
    });

    console.log('Creating ISSUE table...\n');

    const tables = [
      'CREATE SEQUENCE ISSUE_SEQ START WITH 1 INCREMENT BY 1',
      `CREATE TABLE ISSUE (
        id NUMBER DEFAULT ISSUE_SEQ.NEXTVAL PRIMARY KEY,
        customer_id NUMBER NOT NULL,
        title VARCHAR2(255) NOT NULL,
        description CLOB,
        severity VARCHAR2(20) DEFAULT 'CRITICAL' NOT NULL,
        status VARCHAR2(20) DEFAULT 'INTAKE' NOT NULL,
        is_public NUMBER(1) DEFAULT 0 NOT NULL,
        created_by_id NUMBER NOT NULL,
        assigned_to_id NUMBER,
        treatment_method VARCHAR2(50),
        treatment_time_minutes NUMBER,
        treatment_result CLOB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        completed_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        deleted_at TIMESTAMP,
        CONSTRAINT CHK_ISSUE_TREATMENT_TIME CHECK (treatment_time_minutes IS NULL OR (treatment_time_minutes >= 1 AND treatment_time_minutes <= 1440))
      )`,
      'CREATE INDEX IDX_ISSUE_CUSTOMER_ID ON ISSUE(customer_id)',
      'CREATE INDEX IDX_ISSUE_CREATED_BY_ID ON ISSUE(created_by_id)',
      'CREATE INDEX IDX_ISSUE_ASSIGNED_TO_ID ON ISSUE(assigned_to_id)',
      'CREATE INDEX IDX_ISSUE_STATUS ON ISSUE(status)',
      'CREATE INDEX IDX_ISSUE_DELETED_AT ON ISSUE(deleted_at)',
      'ALTER TABLE ISSUE ADD CONSTRAINT FK_ISSUE_CUSTOMER FOREIGN KEY (customer_id) REFERENCES CUSTOMER(id) ON DELETE RESTRICT',
      'ALTER TABLE ISSUE ADD CONSTRAINT FK_ISSUE_CREATED_BY FOREIGN KEY (created_by_id) REFERENCES EMPLOYEE(id) ON DELETE RESTRICT',
      'ALTER TABLE ISSUE ADD CONSTRAINT FK_ISSUE_ASSIGNED_TO FOREIGN KEY (assigned_to_id) REFERENCES EMPLOYEE(id) ON DELETE SET NULL'
    ];

    for (const sql of tables) {
      try {
        await conn.execute(sql);
        console.log('✓ ' + sql.substring(0, 60));
      } catch (e) {
        if (e.message.includes('ORA-00955') || e.message.includes('already exists')) {
          console.log('- ' + sql.substring(0, 60) + ' (already exists)');
        } else {
          console.error('✗ Error: ' + e.message);
        }
      }
    }

    await conn.commit();
    console.log('\n✓ ISSUE tables created successfully');

  } catch (err) {
    console.error('Connection error:', err.message);
  } finally {
    if (conn) await conn.close();
  }
}

createTables();
