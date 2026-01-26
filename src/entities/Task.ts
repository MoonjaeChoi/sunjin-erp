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
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id!: number;

  @Column({ name: 'title', type: 'varchar', length: 200, nullable: false })
  title!: string;

  @Column({ name: 'description', type: 'clob', nullable: true })
  description!: string | null;

  @Column({ name: 'task_date', type: 'date', nullable: false })
  task_date!: Date;

  @Column({ name: 'start_time', type: 'int', nullable: true })
  start_time!: number | null;

  @Column({ name: 'end_time', type: 'int', nullable: true })
  end_time!: number | null;

  @Column({ name: 'task_type', type: 'varchar', length: 20, nullable: false })
  task_type!: TaskType;

  @Column({ name: 'work_type', type: 'varchar', length: 10, nullable: false })
  work_type!: WorkType;

  @Column({ name: 'status', type: 'varchar', length: 20, nullable: false, default: "'READY'" })
  status!: TaskStatus;

  @Column({ name: 'employee_id', type: 'int', nullable: false })
  employee_id!: number;

  @Column({ name: 'customer_id', type: 'int', nullable: true })
  customer_id!: number | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completed_at!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deleted_at!: Date | null;

  // Relations (Phase 1 구현 후 활성화)
  // @ManyToOne(() => Employee, { onDelete: 'RESTRICT' })
  // @JoinColumn({ name: 'employee_id' })
  // employee: Employee;

  // @ManyToOne(() => Customer, { onDelete: 'RESTRICT', nullable: true })
  // @JoinColumn({ name: 'customer_id' })
  // customer: Customer | null;
}
