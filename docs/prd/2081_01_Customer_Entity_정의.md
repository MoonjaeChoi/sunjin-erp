<!-- Generated: 2026-01-27 22:45:00 KST -->

# Customer + CustomerContact Entity 정의

**문서 번호**: 2081_01
**원본 PRD**: docs/prd/2081_고객_등록_및_조회_prd_v2.md
**PRD 참조**: 원본 PRD의 "5.3 Database" 섹션 참조
**구현 범위**: TypeORM Entity 정의 (CUSTOMER, CUSTOMER_CONTACT 테이블)
**복잡도**: S (0.5~1일)
**의존성**: Employee Entity 존재 확인 필수

---

## 구현 목표

CUSTOMER (고객) 및 CUSTOMER_CONTACT (고객담당자) TypeORM 엔티티를 정의하여 데이터베이스 스키마 기반을 구성합니다. 모든 RBAC 정책(ADMIN-only 삭제, MANAGER 담당자 관리)과 검증 규칙(고유성, 이메일/전화 형식)을 엔티티 레벨에서 명시합니다.

---

## 파일 구조

```
src/entities/
├── Customer.ts        (새 파일 - 고객 엔티티)
└── CustomerContact.ts (새 파일 - 고객담당자 엔티티)
```

---

## 구현 상세

### 1. Customer Entity (`src/entities/Customer.ts`)

**핵심 정책:**
- **고객명 고유성**: `name` 칼럼에 partial unique index (soft delete 제외: `deleted_at IS NULL`)
- **고객 코드**: SEQUENCE로 자동 생성 (형식: `CUST-{5digit}`)
- **고객 분류**: enum (RESELLER, END_USER, MAINTENANCE, GENERAL)
- **메타데이터**: created_at, updated_at, deleted_at (soft delete)
- **FK**: created_by_id, updated_by_id (Employee 참조)

**TypeORM Entity 구조:**

```typescript
import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Employee } from './Employee';
import { CustomerContact } from './CustomerContact';
import { CustomerHistory } from './CustomerHistory';

@Entity('CUSTOMER')
@Index('idx_customer_name', ['name'], { where: 'deleted_at IS NULL', unique: true })
@Index('idx_customer_classification', ['classification'])
@Index('idx_customer_created_at', ['createdAt'])
@Index('idx_customer_deleted_at', ['deletedAt'])
export class Customer {
  @PrimaryColumn('number')
  id: number;

  @Column('varchar2', { length: 200, nullable: false })
  name: string; // 고객사명 (고유성: partial unique index)

  @Column('varchar2', { length: 20, nullable: false, unique: true })
  code: string; // 고객 코드 (CUST-00001 형식, SEQUENCE로 자동 생성)

  @Column('varchar2', {
    length: 20,
    nullable: false,
    check: "classification IN ('RESELLER', 'END_USER', 'MAINTENANCE', 'GENERAL')"
  })
  classification: 'RESELLER' | 'END_USER' | 'MAINTENANCE' | 'GENERAL';

  @Column('varchar2', { length: 500, nullable: true })
  address: string; // 주소

  @Column('varchar2', { length: 20, nullable: true })
  phone: string; // 대표 전화

  @Column('varchar2', { length: 100, nullable: true })
  email: string; // 대표 이메일

  @Column('clob', { nullable: true })
  memo: string; // 메모 (최대 1000자, 클라이언트에서 검증)

  @CreateDateColumn()
  createdAt: Date; // 등록일

  @Column('number', { nullable: false })
  createdById: number; // 등록자 ID (FK → Employee)

  @UpdateDateColumn()
  updatedAt: Date; // 수정일

  @Column('number', { nullable: false })
  updatedById: number; // 수정자 ID (FK → Employee)

  @Column('timestamp', { nullable: true })
  deletedAt: Date | null; // 소프트 삭제

  // Relations
  @ManyToOne(() => Employee, { lazy: false })
  createdBy: Employee;

  @ManyToOne(() => Employee, { lazy: false })
  updatedBy: Employee;

  @OneToMany(() => CustomerContact, (contact) => contact.customer)
  contacts: CustomerContact[];

  @OneToMany(() => CustomerHistory, (history) => history.customer)
  histories: CustomerHistory[];
}
```

