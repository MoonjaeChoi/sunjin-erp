// Generated: 2026-01-25 05:20:00 KST

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

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
