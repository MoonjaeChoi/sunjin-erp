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
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id!: number;

  @Column({ name: 'name', type: 'varchar', length: 100, nullable: false, unique: true })
  name!: string;

  @Column({ name: 'category', type: 'varchar', length: 20, nullable: false })
  category!: CustomerCategory;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deleted_at!: Date | null;
}
