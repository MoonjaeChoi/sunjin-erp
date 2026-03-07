// Generated: 2026-01-25 21:42:00 KST

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIssueTables20260128000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Sequences 생성
    await queryRunner.query(`CREATE SEQUENCE ISSUE_SEQ START WITH 1 INCREMENT BY 1`);
    await queryRunner.query(`CREATE SEQUENCE ISSUE_ATTACHMENT_SEQ START WITH 1 INCREMENT BY 1`);
    await queryRunner.query(`CREATE SEQUENCE ISSUE_HISTORY_SEQ START WITH 1 INCREMENT BY 1`);

    // 2. ISSUE 테이블 생성
    await queryRunner.query(`
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
        deleted_at TIMESTAMP,
        CONSTRAINT CHK_ISSUE_TREATMENT_TIME CHECK (treatment_time_minutes IS NULL OR (treatment_time_minutes >= 1 AND treatment_time_minutes <= 1440))
      )
    `);

    // 3. ISSUE 테이블 인덱스
    await queryRunner.query(`CREATE INDEX IDX_ISSUE_CUSTOMER_ID ON ISSUE(customer_id)`);
    await queryRunner.query(`CREATE INDEX IDX_ISSUE_CREATED_BY_ID ON ISSUE(created_by_id)`);
    await queryRunner.query(`CREATE INDEX IDX_ISSUE_ASSIGNED_TO_ID ON ISSUE(assigned_to_id)`);
    await queryRunner.query(`CREATE INDEX IDX_ISSUE_STATUS ON ISSUE(status)`);
    await queryRunner.query(`CREATE INDEX IDX_ISSUE_DELETED_AT ON ISSUE(deleted_at)`);

    // 4. ISSUE 외래키 추가
    await queryRunner.query(
      `ALTER TABLE ISSUE ADD CONSTRAINT FK_ISSUE_CUSTOMER FOREIGN KEY (customer_id) REFERENCES CUSTOMER("id")`
    );
    await queryRunner.query(
      `ALTER TABLE ISSUE ADD CONSTRAINT FK_ISSUE_CREATED_BY FOREIGN KEY (created_by_id) REFERENCES EMPLOYEE("id")`
    );
    await queryRunner.query(
      `ALTER TABLE ISSUE ADD CONSTRAINT FK_ISSUE_ASSIGNED_TO FOREIGN KEY (assigned_to_id) REFERENCES EMPLOYEE("id") ON DELETE SET NULL`
    );

    // 5. ISSUE_ATTACHMENT 테이블 생성
    await queryRunner.query(`
      CREATE TABLE ISSUE_ATTACHMENT (
        id NUMBER DEFAULT ISSUE_ATTACHMENT_SEQ.NEXTVAL PRIMARY KEY,
        issue_id NUMBER NOT NULL,
        file_name VARCHAR2(255) NOT NULL,
        file_path VARCHAR2(512) NOT NULL,
        file_size NUMBER NOT NULL,
        uploaded_by_id NUMBER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        deleted_at TIMESTAMP
      )
    `);

    // 6. ISSUE_ATTACHMENT 테이블 인덱스
    await queryRunner.query(`CREATE INDEX IDX_ISSUE_ATTACHMENT_ISSUE_ID ON ISSUE_ATTACHMENT(issue_id)`);
    await queryRunner.query(`CREATE INDEX IDX_ISSUE_ATTACHMENT_DELETED_AT ON ISSUE_ATTACHMENT(deleted_at)`);

    // 7. ISSUE_ATTACHMENT 외래키 추가 (ON DELETE RESTRICT)
    await queryRunner.query(
      `ALTER TABLE ISSUE_ATTACHMENT ADD CONSTRAINT FK_ISSUE_ATTACHMENT_ISSUE FOREIGN KEY (issue_id) REFERENCES ISSUE(id)`
    );
    await queryRunner.query(
      `ALTER TABLE ISSUE_ATTACHMENT ADD CONSTRAINT FK_ISSUE_ATTACHMENT_UPLOADED_BY FOREIGN KEY (uploaded_by_id) REFERENCES EMPLOYEE("id")`
    );

    // 8. ISSUE_HISTORY 테이블 생성
    await queryRunner.query(`
      CREATE TABLE ISSUE_HISTORY (
        id NUMBER DEFAULT ISSUE_HISTORY_SEQ.NEXTVAL PRIMARY KEY,
        issue_id NUMBER NOT NULL,
        change_type VARCHAR2(50) NOT NULL,
        old_value VARCHAR2(255),
        new_value VARCHAR2(255),
        changed_by_id NUMBER NOT NULL,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        remark CLOB
      )
    `);

    // 9. ISSUE_HISTORY 테이블 인덱스
    await queryRunner.query(`CREATE INDEX IDX_ISSUE_HISTORY_ISSUE_ID ON ISSUE_HISTORY(issue_id)`);
    await queryRunner.query(`CREATE INDEX IDX_ISSUE_HISTORY_CHANGED_AT ON ISSUE_HISTORY(changed_at)`);

    // 10. ISSUE_HISTORY 외래키 추가 (불변 감사 추적)
    await queryRunner.query(
      `ALTER TABLE ISSUE_HISTORY ADD CONSTRAINT FK_ISSUE_HISTORY_ISSUE FOREIGN KEY (issue_id) REFERENCES ISSUE(id)`
    );
    await queryRunner.query(
      `ALTER TABLE ISSUE_HISTORY ADD CONSTRAINT FK_ISSUE_HISTORY_EMPLOYEE FOREIGN KEY (changed_by_id) REFERENCES EMPLOYEE("id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 외래키 제거
    await queryRunner.query(`ALTER TABLE ISSUE_HISTORY DROP CONSTRAINT FK_ISSUE_HISTORY_CHANGED_BY`);
    await queryRunner.query(`ALTER TABLE ISSUE_HISTORY DROP CONSTRAINT FK_ISSUE_HISTORY_ISSUE`);
    await queryRunner.query(`ALTER TABLE ISSUE_ATTACHMENT DROP CONSTRAINT FK_ISSUE_ATTACHMENT_UPLOADED_BY`);
    await queryRunner.query(`ALTER TABLE ISSUE_ATTACHMENT DROP CONSTRAINT FK_ISSUE_ATTACHMENT_ISSUE`);
    await queryRunner.query(`ALTER TABLE ISSUE DROP CONSTRAINT FK_ISSUE_ASSIGNED_TO`);
    await queryRunner.query(`ALTER TABLE ISSUE DROP CONSTRAINT FK_ISSUE_CREATED_BY`);
    await queryRunner.query(`ALTER TABLE ISSUE DROP CONSTRAINT FK_ISSUE_CUSTOMER`);

    // 테이블 및 시퀀스 제거
    await queryRunner.query(`DROP TABLE ISSUE_HISTORY`);
    await queryRunner.query(`DROP SEQUENCE ISSUE_HISTORY_SEQ`);

    await queryRunner.query(`DROP TABLE ISSUE_ATTACHMENT`);
    await queryRunner.query(`DROP SEQUENCE ISSUE_ATTACHMENT_SEQ`);

    await queryRunner.query(`DROP TABLE ISSUE`);
    await queryRunner.query(`DROP SEQUENCE ISSUE_SEQ`);
  }
}
