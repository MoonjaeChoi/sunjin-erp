<!-- Generated: 2026-01-24 22:50:00 KST -->

# TypeORM Task Entity 정의

**문서 번호**: 2011_01
**원본 PRD**: 2011_대시보드_및_일정관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.3 Database' 참조
**구현 범위**: Task 엔티티 클래스 정의 (TypeORM + Oracle XE 21c)
**복잡도**: S
**의존성**: 없음

---

## 구현 목표

Task 테이블에 대응하는 TypeORM Entity 클래스를 정의한다. Oracle XE 21c의 데이터 타입 규칙을 준수하고, soft delete, CHECK 제약조건, FK 관계를 포함한다.

---

## 구현 내용

### 파일 구조

```
src/
├── entities/
│   └── Task.ts           # Task Entity 정의
└── types/
    └── task.ts           # Task 관련 Enum 타입 (공유용)
```

### 구현 상세

**Task Entity 주요 사항:**
- Sequence 기반 auto-increment PK (`id`)
- `task_date`: Oracle DATE 타입
- `start_time`, `end_time`: NUMBER 타입 (분 단위, 0~1439, nullable)
- `task_type`: VARCHAR2(20), Enum 값 검증
- `work_type`: VARCHAR2(10), Enum 값 검증
- `status`: VARCHAR2(20), DEFAULT 'READY'
- `employee_id`: FK → Employee(id), ON DELETE RESTRICT
- `customer_id`: FK → Customer(id), NULLABLE, ON DELETE RESTRICT
- `completed_at`: TIMESTAMP, NULLABLE (API 레벨 자동 설정)
- `deleted_at`: TIMESTAMP, NULLABLE (soft delete)
- `created_at`, `updated_at`: TIMESTAMP, NOT NULL

**Enum 정의 (별도 파일):**
- `TaskType`: DOCUMENT | TEST | MEETING | TRAINING | OTHER
- `WorkType`: OFFICE | FIELD
- `TaskStatus`: READY | IN_PROGRESS | DONE

### 핵심 인터페이스

```typescript
// src/types/task.ts
export enum TaskType {
  DOCUMENT = 'DOCUMENT',
  TEST = 'TEST',
  MEETING = 'MEETING',
  TRAINING = 'TRAINING',
  OTHER = 'OTHER',
}

export enum WorkType {
  OFFICE = 'OFFICE',
  FIELD = 'FIELD',
}

export enum TaskStatus {
  READY = 'READY',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}
```

```typescript
// src/entities/Task.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn, Check,
} from 'typeorm';

@Entity('TASK')
@Check('CHK_TASK_START_TIME', '"start_time" IS NULL OR ("start_time" >= 0 AND "start_time" <= 1439)')
@Check('CHK_TASK_END_TIME', '"end_time" IS NULL OR ("end_time" >= 0 AND "end_time" <= 1439)')
@Check('CHK_TASK_TIME_ORDER', '("start_time" IS NULL OR "end_time" IS NULL) OR "start_time" < "end_time"')
export class Task {
  @PrimaryGeneratedColumn({ type: 'number' })
  id: number;

  @Column({ type: 'varchar2', length: 200, nullable: false })
  title: string;

  @Column({ type: 'clob', nullable: true })
  description: string | null;

  @Column({ type: 'date', nullable: false })
  task_date: Date;

  @Column({ type: 'number', nullable: true })
  start_time: number | null;

  @Column({ type: 'number', nullable: true })
  end_time: number | null;

  @Column({ type: 'varchar2', length: 20, nullable: false })
  task_type: TaskType;

  @Column({ type: 'varchar2', length: 10, nullable: false })
  work_type: WorkType;

  @Column({ type: 'varchar2', length: 20, nullable: false, default: 'READY' })
  status: TaskStatus;

  @Column({ type: 'number', nullable: false })
  employee_id: number;

  @Column({ type: 'number', nullable: true })
  customer_id: number | null;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;

  // Relations (Phase 1 구현 후 활성화)
  // @ManyToOne(() => Employee, { onDelete: 'RESTRICT' })
  // @JoinColumn({ name: 'employee_id' })
  // employee: Employee;

  // @ManyToOne(() => Customer, { onDelete: 'RESTRICT', nullable: true })
  // @JoinColumn({ name: 'customer_id' })
  // customer: Customer | null;
}
```

---

## Acceptance Criteria

- [ ] `src/entities/Task.ts` 파일 생성 완료
- [ ] `src/types/task.ts` 파일 생성 완료 (Enum 정의)
- [ ] 모든 15개 컬럼이 PRD 스키마와 일치
- [ ] CHECK 제약조건 3개 정의 (start_time, end_time, time_order)
- [ ] soft delete (`@DeleteDateColumn`) 적용
- [ ] `npm run type-check` 통과
- [ ] `npm run build` 성공

---

## 테스트 전략

### TypeScript & Lint

```bash
npm run build         # Next.js 빌드
npm run type-check    # TypeScript strict
npm run lint          # ESLint
```

### 단위 테스트

**테스트 파일 위치**: `src/__tests__/entities/Task.test.ts`

```typescript
describe('Task Entity', () => {
  it('should have correct column definitions', () => {
    // Entity metadata 검증
  });

  it('should have correct CHECK constraints', () => {
    // CHECK constraint 존재 검증
  });

  it('should have soft delete column', () => {
    // deleted_at column 존재 검증
  });
});
```

### 검증 방법

1. `npm run build` 성공
2. `npm run type-check` 통과
3. Entity 파일의 타입 정합성 확인

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] Entity 컬럼 15개 정의 완료
- [ ] Enum 타입 3개 정의 완료
- [ ] CHECK 제약조건 3개 정의
- [ ] FK 관계 주석 처리 (Phase 1 완료 후 활성화)
- [ ] soft delete 적용

---

**다음 문서**: 2011_02_Migration_생성.md
