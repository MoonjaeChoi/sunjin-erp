// Generated: 2026-01-24 23:00:00 KST

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  Check,
} from 'typeorm';
import { TaskType, WorkType, TaskStatus } from '@/types/task';

@Entity('TASK')
@Check('CHK_TASK_START_TIME', '"start_time" IS NULL OR ("start_time" >= 0 AND "start_time" <= 1439)')
@Check('CHK_TASK_END_TIME', '"end_time" IS NULL OR ("end_time" >= 0 AND "end_time" <= 1439)')
@Check('CHK_TASK_TIME_ORDER', '("start_time" IS NULL OR "end_time" IS NULL) OR "start_time" < "end_time"')
@Index('IDX_TASK_DATE_EMPLOYEE', ['task_date', 'employee_id'])
@Index('IDX_TASK_EMPLOYEE_DATE', ['employee_id', 'task_date', 'deleted_at'])
@Index('IDX_TASK_EMPLOYEE_STATUS', ['employee_id', 'status'])
@Index('IDX_TASK_DELETED_AT', ['deleted_at'])
export class Task {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ type: 'varchar', length: 200, nullable: false })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'date', nullable: false })
  task_date!: Date;

  @Column({ type: 'int', nullable: true })
  start_time!: number | null;

  @Column({ type: 'int', nullable: true })
  end_time!: number | null;

  @Column({ type: 'varchar', length: 20, nullable: false })
  task_type!: TaskType;

  @Column({ type: 'varchar', length: 10, nullable: false })
  work_type!: WorkType;

  @Column({ type: 'varchar', length: 20, nullable: false, default: "'READY'" })
  status!: TaskStatus;

  @Column({ type: 'int', nullable: false })
  employee_id!: number;

  @Column({ type: 'int', nullable: true })
  customer_id!: number | null;

  @Column({ type: 'timestamp', nullable: true })
  completed_at!: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at!: Date | null;

  // Relations (Phase 1 구현 후 활성화)
  // @ManyToOne(() => Employee, { onDelete: 'RESTRICT' })
  // @JoinColumn({ name: 'employee_id' })
  // employee: Employee;

  // @ManyToOne(() => Customer, { onDelete: 'RESTRICT', nullable: true })
  // @JoinColumn({ name: 'customer_id' })
  // customer: Customer | null;
}
