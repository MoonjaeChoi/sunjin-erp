#!/usr/bin/env node
// Generated: 2026-01-25 10:50:00 KST

const oracledb = require("oracledb");

// Drop existing tables and sequences
const dropStatements = [
  "DROP TABLE PROJECT_ATTACHMENT",
  "DROP TABLE PROJECT",
  "DROP TABLE TECH_SUPPORT",
  "DROP TABLE TASK",
  "DROP TABLE EMPLOYEE",
  "DROP TABLE CUSTOMER",
  "DROP TABLE DEPARTMENT",
  "DROP SEQUENCE PROJECT_ATTACHMENT_ID_SEQ",
  "DROP SEQUENCE PROJECT_CODE_SEQ",
  "DROP SEQUENCE PROJECT_ID_SEQ",
  "DROP SEQUENCE TECH_SUPPORT_ID_SEQ",
  "DROP SEQUENCE TASK_ID_SEQ",
  "DROP SEQUENCE CUSTOMER_ID_SEQ",
  "DROP SEQUENCE EMPLOYEE_ID_SEQ",
  "DROP SEQUENCE DEPARTMENT_ID_SEQ",
];

// Create tables with proper lowercase quoted column names (single line SQL)
const createStatements = [
  // 1. DEPARTMENT table
  "CREATE SEQUENCE DEPARTMENT_ID_SEQ START WITH 1 INCREMENT BY 1 NOCACHE",
  "CREATE TABLE \"DEPARTMENT\" (\"id\" NUMBER DEFAULT DEPARTMENT_ID_SEQ.NEXTVAL PRIMARY KEY, \"name\" VARCHAR2(100) NOT NULL, \"created_at\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, \"updated_at\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, \"deleted_at\" TIMESTAMP)",
  "CREATE INDEX \"IDX_DEPARTMENT_DELETED_AT\" ON \"DEPARTMENT\"(\"deleted_at\")",

  // 2. EMPLOYEE table
  "CREATE SEQUENCE EMPLOYEE_ID_SEQ START WITH 1 INCREMENT BY 1 NOCACHE",
  "CREATE TABLE \"EMPLOYEE\" (\"id\" NUMBER DEFAULT EMPLOYEE_ID_SEQ.NEXTVAL PRIMARY KEY, \"name\" VARCHAR2(50) NOT NULL, \"username\" VARCHAR2(50) NOT NULL, \"password_hash\" VARCHAR2(200) NOT NULL, \"role\" VARCHAR2(20) DEFAULT 'USER' NOT NULL, \"department_id\" NUMBER, \"email\" VARCHAR2(100), \"position\" VARCHAR2(50), \"created_at\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, \"updated_at\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, \"deleted_at\" TIMESTAMP, CONSTRAINT \"FK_EMPLOYEE_DEPARTMENT\" FOREIGN KEY (\"department_id\") REFERENCES \"DEPARTMENT\"(\"id\"), CONSTRAINT \"UQ_EMPLOYEE_USERNAME\" UNIQUE (\"username\"))",
  "CREATE INDEX \"IDX_EMPLOYEE_DELETED_AT\" ON \"EMPLOYEE\"(\"deleted_at\")",

  // 3. CUSTOMER table
  "CREATE SEQUENCE CUSTOMER_ID_SEQ START WITH 1 INCREMENT BY 1 NOCACHE",
  "CREATE TABLE \"CUSTOMER\" (\"id\" NUMBER DEFAULT CUSTOMER_ID_SEQ.NEXTVAL PRIMARY KEY, \"name\" VARCHAR2(100) NOT NULL, \"category\" VARCHAR2(20) NOT NULL, \"created_at\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, \"updated_at\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, \"deleted_at\" TIMESTAMP, CONSTRAINT \"UQ_CUSTOMER_NAME\" UNIQUE (\"name\"))",
  "CREATE INDEX \"IDX_CUSTOMER_DELETED_AT\" ON \"CUSTOMER\"(\"deleted_at\")",
  "CREATE INDEX \"IDX_CUSTOMER_CATEGORY\" ON \"CUSTOMER\"(\"category\")",

  // 4. TASK table
  "CREATE SEQUENCE TASK_ID_SEQ START WITH 1 INCREMENT BY 1 NOCACHE",
  "CREATE TABLE \"TASK\" (\"id\" NUMBER DEFAULT TASK_ID_SEQ.NEXTVAL PRIMARY KEY, \"title\" VARCHAR2(200) NOT NULL, \"description\" CLOB, \"task_date\" DATE NOT NULL, \"start_time\" NUMBER, \"end_time\" NUMBER, \"task_type\" VARCHAR2(20) NOT NULL, \"work_type\" VARCHAR2(10) NOT NULL, \"status\" VARCHAR2(20) DEFAULT 'READY' NOT NULL, \"employee_id\" NUMBER NOT NULL, \"customer_id\" NUMBER, \"completed_at\" TIMESTAMP, \"created_at\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, \"updated_at\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, \"deleted_at\" TIMESTAMP, CONSTRAINT \"CHK_TASK_START_TIME\" CHECK (\"start_time\" IS NULL OR (\"start_time\" >= 0 AND \"start_time\" <= 1439)), CONSTRAINT \"CHK_TASK_END_TIME\" CHECK (\"end_time\" IS NULL OR (\"end_time\" >= 0 AND \"end_time\" <= 1439)), CONSTRAINT \"CHK_TASK_TIME_ORDER\" CHECK ((\"start_time\" IS NULL OR \"end_time\" IS NULL) OR \"start_time\" < \"end_time\"))",
  "CREATE INDEX \"IDX_TASK_DATE_EMPLOYEE\" ON \"TASK\"(\"task_date\", \"employee_id\")",
  "CREATE INDEX \"IDX_TASK_EMPLOYEE_DATE\" ON \"TASK\"(\"employee_id\", \"task_date\", \"deleted_at\")",
  "CREATE INDEX \"IDX_TASK_DELETED_AT\" ON \"TASK\"(\"deleted_at\")",
  "CREATE INDEX \"IDX_TASK_STATUS\" ON \"TASK\"(\"status\")",

  // 5. TECH_SUPPORT table
  "CREATE SEQUENCE TECH_SUPPORT_ID_SEQ START WITH 1 INCREMENT BY 1 NOCACHE",
  "CREATE TABLE \"TECH_SUPPORT\" (\"id\" NUMBER DEFAULT TECH_SUPPORT_ID_SEQ.NEXTVAL PRIMARY KEY, \"title\" VARCHAR2(200) NOT NULL, \"description\" CLOB NOT NULL, \"status\" VARCHAR2(20) DEFAULT 'NEW' NOT NULL, \"priority\" VARCHAR2(10) DEFAULT 'NORMAL' NOT NULL, \"category\" VARCHAR2(50), \"customer_id\" NUMBER NOT NULL, \"assigned_to\" NUMBER, \"resolved_at\" TIMESTAMP, \"created_at\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, \"updated_at\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, \"deleted_at\" TIMESTAMP, CONSTRAINT \"FK_TECH_SUPPORT_CUSTOMER\" FOREIGN KEY (\"customer_id\") REFERENCES \"CUSTOMER\"(\"id\"), CONSTRAINT \"FK_TECH_SUPPORT_EMPLOYEE\" FOREIGN KEY (\"assigned_to\") REFERENCES \"EMPLOYEE\"(\"id\"), CONSTRAINT \"CHK_TECH_SUPPORT_STATUS\" CHECK (\"status\" IN ('NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')), CONSTRAINT \"CHK_TECH_SUPPORT_PRIORITY\" CHECK (\"priority\" IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')))",
  "CREATE INDEX \"IDX_TECH_SUPPORT_STATUS\" ON \"TECH_SUPPORT\"(\"status\")",
  "CREATE INDEX \"IDX_TECH_SUPPORT_PRIORITY\" ON \"TECH_SUPPORT\"(\"priority\")",
  "CREATE INDEX \"IDX_TECH_SUPPORT_CUSTOMER\" ON \"TECH_SUPPORT\"(\"customer_id\")",
  "CREATE INDEX \"IDX_TECH_SUPPORT_ASSIGNED_TO\" ON \"TECH_SUPPORT\"(\"assigned_to\")",
  "CREATE INDEX \"IDX_TECH_SUPPORT_DELETED_AT\" ON \"TECH_SUPPORT\"(\"deleted_at\")",

  // 6. PROJECT table
  "CREATE SEQUENCE PROJECT_ID_SEQ START WITH 1 INCREMENT BY 1",
  "CREATE SEQUENCE PROJECT_CODE_SEQ START WITH 1 INCREMENT BY 1",
  "CREATE SEQUENCE PROJECT_ATTACHMENT_ID_SEQ START WITH 1 INCREMENT BY 1",
  "CREATE TABLE \"PROJECT\" (\"id\" NUMBER DEFAULT PROJECT_ID_SEQ.NEXTVAL PRIMARY KEY, \"project_code\" VARCHAR2(30), \"project_name\" VARCHAR2(200) NOT NULL, \"customer_id\" NUMBER NOT NULL, \"employee_id\" NUMBER NOT NULL, \"status\" VARCHAR2(20) DEFAULT 'PREPARING' NOT NULL, \"start_date\" DATE, \"end_date\" DATE, \"contract_amount\" NUMBER, \"description\" CLOB, \"stage_meeting_at\" TIMESTAMP, \"stage_proposal_at\" TIMESTAMP, \"stage_quotation_at\" TIMESTAMP, \"stage_contract_at\" TIMESTAMP, \"stage_kickoff_at\" TIMESTAMP, \"stage_development_at\" TIMESTAMP, \"stage_delivery_at\" TIMESTAMP, \"stage_handover_at\" TIMESTAMP, \"created_at\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, \"updated_at\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, \"deleted_at\" TIMESTAMP, CONSTRAINT \"FK_PROJECT_CUSTOMER\" FOREIGN KEY (\"customer_id\") REFERENCES \"CUSTOMER\"(\"id\"), CONSTRAINT \"FK_PROJECT_EMPLOYEE\" FOREIGN KEY (\"employee_id\") REFERENCES \"EMPLOYEE\"(\"id\"), CONSTRAINT \"CHK_PROJECT_STATUS\" CHECK (\"status\" IN ('PREPARING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD')), CONSTRAINT \"CHK_PROJECT_DATE_ORDER\" CHECK (\"start_date\" IS NULL OR \"end_date\" IS NULL OR \"start_date\" <= \"end_date\"))",
  "CREATE TABLE \"PROJECT_ATTACHMENT\" (\"id\" NUMBER DEFAULT PROJECT_ATTACHMENT_ID_SEQ.NEXTVAL PRIMARY KEY, \"project_id\" NUMBER NOT NULL, \"file_path\" VARCHAR2(500) NOT NULL, \"file_name\" VARCHAR2(200) NOT NULL, \"file_size\" NUMBER NOT NULL, \"category\" VARCHAR2(20) NOT NULL, \"created_at\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT \"FK_ATTACH_PROJECT\" FOREIGN KEY (\"project_id\") REFERENCES \"PROJECT\"(\"id\"), CONSTRAINT \"CHK_ATTACH_CATEGORY\" CHECK (\"category\" IN ('CONTRACT', 'PROPOSAL', 'QUOTATION', 'REPORT', 'OTHER')))",
  "CREATE INDEX \"IDX_PROJECT_CUSTOMER\" ON \"PROJECT\"(\"customer_id\")",
  "CREATE INDEX \"IDX_PROJECT_EMPLOYEE\" ON \"PROJECT\"(\"employee_id\")",
  "CREATE INDEX \"IDX_PROJECT_STATUS\" ON \"PROJECT\"(\"status\")",
  "CREATE UNIQUE INDEX \"IDX_PROJECT_CODE\" ON \"PROJECT\"(\"project_code\")",
  "CREATE INDEX \"IDX_PROJECT_DELETED_AT\" ON \"PROJECT\"(\"deleted_at\")",
  "CREATE INDEX \"IDX_PROJECT_ATTACH_PROJECT\" ON \"PROJECT_ATTACHMENT\"(\"project_id\")",
];

