// Generated: 2026-01-27 01:35:00 KST
// TypeORM DataSource for running migrations
// This file is used with: npx typeorm migration:run --dataSource src/lib/db-migrator.ts

import { DataSource } from 'typeorm';
import { Task } from '../entities/Task';
import { Employee } from '../entities/Employee';
import { Customer } from '../entities/Customer';
import { CustomerContact } from '../entities/CustomerContact';
import { CustomerHistory } from '../entities/CustomerHistory';
import { TechSupport } from '../entities/TechSupport';
import { Project } from '../entities/Project';
import { ProjectAttachment } from '../entities/ProjectAttachment';
import { Issue } from '../entities/Issue';
import { IssueAttachment } from '../entities/IssueAttachment';
import { IssueHistory } from '../entities/IssueHistory';
import { Inventory } from '../entities/Inventory';
import { InventoryHistory } from '../entities/InventoryHistory';
import { MaintenanceContract } from '../entities/MaintenanceContract';
import { MaintenanceContractAttachment } from '../entities/MaintenanceContractAttachment';
import { MaintenanceContractHistory } from '../entities/MaintenanceContractHistory';

export const dataSource = new DataSource({
  type: 'oracle',
  host: process.env.ORACLE_HOST || 'localhost',
  port: Number(process.env.ORACLE_PORT) || 1521,
  serviceName: process.env.ORACLE_SERVICE_NAME || 'XEPDB1',
  username: process.env.ORACLE_USERNAME || 'sunjin_admin',
  password: process.env.ORACLE_PASSWORD || '',
  entities: [
    Task,
    Employee,
    Customer,
    CustomerContact,
    CustomerHistory,
    TechSupport,
    Project,
    ProjectAttachment,
    Issue,
    IssueAttachment,
    IssueHistory,
    Inventory,
    InventoryHistory,
    MaintenanceContract,
    MaintenanceContractAttachment,
    MaintenanceContractHistory,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: ['error', 'warn'],
  ssl: false,
});
