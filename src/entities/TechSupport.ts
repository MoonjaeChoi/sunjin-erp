// Generated: 2026-01-25 05:30:00 KST


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

export type SupportType = 'INSTALL' | 'TEST' | 'TRAINING' | 'MAINTENANCE' | 'GENERAL';
export type SupportMethod = 'ONSITE' | 'REMOTE' | 'PHONE';
export type SupportStatus = 'RECEIVED' | 'IN_PROGRESS' | 'COMPLETED';

@Entity('TECH_SUPPORT')
@Check('CHK_TS_START_TIME', '"start_time" IS NULL OR ("start_time" >= 0 AND "start_time" <= 1439)')
@Check('CHK_TS_END_TIME', '"end_time" IS NULL OR ("end_time" >= 0 AND "end_time" <= 1439)')
@Check('CHK_TS_TIME_ORDER', '("start_time" IS NULL OR "end_time" IS NULL) OR "start_time" < "end_time"')
@Index('IDX_TECHSUPPORT_DATE_EMPLOYEE', ['support_date', 'employee_id'])
@Index('IDX_TECHSUPPORT_CUSTOMER', ['customer_id'])
@Index('IDX_TECHSUPPORT_STATUS', ['status'])
@Index('IDX_TECHSUPPORT_DELETED_AT', ['deleted_at'])
export class TechSupport {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id!: number;

  @Column({ name: 'title', type: 'varchar', length: 200, nullable: false })
  title!: string;

  @Column({ name: 'description', type: 'clob', nullable: true })
  description!: string | null;

  @Column({ name: 'support_date', type: 'date', nullable: false })
  support_date!: Date;

  @Column({ name: 'start_time', type: 'int', nullable: true })
  start_time!: number | null;

  @Column({ name: 'end_time', type: 'int', nullable: true })
  end_time!: number | null;

  @Column({ name: 'support_type', type: 'varchar', length: 20, nullable: false })
  support_type!: SupportType;

  @Column({ name: 'support_method', type: 'varchar', length: 20, nullable: true })
  support_method!: SupportMethod | null;

  @Column({ name: 'status', type: 'varchar', length: 20, nullable: false, default: "'RECEIVED'" })
  status!: SupportStatus;

  @Column({ name: 'employee_id', type: 'int', nullable: false })
  employee_id!: number;

  @Column({ name: 'customer_id', type: 'int', nullable: false })
  customer_id!: number;

  @Column({ name: 'attachment_path', type: 'varchar', length: 500, nullable: true })
  attachment_path!: string | null;

  @Column({ name: 'attachment_name', type: 'varchar', length: 200, nullable: true })
  attachment_name!: string | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completed_at!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deleted_at!: Date | null;
}
