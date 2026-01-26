// Generated: 2026-01-27 22:50:00 KST

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type CustomerClassification = 'RESELLER' | 'END_USER' | 'MAINTENANCE' | 'GENERAL';

// Backward compatibility alias
export type CustomerCategory = CustomerClassification;

@Entity('CUSTOMER')
@Index('idx_customer_deleted_at', ['deletedAt'])
@Index('idx_customer_classification', ['classification'])
@Index('idx_customer_created_at', ['createdAt'])
export class Customer {
  @PrimaryGeneratedColumn({ name: 'id', type: 'number' })
  id!: number;

  @Column({
    name: 'name',
    type: 'varchar2',
    length: 200,
    nullable: false,
  })
  name!: string;

  @Column({
    name: 'code',
    type: 'varchar2',
    length: 20,
    nullable: false,
    unique: true,
  })
  code!: string; // Auto-generated: CUST-00001

  @Column({
    name: 'classification',
    type: 'varchar2',
    length: 20,
    nullable: false,
  })
  classification!: CustomerClassification;

  @Column({
    name: 'address',
    type: 'varchar2',
    length: 500,
    nullable: true,
  })
  address?: string;

  @Column({
    name: 'phone',
    type: 'varchar2',
    length: 20,
    nullable: true,
  })
  phone?: string;

  @Column({
    name: 'email',
    type: 'varchar2',
    length: 100,
    nullable: true,
  })
  email?: string;

  @Column({
    name: 'memo',
    type: 'clob',
    nullable: true,
  })
  memo?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'created_by_id', type: 'number', nullable: false })
  createdById!: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'updated_by_id', type: 'number', nullable: false })
  updatedById!: number;

  @Column({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
  })
  deletedAt?: Date | null;

}
