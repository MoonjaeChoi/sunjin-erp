// Generated: 2026-01-25 01:00:00 KST

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

export type EmployeeRole = 'ADMIN' | 'MANAGER' | 'USER';

@Entity('EMPLOYEE')
@Index('IDX_EMPLOYEE_USERNAME', ['username'], { unique: true })
@Index('IDX_EMPLOYEE_DELETED_AT', ['deleted_at'])
export class Employee {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ type: 'varchar', length: 50, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 50, nullable: false, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 200, nullable: false })
  password_hash!: string;

  @Column({ type: 'varchar', length: 20, nullable: false, default: "'USER'" })
  role!: EmployeeRole;

  @Column({ type: 'int', nullable: true })
  department_id!: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  position!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at!: Date | null;
}
