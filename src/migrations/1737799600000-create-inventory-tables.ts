// Generated: 2026-01-26 10:15:00 KST

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInventoryTables1737799600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Sequences 생성
    await queryRunner.query(
      `CREATE SEQUENCE INVENTORY_SEQ START WITH 1 INCREMENT BY 1`
    );
    await queryRunner.query(
      `CREATE SEQUENCE INVENTORY_HISTORY_SEQ START WITH 1 INCREMENT BY 1`
    );

    // 2. INVENTORY 테이블 생성
    await queryRunner.query(`
      CREATE TABLE INVENTORY (
        id NUMBER DEFAULT INVENTORY_SEQ.NEXTVAL PRIMARY KEY,
        category VARCHAR2(50) NOT NULL,
        model VARCHAR2(255) NOT NULL,
        serial_number VARCHAR2(100) NOT NULL UNIQUE,
        purchase_date DATE NOT NULL,
        purchase_from VARCHAR2(255) NOT NULL,
        current_location VARCHAR2(255) NOT NULL,
        current_status VARCHAR2(20) DEFAULT '재고' NOT NULL,
        notes CLOB,
        created_by_id NUMBER NOT NULL,
        updated_by_id NUMBER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        deleted_at TIMESTAMP,
        CONSTRAINT CHK_INVENTORY_STATUS CHECK (current_status IN ('재고', '출고', '고장', '폐기'))
      )
    `);

    // 3. INVENTORY 테이블 인덱스 (Oracle XE는 부분 인덱스 미지원)
    // 고유 인덱스
    await queryRunner.query(
      `CREATE UNIQUE INDEX idx_inventory_serial ON INVENTORY(serial_number)`
    );

    // 필터링 성능 인덱스
    await queryRunner.query(
      `CREATE INDEX idx_inventory_status ON INVENTORY(current_status)`
    );
    await queryRunner.query(
      `CREATE INDEX idx_inventory_category ON INVENTORY(category)`
    );
    await queryRunner.query(
      `CREATE INDEX idx_inventory_location ON INVENTORY(current_location)`
    );

    // 검색 성능 인덱스
    await queryRunner.query(
      `CREATE INDEX idx_inventory_serial_search ON INVENTORY(serial_number)`
    );
    await queryRunner.query(
      `CREATE INDEX idx_inventory_model_search ON INVENTORY(model)`
    );

    // 감사 및 정렬 인덱스
    await queryRunner.query(
      `CREATE INDEX idx_inventory_created_at ON INVENTORY(created_at)`
    );
    await queryRunner.query(
      `CREATE INDEX idx_inventory_deleted_at ON INVENTORY(deleted_at)`
    );

    // 4. INVENTORY 외래키 추가
    await queryRunner.query(
      `ALTER TABLE INVENTORY ADD CONSTRAINT FK_INVENTORY_CREATED_BY FOREIGN KEY (created_by_id) REFERENCES EMPLOYEE(id) ON DELETE RESTRICT`
    );
    await queryRunner.query(
      `ALTER TABLE INVENTORY ADD CONSTRAINT FK_INVENTORY_UPDATED_BY FOREIGN KEY (updated_by_id) REFERENCES EMPLOYEE(id) ON DELETE RESTRICT`
    );

    // 5. INVENTORY_HISTORY 테이블 생성 (불변 감사 추적 - deleted_at 없음)
    await queryRunner.query(`
      CREATE TABLE INVENTORY_HISTORY (
        id NUMBER DEFAULT INVENTORY_HISTORY_SEQ.NEXTVAL PRIMARY KEY,
        inventory_id NUMBER NOT NULL,
        change_type VARCHAR2(20) NOT NULL,
        previous_location VARCHAR2(255),
        new_location VARCHAR2(255),
        previous_status VARCHAR2(20),
        new_status VARCHAR2(20),
        checkout_location VARCHAR2(255),
        expected_checkin_date DATE,
        reason VARCHAR2(500),
        changed_by_id NUMBER NOT NULL,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // 6. INVENTORY_HISTORY 테이블 인덱스
    await queryRunner.query(
      `CREATE INDEX idx_inventory_history_inventory_id ON INVENTORY_HISTORY(inventory_id)`
    );
    await queryRunner.query(
      `CREATE INDEX idx_inventory_history_changed_at ON INVENTORY_HISTORY(changed_at)`
    );
    await queryRunner.query(
      `CREATE INDEX idx_inventory_history_change_type ON INVENTORY_HISTORY(change_type)`
    );

    // 7. INVENTORY_HISTORY 외래키 추가
    await queryRunner.query(
      `ALTER TABLE INVENTORY_HISTORY ADD CONSTRAINT FK_INVENTORY_HISTORY_INVENTORY FOREIGN KEY (inventory_id) REFERENCES INVENTORY(id) ON DELETE RESTRICT`
    );
    await queryRunner.query(
      `ALTER TABLE INVENTORY_HISTORY ADD CONSTRAINT FK_INVENTORY_HISTORY_CHANGED_BY FOREIGN KEY (changed_by_id) REFERENCES EMPLOYEE(id) ON DELETE RESTRICT`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 인덱스 제거 (INVENTORY_HISTORY)
    await queryRunner.query(`DROP INDEX idx_inventory_history_change_type`);
    await queryRunner.query(`DROP INDEX idx_inventory_history_changed_at`);
    await queryRunner.query(`DROP INDEX idx_inventory_history_inventory_id`);

    // 외래키 제거
    await queryRunner.query(
      `ALTER TABLE INVENTORY_HISTORY DROP CONSTRAINT FK_INVENTORY_HISTORY_CHANGED_BY`
    );
    await queryRunner.query(
      `ALTER TABLE INVENTORY_HISTORY DROP CONSTRAINT FK_INVENTORY_HISTORY_INVENTORY`
    );
    await queryRunner.query(
      `ALTER TABLE INVENTORY DROP CONSTRAINT FK_INVENTORY_UPDATED_BY`
    );
    await queryRunner.query(
      `ALTER TABLE INVENTORY DROP CONSTRAINT FK_INVENTORY_CREATED_BY`
    );

    // 테이블 및 시퀀스 제거
    await queryRunner.query(`DROP TABLE INVENTORY_HISTORY`);
    await queryRunner.query(`DROP SEQUENCE INVENTORY_HISTORY_SEQ`);

    // 인덱스 제거 (INVENTORY)
    await queryRunner.query(`DROP INDEX idx_inventory_deleted_at`);
    await queryRunner.query(`DROP INDEX idx_inventory_created_at`);
    await queryRunner.query(`DROP INDEX idx_inventory_model_search`);
    await queryRunner.query(`DROP INDEX idx_inventory_serial_search`);
    await queryRunner.query(`DROP INDEX idx_inventory_location`);
    await queryRunner.query(`DROP INDEX idx_inventory_category`);
    await queryRunner.query(`DROP INDEX idx_inventory_status`);
    await queryRunner.query(`DROP INDEX idx_inventory_serial_active`);

    await queryRunner.query(`DROP TABLE INVENTORY`);
    await queryRunner.query(`DROP SEQUENCE INVENTORY_SEQ`);
  }
}
