// Generated: 2026-01-25 21:42:00 KST

import { MigrationInterface, QueryRunner } from 'typeorm';

// lowercase columns (quoted raw SQL) — issue API uses quoted lowercase identifiers
export class CreateIssueTables20260128000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SEQUENCE ISSUE_SEQ START WITH 1 INCREMENT BY 1`);
    await queryRunner.query(`CREATE SEQUENCE ISSUE_ATTACHMENT_SEQ START WITH 1 INCREMENT BY 1`);
    await queryRunner.query(`CREATE SEQUENCE ISSUE_HISTORY_SEQ START WITH 1 INCREMENT BY 1`);

    await queryRunner.query(`
      CREATE TABLE ISSUE (
        "id" NUMBER DEFAULT ISSUE_SEQ.NEXTVAL PRIMARY KEY,
        "customer_id" NUMBER NOT NULL,
        "title" VARCHAR2(255) NOT NULL,
        "description" CLOB,
        "severity" VARCHAR2(20) DEFAULT 'CRITICAL' NOT NULL,
        "status" VARCHAR2(20) DEFAULT 'INTAKE' NOT NULL,
        "assigned_employee_id" NUMBER,
        "resolution" CLOB,
        "created_by_id" NUMBER NOT NULL,
        "updated_by_id" NUMBER,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "deleted_at" TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE ISSUE_ATTACHMENT (
        "id" NUMBER DEFAULT ISSUE_ATTACHMENT_SEQ.NEXTVAL PRIMARY KEY,
        "issue_id" NUMBER NOT NULL,
        "file_path" VARCHAR2(500) NOT NULL,
        "file_name" VARCHAR2(200) NOT NULL,
        "file_size" NUMBER NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE ISSUE_HISTORY (
        "id" NUMBER DEFAULT ISSUE_HISTORY_SEQ.NEXTVAL PRIMARY KEY,
        "issue_id" NUMBER NOT NULL,
        "change_type" VARCHAR2(20) NOT NULL,
        "changed_fields" CLOB NOT NULL,
        "changed_by_id" NUMBER NOT NULL,
        "changed_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    await queryRunner.query(`ALTER TABLE ISSUE ADD CONSTRAINT CHK_ISSUE_SEVERITY CHECK ("severity" IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW'))`);
    await queryRunner.query(`ALTER TABLE ISSUE ADD CONSTRAINT CHK_ISSUE_STATUS CHECK ("status" IN ('INTAKE', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'))`);
    await queryRunner.query(`ALTER TABLE ISSUE ADD CONSTRAINT FK_ISSUE_CUSTOMER FOREIGN KEY ("customer_id") REFERENCES CUSTOMER("id")`);
    await queryRunner.query(`ALTER TABLE ISSUE ADD CONSTRAINT FK_ISSUE_ASSIGNED FOREIGN KEY ("assigned_employee_id") REFERENCES EMPLOYEE(ID)`);
    await queryRunner.query(`ALTER TABLE ISSUE ADD CONSTRAINT FK_ISSUE_CREATED_BY FOREIGN KEY ("created_by_id") REFERENCES EMPLOYEE(ID)`);
    await queryRunner.query(`ALTER TABLE ISSUE_ATTACHMENT ADD CONSTRAINT FK_ISSUE_ATTACH FOREIGN KEY ("issue_id") REFERENCES ISSUE("id")`);
    await queryRunner.query(`ALTER TABLE ISSUE_HISTORY ADD CONSTRAINT FK_ISSUE_HISTORY FOREIGN KEY ("issue_id") REFERENCES ISSUE("id")`);
    await queryRunner.query(`ALTER TABLE ISSUE_HISTORY ADD CONSTRAINT FK_ISSUE_HISTORY_BY FOREIGN KEY ("changed_by_id") REFERENCES EMPLOYEE(ID)`);

    await queryRunner.query(`CREATE INDEX IDX_ISSUE_CUSTOMER ON ISSUE("customer_id")`);
    await queryRunner.query(`CREATE INDEX IDX_ISSUE_STATUS ON ISSUE("status")`);
    await queryRunner.query(`CREATE INDEX IDX_ISSUE_ASSIGNED ON ISSUE("assigned_employee_id")`);
    await queryRunner.query(`CREATE INDEX IDX_ISSUE_DELETED_AT ON ISSUE("deleted_at")`);
    await queryRunner.query(`CREATE INDEX IDX_ISSUE_ATTACH_ISSUE ON ISSUE_ATTACHMENT("issue_id")`);
    await queryRunner.query(`CREATE INDEX IDX_ISSUE_HISTORY_ISSUE ON ISSUE_HISTORY("issue_id")`);
    await queryRunner.query(`CREATE INDEX IDX_ISSUE_HISTORY_AT ON ISSUE_HISTORY("changed_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_ISSUE_HISTORY_AT`);
    await queryRunner.query(`DROP INDEX IDX_ISSUE_HISTORY_ISSUE`);
    await queryRunner.query(`DROP INDEX IDX_ISSUE_ATTACH_ISSUE`);
    await queryRunner.query(`DROP INDEX IDX_ISSUE_DELETED_AT`);
    await queryRunner.query(`DROP INDEX IDX_ISSUE_ASSIGNED`);
    await queryRunner.query(`DROP INDEX IDX_ISSUE_STATUS`);
    await queryRunner.query(`DROP INDEX IDX_ISSUE_CUSTOMER`);
    await queryRunner.query(`ALTER TABLE ISSUE_HISTORY DROP CONSTRAINT FK_ISSUE_HISTORY_BY`);
    await queryRunner.query(`ALTER TABLE ISSUE_HISTORY DROP CONSTRAINT FK_ISSUE_HISTORY`);
    await queryRunner.query(`ALTER TABLE ISSUE_ATTACHMENT DROP CONSTRAINT FK_ISSUE_ATTACH`);
    await queryRunner.query(`ALTER TABLE ISSUE DROP CONSTRAINT FK_ISSUE_CREATED_BY`);
    await queryRunner.query(`ALTER TABLE ISSUE DROP CONSTRAINT FK_ISSUE_ASSIGNED`);
    await queryRunner.query(`ALTER TABLE ISSUE DROP CONSTRAINT FK_ISSUE_CUSTOMER`);
    await queryRunner.query(`DROP TABLE ISSUE_HISTORY`);
    await queryRunner.query(`DROP TABLE ISSUE_ATTACHMENT`);
    await queryRunner.query(`DROP TABLE ISSUE`);
    await queryRunner.query(`DROP SEQUENCE ISSUE_HISTORY_SEQ`);
    await queryRunner.query(`DROP SEQUENCE ISSUE_ATTACHMENT_SEQ`);
    await queryRunner.query(`DROP SEQUENCE ISSUE_SEQ`);
  }
}
