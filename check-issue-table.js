const { DataSource } = require("typeorm");

async function checkTables() {
  const ds = new DataSource({
    type: "oracle",
    host: process.env.ORACLE_HOST,
    port: Number(process.env.ORACLE_PORT),
    serviceName: process.env.ORACLE_SERVICE_NAME,
    username: process.env.ORACLE_USERNAME,
    password: process.env.ORACLE_PASSWORD,
    logging: false,
  });

  try {
    await ds.initialize();
    console.log("Connected to Oracle successfully\n");

    console.log("Checking for ISSUE table:");
    try {
      const result = await ds.query("SELECT COUNT(*) as count FROM ISSUE");
      console.log("✓ ISSUE table EXISTS with " + result[0].count + " rows\n");
    } catch (e) {
      console.log("✗ ISSUE table NOT FOUND\n");

      console.log("Listing existing tables:");
      const tables = await ds.query("SELECT table_name FROM user_tables WHERE table_name NOT LIKE 'BIN$%'");
      tables.forEach(t => console.log("  - " + t.table_name));

      console.log("\nNow creating ISSUE tables...");
      // Run the migration manually
      await ds.query(`CREATE SEQUENCE ISSUE_SEQ START WITH 1 INCREMENT BY 1`);
      await ds.query(`
        CREATE TABLE ISSUE (
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
          deleted_at TIMESTAMP
        )
      `);
      console.log("✓ ISSUE table created");

      // Add foreign keys
      await ds.query(`CREATE INDEX IDX_ISSUE_CUSTOMER_ID ON ISSUE(customer_id)`);
      await ds.query(`CREATE INDEX IDX_ISSUE_CREATED_BY_ID ON ISSUE(created_by_id)`);
      await ds.query(`CREATE INDEX IDX_ISSUE_ASSIGNED_TO_ID ON ISSUE(assigned_to_id)`);
      await ds.query(`CREATE INDEX IDX_ISSUE_STATUS ON ISSUE(status)`);
      await ds.query(`CREATE INDEX IDX_ISSUE_DELETED_AT ON ISSUE(deleted_at)`);

      await ds.query(`ALTER TABLE ISSUE ADD CONSTRAINT FK_ISSUE_CUSTOMER FOREIGN KEY (customer_id) REFERENCES CUSTOMER(id) ON DELETE RESTRICT`);
      await ds.query(`ALTER TABLE ISSUE ADD CONSTRAINT FK_ISSUE_CREATED_BY FOREIGN KEY (created_by_id) REFERENCES EMPLOYEE(id) ON DELETE RESTRICT`);
      await ds.query(`ALTER TABLE ISSUE ADD CONSTRAINT FK_ISSUE_ASSIGNED_TO FOREIGN KEY (assigned_to_id) REFERENCES EMPLOYEE(id) ON DELETE SET NULL`);

      console.log("✓ Indexes and foreign keys created");
    }

    await ds.destroy();
  } catch (error) {
    console.error("Error:", error.message);
  }
}

checkTables();
