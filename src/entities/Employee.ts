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
@Index('IDX_EMPLOYEE_DELETED_AT', ['deleted_at'])
export class Employee {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id!: number;

  @Column({ name: 'name', type: 'varchar', length: 50, nullable: false })
  name!: string;

  @Column({ name: 'username', type: 'varchar', length: 50, nullable: false, unique: true })
  username!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 200, nullable: false })
  password_hash!: string;

  @Column({ name: 'role', type: 'varchar', length: 20, nullable: false, default: "'USER'" })
  role!: EmployeeRole;

  @Column({ name: 'department_id', type: 'int', nullable: true })
  department_id!: number | null;

  @Column({ name: 'email', type: 'varchar', length: 100, nullable: true })
  email!: string | null;

  @Column({ name: 'position', type: 'varchar', length: 50, nullable: true })
  position!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deleted_at!: Date | null;
}
