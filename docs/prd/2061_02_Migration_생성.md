<!-- Generated: 2026-01-25 21:30:00 KST -->

# Inventory 테이블 Migration 생성

**문서 번호**: 2061_02
**원본 PRD**: 2061_재고_관리_prd_v2.md
**구현 범위**: src/migrations/YYYYMMDDHHMMSS-create-inventory-tables.ts
**복잡도**: M
**의존성**: 2061_01 (Entity 정의)

---

## 구현 목표

Inventory와 InventoryHistory 테이블을 Oracle XE 21c에 생성하는 TypeORM Migration을 작성한다. 부분 고유 인덱스, CHECK 제약, 성능 최적화 인덱스를 포함하며, 데이터 무결성과 감사 추적(audit trail)을 보장한다.

---

## 구현 내용

### 파일 구조

```
src/migrations/
└── 1706500000000-create-inventory-tables.ts   # Migration 파일
```

### 구현 상세

#### Migration 파일: `src/migrations/1706500000000-create-inventory-tables.ts`

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInventoryTables1706500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create INVENTORY table
    await queryRunner.query(`
      CREATE TABLE INVENTORY (
        id NUMBER PRIMARY KEY,
        category VARCHAR2(50) NOT NULL,
        model VARCHAR2(255) NOT NULL,
        serial_number VARCHAR2(100) NOT NULL,
        purchase_date DATE NOT NULL,
        purchase_from VARCHAR2(255) NOT NULL,
        current_location VARCHAR2(255) NOT NULL,
        current_status VARCHAR2(20) NOT NULL,
        notes CLOB,
        created_by_id NUMBER NOT NULL,
        updated_by_id NUMBER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        deleted_at TIMESTAMP,
        CONSTRAINT fk_inventory_created_by FOREIGN KEY (created_by_id) REFERENCES EMPLOYEE(id) ON DELETE RESTRICT,
        CONSTRAINT fk_inventory_updated_by FOREIGN KEY (updated_by_id) REFERENCES EMPLOYEE(id) ON DELETE RESTRICT,
        CONSTRAINT chk_inventory_status CHECK (current_status IN ('재고', '출고', '고장', '폐기'))
      )
    `);

    // Create INVENTORY_ID sequence
    await queryRunner.query(`
      CREATE SEQUENCE INVENTORY_ID_SEQ
        START WITH 1
        INCREMENT BY 1
        NOCYCLE
    `);

    // Create partial unique index (serial_number active only)
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_inventory_serial_active
      ON INVENTORY(serial_number)
      WHERE deleted_at IS NULL
    `);

    // Create lookup indexes for filtering and searching
    await queryRunner.query(`
      CREATE INDEX idx_inventory_status
      ON INVENTORY(current_status)
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_inventory_category
      ON INVENTORY(category)
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_inventory_location
      ON INVENTORY(current_location)
      WHERE deleted_at IS NULL
    `);

    // Create search indexes (prefix search support)
    await queryRunner.query(`
      CREATE INDEX idx_inventory_serial_search
      ON INVENTORY(serial_number)
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_inventory_model_search
      ON INVENTORY(model)
      WHERE deleted_at IS NULL
    `);

    // Create audit indexes
    await queryRunner.query(`
      CREATE INDEX idx_inventory_created_at
      ON INVENTORY(created_at)
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_inventory_deleted_at
      ON INVENTORY(deleted_at)
    `);

    // Create INVENTORY_HISTORY table
    await queryRunner.query(`
      CREATE TABLE INVENTORY_HISTORY (
        id NUMBER PRIMARY KEY,
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
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        CONSTRAINT fk_inventory_history_inventory FOREIGN KEY (inventory_id) REFERENCES INVENTORY(id) ON DELETE RESTRICT,
        CONSTRAINT fk_inventory_history_changed_by FOREIGN KEY (changed_by_id) REFERENCES EMPLOYEE(id) ON DELETE RESTRICT,
        CONSTRAINT chk_inventory_history_change_type CHECK (change_type IN ('입고', '출고', '반납', '위치변경', '상태변경'))
      )
    `);

    // Create INVENTORY_HISTORY_ID sequence
    await queryRunner.query(`
      CREATE SEQUENCE INVENTORY_HISTORY_ID_SEQ
        START WITH 1
        INCREMENT BY 1
        NOCYCLE
    `);

    // Create indexes for history lookup
    await queryRunner.query(`
      CREATE INDEX idx_inventory_history_inventory_id
      ON INVENTORY_HISTORY(inventory_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_inventory_history_changed_at
      ON INVENTORY_HISTORY(changed_at)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_inventory_history_change_type
      ON INVENTORY_HISTORY(change_type)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX idx_inventory_history_change_type`);
    await queryRunner.query(`DROP INDEX idx_inventory_history_changed_at`);
    await queryRunner.query(`DROP INDEX idx_inventory_history_inventory_id`);

    // Drop INVENTORY_HISTORY table
    await queryRunner.query(`DROP TABLE INVENTORY_HISTORY`);
    await queryRunner.query(`DROP SEQUENCE INVENTORY_HISTORY_ID_SEQ`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX idx_inventory_deleted_at`);
    await queryRunner.query(`DROP INDEX idx_inventory_created_at`);
    await queryRunner.query(`DROP INDEX idx_inventory_model_search`);
    await queryRunner.query(`DROP INDEX idx_inventory_serial_search`);
    await queryRunner.query(`DROP INDEX idx_inventory_location`);
    await queryRunner.query(`DROP INDEX idx_inventory_category`);
    await queryRunner.query(`DROP INDEX idx_inventory_status`);
    await queryRunner.query(`DROP INDEX idx_inventory_serial_active`);

    // Drop INVENTORY table
    await queryRunner.query(`DROP TABLE INVENTORY`);
    await queryRunner.query(`DROP SEQUENCE INVENTORY_ID_SEQ`);
  }
}
```

### 핵심 설계 결정

#### 1. 부분 고유 인덱스 (Partial Unique Index)
```sql
CREATE UNIQUE INDEX idx_inventory_serial_active
ON INVENTORY(serial_number)
WHERE deleted_at IS NULL
```
- Oracle 12c+ 지원
- 소프트 삭제된 레코드는 시리얼번호 재사용 가능
- 활성 레코드만 유니크 보장

#### 2. CHECK 제약 (CHECK Constraint)
```sql
CONSTRAINT chk_inventory_status CHECK (current_status IN ('재고', '출고', '고장', '폐기'))
CONSTRAINT chk_inventory_history_change_type CHECK (change_type IN ('입고', '출고', '반납', '위치변경', '상태변경'))
```
- DB 레벨 데이터 무결성 보장
- 애플리케이션 검증과 중복 방어

#### 3. 시퀀스 (Sequences)
```sql
CREATE SEQUENCE INVENTORY_ID_SEQ START WITH 1 INCREMENT BY 1 NOCYCLE;
CREATE SEQUENCE INVENTORY_HISTORY_ID_SEQ START WITH 1 INCREMENT BY 1 NOCYCLE;
```
- PrimaryGeneratedColumn에서 자동 사용

#### 4. 인덱스 전략

| 인덱스 | 목적 | 쿼리 유형 |
|--------|------|---------|
| idx_inventory_serial_active | 중복 방지 | INSERT/UPDATE 검증 |
| idx_inventory_status | 상태 필터링 | WHERE current_status = ? |
| idx_inventory_category | 카테고리 필터링 | WHERE category = ? |
| idx_inventory_location | 위치 검색 | WHERE current_location LIKE ? |
| idx_inventory_serial_search | 시리얼 검색 | WHERE serial_number LIKE ? |
| idx_inventory_model_search | 모델명 검색 | WHERE model LIKE ? |
| idx_inventory_created_at | 정렬/범위 | ORDER BY created_at |
| idx_inventory_deleted_at | 소프트 삭제 필터 | WHERE deleted_at IS NULL |
| idx_inventory_history_inventory_id | 이력 조회 | WHERE inventory_id = ? |
| idx_inventory_history_changed_at | 이력 정렬 | ORDER BY changed_at |
| idx_inventory_history_change_type | 이력 필터링 | WHERE change_type = ? |

#### 5. ON DELETE RESTRICT
- 자식 레코드가 있으면 부모 삭제 불가
- InventoryHistory가 있으면 Inventory 삭제 불가
- 데이터 무결성 보장

---

## Acceptance Criteria

- [ ] Migration 파일 생성 완료
- [ ] INVENTORY 테이블 생성 (모든 컬럼, 기본값 포함)
- [ ] INVENTORY_HISTORY 테이블 생성 (deleted_at 없음)
- [ ] INVENTORY_ID_SEQ 시퀀스 생성
- [ ] INVENTORY_HISTORY_ID_SEQ 시퀀스 생성
- [ ] 부분 고유 인덱스 (serial_number, deleted_at IS NULL)
- [ ] CHECK 제약 조건 (status, change_type)
- [ ] 외래키 제약 (ON DELETE RESTRICT)
- [ ] 조회/필터링 성능 인덱스 (status, category, location)
- [ ] 검색 성능 인덱스 (serial_number, model)
- [ ] 감사 인덱스 (created_at, deleted_at, changed_at)
- [ ] Migration up/down 동작 확인
- [ ] `npx typeorm migration:run` 성공
- [ ] Oracle 테이블 존재 확인

---

## 테스트 전략

### 마이그레이션 실행

```bash
npx typeorm migration:generate -n CreateInventoryTables
npx typeorm migration:run
```

### 검증 방법

1. Oracle SQLPlus로 테이블 및 시퀀스 확인
   ```sql
   SELECT * FROM USER_TABLES WHERE TABLE_NAME = 'INVENTORY';
   SELECT * FROM USER_INDEXES WHERE TABLE_NAME = 'INVENTORY';
   ```

2. 부분 고유 인덱스 동작 확인
   - 활성 레코드에서 시리얼번호 중복 방지 확인
   - 삭제된 레코드의 시리얼번호 재사용 가능 확인

3. CHECK 제약 확인
   - 잘못된 상태값 INSERT 시도 → ORA-02290 에러

4. 외래키 제약 확인
   - Inventory 삭제 시 자식 InventoryHistory 있으면 → ORA-02292 에러

5. 성능 테스트
   - 대규모 데이터셋(10,000+) with 각 인덱스별 쿼리 성능

---

**다음 문서**: 2061_03_재고_목록_조회_API.md
