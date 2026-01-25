#!/usr/bin/env node
// Generated: 2026-01-25 10:30:00 KST

const oracledb = require("oracledb");

const statements = [
  // 1. DEPARTMENT table
  `CREATE SEQUENCE DEPARTMENT_ID_SEQ START WITH 1 INCREMENT BY 1 NOCACHE`,
  `CREATE TABLE DEPARTMENT (
    id NUMBER DEFAULT DEPARTMENT_ID_SEQ.NEXTVAL PRIMARY KEY,
    name VARCHAR2(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP
  )`,
  `CREATE INDEX IDX_DEPARTMENT_DELETED_AT ON DEPARTMENT(deleted_at)`,

  // 2. TASK table (if not exists)
  `CREATE SEQUENCE TASK_ID_SEQ START WITH 1 INCREMENT BY 1 NOCACHE`,
  `CREATE TABLE TASK (
    id NUMBER DEFAULT TASK_ID_SEQ.NEXTVAL PRIMARY KEY,
    title VARCHAR2(200) NOT NULL,
    description CLOB,
    task_date DATE NOT NULL,
    start_time NUMBER,
    end_time NUMBER,
    task_type VARCHAR2(20) NOT NULL,
    work_type VARCHAR2(10) NOT NULL,
    status VARCHAR2(20) DEFAULT 'READY' NOT NULL,
    employee_id NUMBER NOT NULL,
    customer_id NUMBER,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP,
    CONSTRAINT CHK_TASK_START_TIME CHECK (start_time IS NULL OR (start_time >= 0 AND start_time <= 1439)),
    CONSTRAINT CHK_TASK_END_TIME CHECK (end_time IS NULL OR (end_time >= 0 AND end_time <= 1439)),
    CONSTRAINT CHK_TASK_TIME_ORDER CHECK ((start_time IS NULL OR end_time IS NULL) OR start_time < end_time)
  )`,
  `CREATE INDEX IDX_TASK_DATE_EMPLOYEE ON TASK(task_date, employee_id)`,
  `CREATE INDEX IDX_TASK_EMPLOYEE_DATE ON TASK(employee_id, task_date, deleted_at)`,
  `CREATE INDEX IDX_TASK_DELETED_AT ON TASK(deleted_at)`,
  `CREATE INDEX IDX_TASK_STATUS ON TASK(status)`,

  // 3. PROJECT table
  `CREATE SEQUENCE PROJECT_ID_SEQ START WITH 1 INCREMENT BY 1`,
  `CREATE TABLE PROJECT (
    id NUMBER DEFAULT PROJECT_ID_SEQ.NEXTVAL PRIMARY KEY,
    project_code VARCHAR2(30),
    project_name VARCHAR2(200) NOT NULL,
    customer_id NUMBER NOT NULL,
    employee_id NUMBER NOT NULL,
    status VARCHAR2(20) DEFAULT 'PREPARING' NOT NULL,
    start_date DATE,
    end_date DATE,
    contract_amount NUMBER,
    description CLOB,
    stage_meeting_at TIMESTAMP,
    stage_proposal_at TIMESTAMP,
    stage_quotation_at TIMESTAMP,
    stage_contract_at TIMESTAMP,
    stage_kickoff_at TIMESTAMP,
    stage_development_at TIMESTAMP,
    stage_delivery_at TIMESTAMP,
    stage_handover_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP,
    CONSTRAINT CHK_PROJECT_STATUS CHECK (status IN ('PREPARING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD')),
    CONSTRAINT CHK_PROJECT_DATE_ORDER CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
  )`,
  `CREATE SEQUENCE PROJECT_ATTACHMENT_ID_SEQ START WITH 1 INCREMENT BY 1`,
  `CREATE TABLE PROJECT_ATTACHMENT (
    id NUMBER DEFAULT PROJECT_ATTACHMENT_ID_SEQ.NEXTVAL PRIMARY KEY,
    project_id NUMBER NOT NULL,
    file_path VARCHAR2(500) NOT NULL,
    file_name VARCHAR2(200) NOT NULL,
    file_size NUMBER NOT NULL,
    category VARCHAR2(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT FK_ATTACH_PROJECT FOREIGN KEY (project_id) REFERENCES PROJECT(id),
    CONSTRAINT CHK_ATTACH_CATEGORY CHECK (category IN ('CONTRACT', 'PROPOSAL', 'QUOTATION', 'REPORT', 'OTHER'))
  )`,
  `CREATE INDEX IDX_PROJECT_CUSTOMER ON PROJECT(customer_id)`,
  `CREATE INDEX IDX_PROJECT_EMPLOYEE ON PROJECT(employee_id)`,
  `CREATE INDEX IDX_PROJECT_STATUS ON PROJECT(status)`,
  `CREATE UNIQUE INDEX IDX_PROJECT_CODE ON PROJECT(project_code)`,
  `CREATE INDEX IDX_PROJECT_DELETED_AT ON PROJECT(deleted_at)`,
  `CREATE INDEX IDX_PROJECT_ATTACH_PROJECT ON PROJECT_ATTACHMENT(project_id)`,

  // 4. Foreign Keys (added after tables exist)
  `ALTER TABLE PROJECT ADD CONSTRAINT FK_PROJECT_CUSTOMER FOREIGN KEY (customer_id) REFERENCES CUSTOMER(id)`,
  `ALTER TABLE PROJECT ADD CONSTRAINT FK_PROJECT_EMPLOYEE FOREIGN KEY (employee_id) REFERENCES EMPLOYEE(id)`,
];

(async () => {
  let conn;
  try {
    conn = await oracledb.getConnection({
      user: "sunjin_admin",
      password: "sunjin1234",
      connectionString: "192.168.75.194:1521/XEPDB1"
    });

    console.log("데이터베이스 스키마를 초기화 중입니다...\n");
    let created = 0;
    let skipped = 0;

    for (const statement of statements) {
      try {
        await conn.execute(statement);
        const type = statement.split(" ")[0].toUpperCase();
        console.log("✓ " + type);
        created++;
      } catch (e) {
        // Ignore "already exists" errors
        if (
          e.message.includes("ORA-00955") || // table already exists
          e.message.includes("ORA-02261") || // duplicate constraint
          e.message.includes("ORA-02289")    // sequence does not exist (already created)
        ) {
          const type = statement.split(" ")[0].toUpperCase();
          console.log("- " + type + " (이미 존재)");
          skipped++;
        } else {
          console.error("✗ Error:", e.message);
          console.error("  Statement:", statement.substring(0, 60) + "...");
        }
      }
    }

    await conn.commit();
    console.log("\n✓ 스키마 초기화 완료: " + created + "개 생성, " + skipped + "개 스킵");
    process.exit(0);
  } catch (err) {
    console.error("오류: " + err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.close();
  }
})();
