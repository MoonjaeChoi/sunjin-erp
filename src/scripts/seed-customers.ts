// Generated: 2026-01-25 05:20:00 KST

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Customer, CustomerCategory } from '../entities/Customer';

const customers: { name: string; category: CustomerCategory }[] = [
  { name: '삼성전자', category: 'END_USER' },
  { name: 'LG전자', category: 'END_USER' },
  { name: '한국통신', category: 'END_USER' },
  { name: '현대자동차', category: 'END_USER' },
  { name: '이노시스', category: 'RESELLER' },
  { name: '다산네트웍스', category: 'RESELLER' },
  { name: '유비쿼스', category: 'RESELLER' },
  { name: '한국전력', category: 'MAINTENANCE' },
  { name: '국방부', category: 'MAINTENANCE' },
  { name: '한국도로공사', category: 'MAINTENANCE' },
  { name: '서울시청', category: 'GENERAL' },
  { name: '부산시청', category: 'GENERAL' },
];

async function seed() {
  const dataSource = new DataSource({
    type: 'oracle',
    host: process.env.ORACLE_HOST || 'localhost',
    port: Number(process.env.ORACLE_PORT) || 1521,
    serviceName: process.env.ORACLE_SERVICE_NAME || 'FREEPDB1',
    username: process.env.ORACLE_USERNAME || 'sunjin_admin',
    password: process.env.ORACLE_PASSWORD || '',
    entities: [Customer],
    synchronize: false,
    logging: true,
  });

  await dataSource.initialize();
  console.log('DataSource initialized');

  const repo = dataSource.getRepository(Customer);

  for (const customer of customers) {
    const existing = await repo.findOne({ where: { name: customer.name } });
    if (!existing) {
      await repo.save(repo.create(customer));
      console.log(`  Inserted: ${customer.name} (${customer.category})`);
    } else {
      console.log(`  Skipped (exists): ${customer.name}`);
    }
  }

  console.log(`\nSeed complete: ${customers.length} customers processed`);
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
