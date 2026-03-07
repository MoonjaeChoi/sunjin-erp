// Generated: 2026-01-27 23:00:00 KST

import { MigrationInterface, QueryRunner } from 'typeorm';

// lowercase columns (quoted raw SQL) — customer/contact APIs use quoted lowercase identifiers
export class UpdateCustomerAndCreateContactHistoryTables20260127230000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Sequence 생성 (고객 코드 자동 생성)
    await queryRunner.query(`CREATE SEQUENCE CUST_CODE_SEQ INCREMENT BY 1 START WITH 1 CACHE 20 NOCYCLE`);

    // 2. CUSTOMER 테이블에 새 칼럼 추가 (ALTER TABLE with quoted names)
    await queryRunner.query(`ALTER TABLE CUSTOMER ADD "code" VARCHAR2(20)`);
    await queryRunner.query(`ALTER TABLE CUSTOMER ADD "classification" VARCHAR2(20)`);
    await queryRunner.query(`ALTER TABLE CUSTOMER ADD "address" VARCHAR2(500)`);
    await queryRunner.query(`ALTER TABLE CUSTOMER ADD "phone" VARCHAR2(20)`);
    await queryRunner.query(`ALTER TABLE CUSTOMER ADD "email" VARCHAR2(100)`);
    await queryRunner.query(`ALTER TABLE CUSTOMER ADD "memo" CLOB`);
    await queryRunner.query(`ALTER TABLE CUSTOMER ADD "created_by_id" NUMBER`);
    await queryRunner.query(`ALTER TABLE CUSTOMER ADD "updated_by_id" NUMBER`);

    // 3. 기존 category 데이터를 classification으로 복사
    await queryRunner.query(`
      UPDATE CUSTOMER
      SET "classification" = "category",
          "code" = 'CUST-' || LPAD("id", 5, '0')
      WHERE "classification" IS NULL
    `);

    // 4. CUSTOMER_CONTACT 테이블 생성
    await queryRunner.query(`CREATE SEQUENCE CUSTOMER_CONTACT_ID_SEQ START WITH 1 INCREMENT BY 1 NOCACHE`);
    await queryRunner.query(`
      CREATE TABLE CUSTOMER_CONTACT (
        "id" NUMBER DEFAULT CUSTOMER_CONTACT_ID_SEQ.NEXTVAL PRIMARY KEY,
        "customer_id" NUMBER NOT NULL,
        "name" VARCHAR2(100) NOT NULL,
        "title" VARCHAR2(50) NOT NULL,
        "department" VARCHAR2(50),
        "email" VARCHAR2(100) NOT NULL,
        "phone" VARCHAR2(20) NOT NULL,
        "description" VARCHAR2(200),
        "primary_contact" NUMBER DEFAULT 0 NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "deleted_at" TIMESTAMP
      )
    `);

    // 5. CUSTOMER_HISTORY 테이블 생성
    await queryRunner.query(`CREATE SEQUENCE CUSTOMER_HISTORY_ID_SEQ START WITH 1 INCREMENT BY 1 NOCACHE`);
    await queryRunner.query(`
      CREATE TABLE CUSTOMER_HISTORY (
        "id" NUMBER DEFAULT CUSTOMER_HISTORY_ID_SEQ.NEXTVAL PRIMARY KEY,
        "customer_id" NUMBER NOT NULL,
        "change_type" VARCHAR2(20) NOT NULL,
        "changed_fields" CLOB NOT NULL,
        "changed_by_id" NUMBER NOT NULL,
        "changed_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // 6. Foreign Keys (CUSTOMER → EMPLOYEE)
    await queryRunner.query(`ALTER TABLE CUSTOMER ADD CONSTRAINT FK_CUSTOMER_CREATED_BY FOREIGN KEY ("created_by_id") REFERENCES EMPLOYEE(ID)`);
    await queryRunner.query(`ALTER TABLE CUSTOMER ADD CONSTRAINT FK_CUSTOMER_UPDATED_BY FOREIGN KEY ("updated_by_id") REFERENCES EMPLOYEE(ID)`);

    // 7. Foreign Keys (CUSTOMER_CONTACT → CUSTOMER)
    await queryRunner.query(`ALTER TABLE CUSTOMER_CONTACT ADD CONSTRAINT FK_CONTACT_CUSTOMER FOREIGN KEY ("customer_id") REFERENCES CUSTOMER("id")`);

    // 8. Foreign Keys (CUSTOMER_HISTORY → CUSTOMER)
    await queryRunner.query(`ALTER TABLE CUSTOMER_HISTORY ADD CONSTRAINT FK_HISTORY_CUSTOMER FOREIGN KEY ("customer_id") REFERENCES CUSTOMER("id")`);

    // 9. Foreign Keys (CUSTOMER_HISTORY → EMPLOYEE)
    await queryRunner.query(`ALTER TABLE CUSTOMER_HISTORY ADD CONSTRAINT FK_HISTORY_CHANGED_BY FOREIGN KEY ("changed_by_id") REFERENCES EMPLOYEE(ID)`);

    // 10. 인덱스 생성 (CUSTOMER_CONTACT)
    await queryRunner.query(`CREATE INDEX IDX_CONTACT_CUSTOMER_ID ON CUSTOMER_CONTACT("customer_id")`);
    await queryRunner.query(`CREATE INDEX IDX_CONTACT_DELETED_AT ON CUSTOMER_CONTACT("deleted_at")`);

    // 11. 인덱스 생성 (CUSTOMER_HISTORY)
    await queryRunner.query(`CREATE INDEX IDX_HISTORY_CUSTOMER_ID ON CUSTOMER_HISTORY("customer_id")`);
    await queryRunner.query(`CREATE INDEX IDX_HISTORY_CHANGED_AT ON CUSTOMER_HISTORY("changed_at")`);
    await queryRunner.query(`CREATE INDEX IDX_HISTORY_CUSTOMER_CHANGED ON CUSTOMER_HISTORY("customer_id", "changed_at")`);

    // 12. 부분 유니크 인덱스 (function-based, Oracle doesn't support WHERE clause in indexes)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IDX_CUSTOMER_NAME_SOFT_DELETE
      ON CUSTOMER(CASE WHEN "deleted_at" IS NULL THEN "name" ELSE NULL END)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IDX_CONTACT_PRIMARY_SOFT_DELETE
      ON CUSTOMER_CONTACT(CASE WHEN "primary_contact" = 1 AND "deleted_at" IS NULL THEN "customer_id" ELSE NULL END)
    `);

    // 13. Check 제약 조건
    await queryRunner.query(`ALTER TABLE CUSTOMER_HISTORY ADD CONSTRAINT CK_HISTORY_CHANGE_TYPE CHECK ("change_type" IN ('CREATE', 'UPDATE', 'DELETE', 'CONTACT_ADD', 'CONTACT_DELETE'))`);
    await queryRunner.query(`ALTER TABLE CUSTOMER ADD CONSTRAINT CK_CUSTOMER_CLASSIFICATION CHECK ("classification" IN ('RESELLER', 'END_USER', 'MAINTENANCE', 'GENERAL'))`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE CUSTOMER DROP CONSTRAINT CK_CUSTOMER_CLASSIFICATION`);
    await queryRunner.query(`ALTER TABLE CUSTOMER_HISTORY DROP CONSTRAINT CK_HISTORY_CHANGE_TYPE`);
    await queryRunner.query(`DROP INDEX IDX_CONTACT_PRIMARY_SOFT_DELETE`);
    await queryRunner.query(`DROP INDEX IDX_CUSTOMER_NAME_SOFT_DELETE`);
    await queryRunner.query(`DROP INDEX IDX_HISTORY_CUSTOMER_CHANGED`);
    await queryRunner.query(`DROP INDEX IDX_HISTORY_CHANGED_AT`);
    await queryRunner.query(`DROP INDEX IDX_HISTORY_CUSTOMER_ID`);
    await queryRunner.query(`DROP INDEX IDX_CONTACT_DELETED_AT`);
    await queryRunner.query(`DROP INDEX IDX_CONTACT_CUSTOMER_ID`);
    await queryRunner.query(`ALTER TABLE CUSTOMER_HISTORY DROP CONSTRAINT FK_HISTORY_CHANGED_BY`);
    await queryRunner.query(`ALTER TABLE CUSTOMER_HISTORY DROP CONSTRAINT FK_HISTORY_CUSTOMER`);
    await queryRunner.query(`ALTER TABLE CUSTOMER_CONTACT DROP CONSTRAINT FK_CONTACT_CUSTOMER`);
    await queryRunner.query(`ALTER TABLE CUSTOMER DROP CONSTRAINT FK_CUSTOMER_UPDATED_BY`);
    await queryRunner.query(`ALTER TABLE CUSTOMER DROP CONSTRAINT FK_CUSTOMER_CREATED_BY`);
    await queryRunner.query(`DROP TABLE CUSTOMER_HISTORY`);
    await queryRunner.query(`DROP SEQUENCE CUSTOMER_HISTORY_ID_SEQ`);
    await queryRunner.query(`DROP TABLE CUSTOMER_CONTACT`);
    await queryRunner.query(`DROP SEQUENCE CUSTOMER_CONTACT_ID_SEQ`);
    await queryRunner.query(`ALTER TABLE CUSTOMER DROP COLUMN "updated_by_id"`);
    await queryRunner.query(`ALTER TABLE CUSTOMER DROP COLUMN "created_by_id"`);
    await queryRunner.query(`ALTER TABLE CUSTOMER DROP COLUMN "memo"`);
    await queryRunner.query(`ALTER TABLE CUSTOMER DROP COLUMN "email"`);
    await queryRunner.query(`ALTER TABLE CUSTOMER DROP COLUMN "phone"`);
    await queryRunner.query(`ALTER TABLE CUSTOMER DROP COLUMN "address"`);
    await queryRunner.query(`ALTER TABLE CUSTOMER DROP COLUMN "classification"`);
    await queryRunner.query(`ALTER TABLE CUSTOMER DROP COLUMN "code"`);
    await queryRunner.query(`DROP SEQUENCE CUST_CODE_SEQ`);
  }
}