**컬럼 정의:**

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| `ID` | NUMBER | PK | 고객 고유 ID |
| `NAME` | VARCHAR2(200) | NOT NULL, UNIQUE (partial) | 고객사명 |
| `CODE` | VARCHAR2(20) | NOT NULL, UNIQUE | 고객 코드 (자동 생성: CUST-xxxxx) |
| `CLASSIFICATION` | VARCHAR2(20) | NOT NULL, CHECK | 고객 분류 (enum: RESELLER\|END_USER\|MAINTENANCE\|GENERAL) |
| `ADDRESS` | VARCHAR2(500) | NULL | 주소 |
| `PHONE` | VARCHAR2(20) | NULL | 대표 전화 |
| `EMAIL` | VARCHAR2(100) | NULL | 대표 이메일 |
| `MEMO` | CLOB | NULL | 메모 |
| `CREATED_AT` | TIMESTAMP | NOT NULL | 등록일 (자동) |
| `CREATED_BY_ID` | NUMBER | NOT NULL, FK | 등록자 (Employee FK) |
| `UPDATED_AT` | TIMESTAMP | NOT NULL | 수정일 (자동) |
| `UPDATED_BY_ID` | NUMBER | NOT NULL, FK | 수정자 (Employee FK) |
| `DELETED_AT` | TIMESTAMP | NULL | 소프트 삭제 |

**인덱스:**

```sql
CREATE INDEX idx_customer_name ON CUSTOMER(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_customer_classification ON CUSTOMER(classification);
CREATE INDEX idx_customer_created_at ON CUSTOMER(created_at);
CREATE INDEX idx_customer_deleted_at ON CUSTOMER(deleted_at);
```

---

### 2. CustomerContact Entity (`src/entities/CustomerContact.ts`)

**핵심 정책:**
- **독립 엔티티**: EMPLOYEE와 동기화하지 않음 (Decision 4)
- **Primary Contact**: 고객당 최대 1명 (Decision 9)
- **이메일/전화 중 최소 하나 필수**: 유효성 검증은 API에서 수행
- **Soft delete**: 담당자 삭제는 soft delete (과거 프로젝트/기술지원에 영향 없음)
- **FK 제약**: CUSTOMER 삭제 시 ON DELETE RESTRICT (의존성 검사 필요)

**TypeORM Entity 구조:**

```typescript
import { Entity, PrimaryColumn, Column, ManyToOne, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Customer } from './Customer';

@Entity('CUSTOMER_CONTACT')
@Index('idx_contact_customer_id', ['customerId'])
@Index('idx_contact_email_deleted', ['email', 'deletedAt'])
@Index('idx_contact_deleted_at', ['deletedAt'])
export class CustomerContact {
  @PrimaryColumn('number')
  id: number;

  @Column('number', { nullable: false })
  customerId: number; // 고객 ID (FK → CUSTOMER, ON DELETE RESTRICT)

  @Column('varchar2', { length: 100, nullable: false })
  name: string; // 담당자 이름

  @Column('varchar2', { length: 50, nullable: false })
  title: string; // 직급 (예: 과장, 대리)

  @Column('varchar2', { length: 50, nullable: true })
  department: string; // 부서

  @Column('varchar2', { length: 100, nullable: false })
  email: string; // 이메일 (유효성 검증: API 레벨)

  @Column('varchar2', { length: 20, nullable: false })
  phone: string; // 전화번호 (유효성 검증: API 레벨)

  @Column('varchar2', { length: 200, nullable: true })
  description: string; // 직무 설명

  @Column('boolean', { default: false, nullable: false })
  primaryContact: boolean; // 기본 담당자 여부 (고객당 max 1)

  @CreateDateColumn()
  createdAt: Date; // 등록일

  @UpdateDateColumn()
  updatedAt: Date; // 수정일

  @Column('timestamp', { nullable: true })
  deletedAt: Date | null; // 소프트 삭제

  // Relations
  @ManyToOne(() => Customer, (customer) => customer.contacts, { onDelete: 'RESTRICT' })
  customer: Customer;
}
```

