// Generated: 2026-01-26 00:00:00 KST

import { MigrationInterface, QueryRunner } from 'typeorm';

// lowercase columns (quoted raw SQL) — maintenance API uses quoted lowercase identifiers
export class CreateMaintenanceContractTable20260126000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SEQUENCE SEQ_MAINTENANCE_CONTRACT START WITH 1 INCREMENT BY 1 NOCACHE`);

    await queryRunner.query(`
      CREATE TABLE MAINTENANCE_CONTRACT (
        "id" NUMBER DEFAULT SEQ_MAINTENANCE_CONTRACT.NEXTVAL PRIMARY KEY,
        "customer_id" NUMBER NOT NULL,
        "contract_name" VARCHAR2(255) NOT NULL,
        "contract_type" VARCHAR2(255) NOT NULL,
        "start_date" DATE NOT NULL,
        "end_date" DATE NOT NULL,
        "contract_amount" NUMBER,
        "assigned_employee_id" NUMBER NOT NULL,
        "contract_status" VARCHAR2(50) DEFAULT '활성' NOT NULL,
        "notes" CLOB,
        "created_by_id" NUMBER NOT NULL,
        "updated_by_id" NUMBER NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "deleted_at" TIMESTAMP
      )
    `);

    await queryRunner.query(`ALTER TABLE MAINTENANCE_CONTRACT ADD CONSTRAINT CHK_MC_STATUS CHECK ("contract_status" IN ('활성', '종료', '갱신예정'))`);
    await queryRunner.query(`ALTER TABLE MAINTENANCE_CONTRACT ADD CONSTRAINT CHK_MC_DATES CHECK ("start_date" <= "end_date")`);
    await queryRunner.query(`ALTER TABLE MAINTENANCE_CONTRACT ADD CONSTRAINT FK_MC_CUSTOMER FOREIGN KEY ("customer_id") REFERENCES CUSTOMER("id")`);
    await queryRunner.query(`ALTER TABLE MAINTENANCE_CONTRACT ADD CONSTRAINT FK_MC_ASSIGNED_EMPLOYEE FOREIGN KEY ("assigned_employee_id") REFERENCES EMPLOYEE(ID)`);
    await queryRunner.query(`ALTER TABLE MAINTENANCE_CONTRACT ADD CONSTRAINT FK_MC_CREATED_BY FOREIGN KEY ("created_by_id") REFERENCES EMPLOYEE(ID)`);
    await queryRunner.query(`ALTER TABLE MAINTENANCE_CONTRACT ADD CONSTRAINT FK_MC_UPDATED_BY FOREIGN KEY ("updated_by_id") REFERENCES EMPLOYEE(ID)`);

    await queryRunner.query(`CREATE INDEX IDX_MC_CUSTOMER_ID ON MAINTENANCE_CONTRACT("customer_id")`);
    await queryRunner.query(`CREATE INDEX IDX_MC_ASSIGNED_EMPLOYEE_ID ON MAINTENANCE_CONTRACT("assigned_employee_id")`);
    await queryRunner.query(`CREATE INDEX IDX_MC_STATUS ON MAINTENANCE_CONTRACT("contract_status")`);
    await queryRunner.query(`CREATE INDEX IDX_MC_END_DATE ON MAINTENANCE_CONTRACT("end_date")`);
    await queryRunner.query(`CREATE INDEX IDX_MC_DELETED_AT ON MAINTENANCE_CONTRACT("deleted_at")`);
    await queryRunner.query(`CREATE INDEX IDX_MC_STATUS_ENDDATE ON MAINTENANCE_CONTRACT("contract_status", "end_date")`);
    await queryRunner.query(`CREATE INDEX IDX_MC_CUSTOMER_ENDDATE ON MAINTENANCE_CONTRACT("customer_id", "end_date")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_MC_CUSTOMER_ENDDATE`);
    await queryRunner.query(`DROP INDEX IDX_MC_STATUS_ENDDATE`);
    await queryRunner.query(`DROP INDEX IDX_MC_DELETED_AT`);
    await queryRunner.query(`DROP INDEX IDX_MC_END_DATE`);
    await queryRunner.query(`DROP INDEX IDX_MC_STATUS`);
    await queryRunner.query(`DROP INDEX IDX_MC_ASSIGNED_EMPLOYEE_ID`);
    await queryRunner.query(`DROP INDEX IDX_MC_CUSTOMER_ID`);
    await queryRunner.query(`ALTER TABLE MAINTENANCE_CONTRACT DROP CONSTRAINT FK_MC_UPDATED_BY`);
    await queryRunner.query(`ALTER TABLE MAINTENANCE_CONTRACT DROP CONSTRAINT FK_MC_CREATED_BY`);
    await queryRunner.query(`ALTER TABLE MAINTENANCE_CONTRACT DROP CONSTRAINT FK_MC_ASSIGNED_EMPLOYEE`);
    await queryRunner.query(`ALTER TABLE MAINTENANCE_CONTRACT DROP CONSTRAINT FK_MC_CUSTOMER`);
    await queryRunner.query(`DROP TABLE MAINTENANCE_CONTRACT`);
    await queryRunner.query(`DROP SEQUENCE SEQ_MAINTENANCE_CONTRACT`);
  }
}
