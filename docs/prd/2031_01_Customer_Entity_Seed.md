<!-- Generated: 2026-01-25 05:10:00 KST -->

# Customer Entity + Seed Data

**문서 번호**: 2031_01
**원본 PRD**: 2031_기술지원_관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.3 — Customer Entity' 참조
**구현 범위**: Customer 엔티티 정의, TypeORM Migration, Seed 데이터 삽입
**복잡도**: S
**의존성**: 없음 (선행 작업)

---

## 구현 목표

기술지원 등록 시 고객사 FK 참조에 필요한 Customer 엔티티를 최소한으로 정의하고, 초기 고객사 데이터를 seed로 삽입한다.

---

## 구현 내용

### 파일 구조

```
src/
├── entities/
│   └── Customer.ts              # Customer Entity 정의
├── migrations/
│   └── XXXXXX-CreateCustomer.ts # Customer 테이블 생성 Migration
└── scripts/
    └── seed-customers.ts        # 고객사 초기 데이터 삽입 스크립트
```

### 구현 상세

#### 1. Customer Entity (`src/entities/Customer.ts`)

- Table: `CUSTOMER`
- Columns: id, name, category, created_at, updated_at, deleted_at
- Category enum: `RESELLER`, `END_USER`, `MAINTENANCE`, `GENERAL`
- name에 UNIQUE 제약 조건 추가

#### 2. TypeORM Migration

- Sequence: `CUSTOMER_SEQ`
- Table: `CUSTOMER`
- Index: `IDX_CUSTOMER_DELETED_AT` (deleted_at)
- Index: `IDX_CUSTOMER_CATEGORY` (category)

#### 3. Seed Data

- 선진인포텍 거래처 기본 데이터 10~15건
- 카테고리별 균등 분배

### 핵심 인터페이스

```typescript
// src/entities/Customer.ts
export type CustomerCategory = 'RESELLER' | 'END_USER' | 'MAINTENANCE' | 'GENERAL';

@Entity('CUSTOMER')
@Index('IDX_CUSTOMER_DELETED_AT', ['deleted_at'])
@Index('IDX_CUSTOMER_CATEGORY', ['category'])
export class Customer {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  category!: CustomerCategory;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at!: Date | null;
}
```

```typescript
// src/scripts/seed-customers.ts
const customers = [
  { name: '삼성전자', category: 'END_USER' },
  { name: 'LG전자', category: 'END_USER' },
  { name: '한국통신', category: 'END_USER' },
  { name: '이노시스', category: 'RESELLER' },
  { name: '다산네트웍스', category: 'RESELLER' },
  { name: '유비쿼스', category: 'RESELLER' },
  { name: '한국전력', category: 'MAINTENANCE' },
  { name: '국방부', category: 'MAINTENANCE' },
  { name: '서울시청', category: 'GENERAL' },
  { name: '부산시청', category: 'GENERAL' },
];
```

---

## Acceptance Criteria

- [ ] Customer Entity 파일 생성 완료
- [ ] TypeORM Migration 생성 및 실행 성공
- [ ] Oracle DB에 CUSTOMER 테이블 생성 확인
- [ ] Seed data 10건 이상 삽입 확인
- [ ] `npm run build` 성공
- [ ] `npm run type-check` 통과

---

## 테스트 전략

### TypeScript & Lint

```bash
npm run build
npm run type-check
npm run lint
```

### 검증 방법

1. Migration 실행 후 Oracle에서 `SELECT * FROM CUSTOMER` 확인
2. `npm run build` 성공
3. Seed 스크립트 실행 후 데이터 존재 확인

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] Migration 실행 성공 (Oracle)
- [ ] Seed 데이터 삽입 완료
- [ ] UNIQUE 제약 조건 동작 확인

---

**다음 문서**: 2031_02_Customer_목록_API.md