**컬럼 정의:**

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| `ID` | NUMBER | PK | 담당자 고유 ID |
| `CUSTOMER_ID` | NUMBER | NOT NULL, FK | 고객 ID (ON DELETE RESTRICT) |
| `NAME` | VARCHAR2(100) | NOT NULL | 담당자 이름 |
| `TITLE` | VARCHAR2(50) | NOT NULL | 직급 |
| `DEPARTMENT` | VARCHAR2(50) | NULL | 부서 |
| `EMAIL` | VARCHAR2(100) | NOT NULL | 이메일 |
| `PHONE` | VARCHAR2(20) | NOT NULL | 전화번호 |
| `DESCRIPTION` | VARCHAR2(200) | NULL | 직무 설명 |
| `PRIMARY_CONTACT` | BOOLEAN | NOT NULL, DEFAULT 0 | 기본 담당자 (max 1/customer) |
| `CREATED_AT` | TIMESTAMP | NOT NULL | 등록일 |
| `UPDATED_AT` | TIMESTAMP | NOT NULL | 수정일 |
| `DELETED_AT` | TIMESTAMP | NULL | 소프트 삭제 |

**제약 조건:**

```sql
-- ON DELETE RESTRICT: CUSTOMER 삭제 시 담당자 존재 시 삭제 불가
ALTER TABLE CUSTOMER_CONTACT
ADD CONSTRAINT fk_contact_customer
FOREIGN KEY (customer_id) REFERENCES CUSTOMER(id) ON DELETE RESTRICT;

-- Primary Contact 최대 1명 (Application-level validation 권장)
-- 또는 unique partial index:
CREATE UNIQUE INDEX idx_contact_primary
ON CUSTOMER_CONTACT(customer_id)
WHERE primary_contact = 1 AND deleted_at IS NULL;
```

**인덱스:**

```sql
CREATE INDEX idx_contact_customer_id ON CUSTOMER_CONTACT(customer_id);
CREATE INDEX idx_contact_email_deleted ON CUSTOMER_CONTACT(email, deleted_at);
CREATE INDEX idx_contact_deleted_at ON CUSTOMER_CONTACT(deleted_at);
```

---

## Acceptance Criteria

- [ ] Customer Entity 정의 완료 (`src/entities/Customer.ts`)
  - [ ] PrimaryColumn `id` 정의
  - [ ] 고객명 고유성: partial unique index (soft delete 제외)
  - [ ] 고객 코드: VARCHAR2 unique (SEQUENCE 자동 생성은 API에서)
  - [ ] 고객 분류: enum 4가지
  - [ ] 메타데이터: created_at, updated_at, deleted_at
  - [ ] FK: created_by_id, updated_by_id (Employee 참조)
  - [ ] Relation: OneToMany contacts, histories

- [ ] CustomerContact Entity 정의 완료 (`src/entities/CustomerContact.ts`)
  - [ ] PrimaryColumn `id` 정의
  - [ ] 고객 FK: ON DELETE RESTRICT
  - [ ] 담당자 필드: name, title, department, email, phone, description
  - [ ] Primary Contact: boolean flag (max 1/customer)
  - [ ] Soft delete: deletedAt 칼럼
  - [ ] Relation: ManyToOne customer

- [ ] TypeScript 컴파일 성공 (`npm run type-check`)
  - [ ] 타입 정의 완벽성 검증

- [ ] ESLint 통과 (`npm run lint`)
  - [ ] 코드 스타일 준수

---

## 테스트 전략

### TypeScript & Lint

```bash
npm run type-check
npm run lint
npm run format
```

**검증 항목:**
- Entity 타입 정의 정확성
- Relation 설정 일관성
- Database 타입 (VARCHAR2, CLOB, TIMESTAMP 등) 호환성

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
  ```bash
  npm run build
  ✅ (에러 없음)
  ```

- [ ] TypeScript 검증 통과
  ```bash
  npm run type-check
  ✅ (에러 없음)
  ```

- [ ] ESLint 검증 통과
  ```bash
  npm run lint
  ✅ (경고 없음)
  ```

- [ ] 파일 생성 확인
  - [ ] `src/entities/Customer.ts` 존재
  - [ ] `src/entities/CustomerContact.ts` 존재

- [ ] Relation 테스트 (차후 Migration 후 확인)
  - [ ] Customer → CustomerContact 1:N 관계
  - [ ] Customer → Employee (created_by, updated_by)

---

**다음 문서**: 2081_02_CustomerHistory_Entity_및_Migration.md
