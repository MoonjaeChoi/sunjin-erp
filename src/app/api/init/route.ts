// Generated: 2026-01-27 10:30:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeUpdate } from '@/lib/db-direct';

// 초기화 API - 마이그레이션 및 테스트 데이터 생성
export async function POST(req: NextRequest) {
  try {
    // 테이블 존재 확인
    const result = await executeQuery(
      `SELECT COUNT(*) as TOTAL FROM user_tables WHERE table_name = 'INVENTORY'`
    );

    if (result.rows[0]?.TOTAL > 0) {
      return NextResponse.json(
        { message: 'INVENTORY 테이블이 이미 존재합니다' },
        { status: 200 }
      );
    }

    // Sequences 생성
    await executeUpdate(`CREATE SEQUENCE INVENTORY_SEQ START WITH 1 INCREMENT BY 1`);
    await executeUpdate(`CREATE SEQUENCE INVENTORY_HISTORY_SEQ START WITH 1 INCREMENT BY 1`);

    // INVENTORY 테이블 생성
    await executeUpdate(`
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

    // 인덱스 생성 (Oracle XE는 부분 인덱스 미지원)
    await executeUpdate(`CREATE UNIQUE INDEX idx_inventory_serial ON INVENTORY(serial_number)`);
    await executeUpdate(`CREATE INDEX idx_inventory_status ON INVENTORY(current_status)`);
    await executeUpdate(`CREATE INDEX idx_inventory_category ON INVENTORY(category)`);

    // 외래키 추가
    await executeUpdate(
      `ALTER TABLE INVENTORY ADD CONSTRAINT FK_INVENTORY_CREATED_BY FOREIGN KEY (created_by_id) REFERENCES EMPLOYEE(id) ON DELETE RESTRICT`
    );
    await executeUpdate(
      `ALTER TABLE INVENTORY ADD CONSTRAINT FK_INVENTORY_UPDATED_BY FOREIGN KEY (updated_by_id) REFERENCES EMPLOYEE(id) ON DELETE RESTRICT`
    );

    // INVENTORY_HISTORY 테이블 생성
    await executeUpdate(`
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

    // INVENTORY_HISTORY 외래키
    await executeUpdate(
      `ALTER TABLE INVENTORY_HISTORY ADD CONSTRAINT FK_INVENTORY_HISTORY_INVENTORY FOREIGN KEY (inventory_id) REFERENCES INVENTORY(id) ON DELETE RESTRICT`
    );
    await executeUpdate(
      `ALTER TABLE INVENTORY_HISTORY ADD CONSTRAINT FK_INVENTORY_HISTORY_CHANGED_BY FOREIGN KEY (changed_by_id) REFERENCES EMPLOYEE(id) ON DELETE RESTRICT`
    );

    return NextResponse.json(
      { message: '✅ Inventory 테이블 마이그레이션 완료' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Init error:', error);
    return NextResponse.json(
      { error: error.message || '초기화 실패' },
      { status: 500 }
    );
  }
}
