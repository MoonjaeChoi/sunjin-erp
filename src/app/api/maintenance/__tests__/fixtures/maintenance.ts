// Generated: 2026-01-27 00:10:00 KST

/**
 * Mock data fixtures for Maintenance API tests
 */

export const mockSession = {
  user: (role: string = 'USER') => ({
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role,
  }),
};

export const mockContract = {
  active: {
    id: 1,
    contract_name: '유지보수 계약 1',
    contract_type: 'standard',
    start_date: new Date('2026-01-01'),
    end_date: new Date('2026-12-31'),
    contract_status: '활성',
    contract_amount: 5000000,
    customer_id: 1,
    assigned_employee_id: 1,
    created_by_id: 1,
    updated_by_id: 1,
    customer: { id: 1, name: 'ABC Corp' },
    assignedEmployee: { id: 1, name: 'Kim' },
    createdBy: { id: 1, name: 'Kim' },
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    deleted_at: null,
  },
  terminated: {
    id: 2,
    contract_name: '유지보수 계약 2',
    contract_status: '종료',
    end_date: new Date('2025-12-31'),
    deleted_at: null,
  },
  renewalPending: {
    id: 3,
    contract_name: '유지보수 계약 3',
    contract_status: '갱신예정',
    deleted_at: null,
  },
};

export const mockAttachment = {
  basic: {
    id: 1,
    maintenance_contract_id: 1,
    file_name: 'contract.pdf',
    file_path: 'maintenance/uuid-contract.pdf',
    file_size: 102400,
    uploaded_by_id: 1,
    created_at: new Date(),
    deleted_at: null,
  },
};

export const mockHistory = {
  renewal: {
    id: 1,
    maintenance_contract_id: 1,
    change_type: '갱신',
    previous_end_date: new Date('2026-12-31'),
    new_end_date: new Date('2027-12-31'),
    reason: '계약 갱신',
    changed_by_id: 1,
    changed_by: { id: 1, name: 'Kim' },
    changed_at: new Date(),
    deleted_at: null,
  },
  statusChange: {
    id: 2,
    maintenance_contract_id: 1,
    change_type: '상태변경',
    reason: '계약 종료',
    changed_by_id: 1,
    changed_at: new Date(),
    deleted_at: null,
  },
};

export const mockDataSource = {
  isInitialized: true,
  createQueryRunner: jest.fn(() => ({
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    query: jest.fn(),
  })),
  getRepository: jest.fn(),
};