(async () => {
  let conn;
  try {
    conn = await oracledb.getConnection({
      user: "sunjin_admin",
      password: "sunjin1234",
      connectionString: "192.168.75.194:1521/XEPDB1"
    });

    console.log("데이터베이스 스키마를 재구성 중입니다...\n");

    // Drop existing tables and sequences
    console.log("기존 테이블/시퀀스 삭제 중...");
    for (const statement of dropStatements) {
      try {
        await conn.execute(statement);
      } catch (e) {
        // Ignore "does not exist" errors
        if (!e.message.includes("ORA-04043")) {
          console.error("  ✗", statement.substring(0, 50));
        }
      }
    }
    console.log("✓ 기존 객체 삭제 완료\n");

    // Create new tables with proper column quoting
    console.log("새로운 테이블/인덱스 생성 중...");
    let created = 0;
    for (const statement of createStatements) {
      try {
        await conn.execute(statement);
        created++;
      } catch (e) {
        console.error("✗ Error:", e.message);
        console.error("  Statement:", statement.substring(0, 100));
        throw e;
      }
    }
    console.log(`✓ ${created}개 객체 생성 완료\n`);

    await conn.commit();
    console.log("✓ 스키마 재구성 완료");
    process.exit(0);
  } catch (err) {
    console.error("오류: " + err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.close();
  }
})();
