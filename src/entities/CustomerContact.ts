// Generated: 2026-01-27 22:50:00 KST

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('CUSTOMER_CONTACT')
@Index('idx_contact_customer_id', ['customerId'])
@Index('idx_contact_email_deleted', ['email', 'deletedAt'])
@Index('idx_contact_deleted_at', ['deletedAt'])
export class CustomerContact {
  @PrimaryGeneratedColumn({ name: 'id', type: 'number' })
  id!: number;

  @Column({ name: 'customer_id', type: 'number', nullable: false })
  customerId!: number;

  @Column({
    name: 'name',
    type: 'varchar2',
    length: 100,
    nullable: false,
  })
  name!: string;

  @Column({
    name: 'title',
    type: 'varchar2',
    length: 50,
    nullable: false,
  })
  title!: string; // 직급: 과장, 대리 등

  @Column({
    name: 'department',
    type: 'varchar2',
    length: 50,
    nullable: true,
  })
  department?: string;

  @Column({
    name: 'email',
    type: 'varchar2',
    length: 100,
    nullable: false,
  })
  email!: string;

  @Column({
    name: 'phone',
    type: 'varchar2',
    length: 20,
    nullable: false,
  })
  phone!: string;

  @Column({
    name: 'description',
    type: 'varchar2',
    length: 200,
    nullable: true,
  })
  description?: string;

  @Column({
    name: 'primary_contact',
    type: 'number',
    default: 0,
    nullable: false,
  })
  primaryContact!: boolean; // Max 1 per customer

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
  })
  deletedAt?: Date | null;

}
