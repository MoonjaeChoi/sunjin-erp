// Generated: 2026-01-27 22:50:00 KST

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

export type ChangeType = 'CREATE' | 'UPDATE' | 'DELETE' | 'CONTACT_ADD' | 'CONTACT_DELETE';

@Entity('CUSTOMER_HISTORY')
@Index('idx_history_customer_id', ['customerId'])
@Index('idx_history_changed_at', ['changedAt'])
@Index('idx_history_customer_changed', ['customerId', 'changedAt'])
export class CustomerHistory {
  @PrimaryGeneratedColumn({ name: 'id', type: 'number' })
  id!: number;

  @Column({ name: 'customer_id', type: 'number', nullable: false })
  customerId!: number;

  @Column({
    name: 'change_type',
    type: 'varchar2',
    length: 20,
    nullable: false,
  })
  changeType!: ChangeType;

  @Column({
    name: 'changed_fields',
    type: 'clob',
    nullable: false,
  })
  changedFields!: string; // JSON: {"fieldName": {"before": old, "after": new}, ...}

  @Column({ name: 'changed_by_id', type: 'number', nullable: false })
  changedById!: number;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt!: Date;

}
