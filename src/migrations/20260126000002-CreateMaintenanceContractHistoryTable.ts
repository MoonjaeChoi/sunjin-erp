// Generated: 2026-01-26 00:02:00 KST

import { MigrationInterface, QueryRunner } from 'typeorm';

// lowercase columns (quoted raw SQL) — maintenance history API uses quoted lowercase identifiers
export class CreateMaintenanceContractHistoryTable20260126000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SEQUENCE SEQ_MAINTENANCE_CONTRACT_HISTORY START WITH 1 INCREMENT BY 1 NOCACHE`);

    await queryRunner.query(`
      CREATE TABLE MAINTENANCE_CONTRACT_HISTORY (
        "id" NUMBER DEFAULT SEQ_MAINTENANCE_CONTRACT_HISTORY.NEXTVAL PRIMARY KEY,
        "maintenance_contract_id" NUMBER NOT NULL,
        "change_type" VARCHAR2(50) NOT NULL,
        "previous_end_date" DATE,
        "new_end_date" DATE,
        "reason" VARCHAR2(500),
        "changed_by_id" NUMBER NOT NULL,
        "changed_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "deleted_at" TIMESTAMP
      )
    `);

    await queryRunner.query(`ALTER TABLE MAINTENANCE_CONTRACT_HISTORY ADD CONSTRAINT CHK_MCH_CHANGE_TYPE CHECK ("change_type" IN ('갱신', '상태변경', '정보수정'))`);
    await queryRunner.query(`ALTER TABLE MAINTENANCE_CONTRACT_HISTORY ADD CONSTRAINT FK_MCH_CONTRACT FOREIGN KEY ("maintenance_contract_id") REFERENCES MAINTENANCE_CONTRACT("id")`);
    await queryRunner.query(`ALTER TABLE MAINTENANCE_CONTRACT_HISTORY ADD CONSTRAINT FK_MCH_CHANGED_BY FOREIGN KEY ("changed_by_id") REFERENCES EMPLOYEE(ID)`);

    await queryRunner.query(`CREATE INDEX IDX_MCH_CONTRACT_ID ON MAINTENANCE_CONTRACT_HISTORY("maintenance_contract_id")`);
    await queryRunner.query(`CREATE INDEX IDX_MCH_CHANGED_BY_ID ON MAINTENANCE_CONTRACT_HISTORY("changed_by_id")`);
    await queryRunner.query(`CREATE INDEX IDX_MCH_CHANGED_AT ON MAINTENANCE_CONTRACT_HISTORY("changed_at")`);
    await queryRunner.query(`CREATE INDEX IDX_MCH_CHANGE_TYPE ON MAINTENANCE_CONTRACT_HISTORY("change_type")`);
    await queryRunner.query(`CREATE INDEX IDX_MCH_DELETED_AT ON MAINTENANCE_CONTRACT_HISTORY("deleted_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_MCH_DELETED_AT`);
    await queryRunner.query(`DROP INDEX IDX_MCH_CHANGE_TYPE`);
    await queryRunner.query(`DROP INDEX IDX_MCH_CHANGED_AT`);
    await queryRunner.query(`DROP INDEX IDX_MCH_CHANGED_BY_ID`);
    await queryRunner.query(`DROP INDEX IDX_MCH_CONTRACT_ID`);
    await queryRunner.query(`ALTER TABLE MAINTENANCE_CONTRACT_HISTORY DROP CONSTRAINT FK_MCH_CHANGED_BY`);
    await queryRunner.query(`ALTER TABLE MAINTENANCE_CONTRACT_HISTORY DROP CONSTRAINT FK_MCH_CONTRACT`);
    await queryRunner.query(`DROP TABLE MAINTENANCE_CONTRACT_HISTORY`);
    await queryRunner.query(`DROP SEQUENCE SEQ_MAINTENANCE_CONTRACT_HISTORY`);
  }
}
