// Generated: 2026-01-28 03:00:00 KST

import { NextRequest } from 'next/server';

const mockGetServerSession = jest.fn();
jest.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));

const mockExecuteQuery = jest.fn();
const mockExecuteUpdate = jest.fn();
jest.mock('@/lib/db-direct', () => ({
  executeQuery: (...args: any[]) => mockExecuteQuery(...args),
  executeUpdate: (...args: any[]) => mockExecuteUpdate(...args),
}));

// Mock bcryptjs
const mockHashedPassword = '$2b$12$mockhashedpassword';
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$mockhashedpassword'),
}));

jest.mock('@/lib/auth', () => ({ authOptions: {} }));

import { POST as CreateAccount } from '@/app/api/employees/[id]/accounts/route';
import { POST as DeactivateAccount } from '@/app/api/employees/[id]/deactivate/route';
import { POST as ReactivateAccount } from '@/app/api/employees/[id]/reactivate/route';

function createRequest(url: string, options?: { method?: string; body?: any }) {
  const req = new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: options?.method || 'GET',
    ...(options?.body && {
      body: JSON.stringify(options.body),
      headers: { 'Content-Type': 'application/json' },
    }),
  });
  return req;
}

describe('POST /api/employees/[id]/accounts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = createRequest('http://localhost:3000/api/employees/1/accounts', {
      method: 'POST',
      body: { username: 'testuser', password: 'Test1234!', role: 'USER' },
    });
    const res = await CreateAccount(req, { params: Promise.resolve({ id: '1' }) });
    const body = await res.json();

    expect(res.status).toBe(401);
  });

  it('should return 403 for non-ADMIN', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'MANAGER' },
    });

    const req = createRequest('http://localhost:3000/api/employees/1/accounts', {
      method: 'POST',
      body: { username: 'testuser', password: 'Test1234!', role: 'USER' },
    });
    const res = await CreateAccount(req, { params: Promise.resolve({ id: '1' }) });
    const body = await res.json();

    expect(res.status).toBe(403);
  });

  it('should validate password strength', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    // Employee exists
    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{ ID: 1, NAME: '홍길동' }],
      rowCount: 1,
    });

    const req = createRequest('http://localhost:3000/api/employees/1/accounts', {
      method: 'POST',
      body: { username: 'testuser', password: 'weak', role: 'USER' },
    });
    const res = await CreateAccount(req, { params: Promise.resolve({ id: '1' }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errors.password).toBeDefined();
  });

  it('should validate username format', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{ ID: 1, NAME: '홍길동' }],
      rowCount: 1,
    });

    const req = createRequest('http://localhost:3000/api/employees/1/accounts', {
      method: 'POST',
      body: { username: 'ab', password: 'Test1234!', role: 'USER' },
    });
    const res = await CreateAccount(req, { params: Promise.resolve({ id: '1' }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errors.username).toBeDefined();
  });

  it('should reject duplicate username', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    // Employee exists
    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{ ID: 1, NAME: '홍길동' }],
      rowCount: 1,
    });
    // No existing account
    mockExecuteQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    // Username duplicate
    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{ ID: 99 }],
      rowCount: 1,
    });

    const req = createRequest('http://localhost:3000/api/employees/1/accounts', {
      method: 'POST',
      body: { username: 'existinguser', password: 'Test1234!', role: 'USER' },
    });
    const res = await CreateAccount(req, { params: Promise.resolve({ id: '1' }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errors.username).toContain('이미 사용 중');
  });

  it('should create account with bcrypt hash', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    // Employee exists
    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{ ID: 1, NAME: '홍길동' }],
      rowCount: 1,
    });
    // No existing account
    mockExecuteQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    // Username not duplicate
    mockExecuteQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    // Insert account
    mockExecuteUpdate.mockResolvedValueOnce({ rowsAffected: 1 });
    // Get created account
    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{ ID: 100, USERNAME: 'testuser', ROLE: 'USER', IS_ACTIVE: 1 }],
      rowCount: 1,
    });
    // Insert history
    mockExecuteUpdate.mockResolvedValueOnce({ rowsAffected: 1 });

    const req = createRequest('http://localhost:3000/api/employees/1/accounts', {
      method: 'POST',
      body: { username: 'testuser', password: 'Test1234!', role: 'USER' },
    });
    const res = await CreateAccount(req, { params: Promise.resolve({ id: '1' }) });
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.username).toBe('testuser');
    expect(body.data.temporaryPassword).toBe('Test1234!');
  });

  it('should return temporary password once', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    mockExecuteQuery.mockResolvedValueOnce({ rows: [{ ID: 1, NAME: '홍길동' }], rowCount: 1 });
    mockExecuteQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    mockExecuteQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    mockExecuteUpdate.mockResolvedValueOnce({ rowsAffected: 1 });
    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{ ID: 100, USERNAME: 'testuser', ROLE: 'USER', IS_ACTIVE: 1 }],
      rowCount: 1,
    });
    mockExecuteUpdate.mockResolvedValueOnce({ rowsAffected: 1 });

    const req = createRequest('http://localhost:3000/api/employees/1/accounts', {
      method: 'POST',
      body: { username: 'testuser', password: 'Test1234!', role: 'USER' },
    });
    const res = await CreateAccount(req, { params: Promise.resolve({ id: '1' }) });
    const body = await res.json();

    // temporaryPassword is only returned on creation
    expect(body.data.temporaryPassword).toBeDefined();
  });
});

describe('POST /api/employees/[id]/deactivate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = createRequest('http://localhost:3000/api/employees/1/deactivate', {
      method: 'POST',
    });
    const res = await DeactivateAccount(req, { params: Promise.resolve({ id: '1' }) });

    expect(res.status).toBe(401);
  });

  it('should return 403 for non-ADMIN', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'MANAGER' },
    });

    const req = createRequest('http://localhost:3000/api/employees/1/deactivate', {
      method: 'POST',
    });
    const res = await DeactivateAccount(req, { params: Promise.resolve({ id: '1' }) });

    expect(res.status).toBe(403);
  });

  it('should prevent self-deactivation', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 5, role: 'ADMIN', employeeId: 1 },
    });

    // Employee exists with account
    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{ ID: 1, NAME: '홍길동', ACCOUNT_ID: 5 }],
      rowCount: 1,
    });

    const req = createRequest('http://localhost:3000/api/employees/1/deactivate', {
      method: 'POST',
    });
    const res = await DeactivateAccount(req, { params: Promise.resolve({ id: '1' }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toContain('자신의 계정');
  });

  it('should deactivate account', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN', employeeId: 99 },
    });

    // Employee exists with active account
    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{ ID: 5, NAME: '테스트', ACCOUNT_ID: 50, IS_ACTIVE: 1 }],
      rowCount: 1,
    });
    // Deactivate
    mockExecuteUpdate.mockResolvedValueOnce({ rowsAffected: 1 });
    // Record history
    mockExecuteUpdate.mockResolvedValueOnce({ rowsAffected: 1 });

    const req = createRequest('http://localhost:3000/api/employees/5/deactivate', {
      method: 'POST',
    });
    const res = await DeactivateAccount(req, { params: Promise.resolve({ id: '5' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toContain('비활성화');
  });

  it('should record DEACTIVATE history', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN', employeeId: 99 },
    });

    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{ ID: 5, NAME: '테스트', ACCOUNT_ID: 50, IS_ACTIVE: 1 }],
      rowCount: 1,
    });
    mockExecuteUpdate.mockResolvedValueOnce({ rowsAffected: 1 });
    mockExecuteUpdate.mockResolvedValueOnce({ rowsAffected: 1 });

    const req = createRequest('http://localhost:3000/api/employees/5/deactivate', {
      method: 'POST',
    });
    await DeactivateAccount(req, { params: Promise.resolve({ id: '5' }) });

    const historyCall = mockExecuteUpdate.mock.calls[1];
    expect(historyCall[0]).toContain('INSERT INTO EMPLOYEE_HISTORY');
    expect(historyCall[1].changeType).toBe('DEACTIVATE');
  });
});

describe('POST /api/employees/[id]/reactivate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = createRequest('http://localhost:3000/api/employees/1/reactivate', {
      method: 'POST',
    });
    const res = await ReactivateAccount(req, { params: Promise.resolve({ id: '1' }) });

    expect(res.status).toBe(401);
  });

  it('should reactivate account', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 1, role: 'ADMIN' },
    });

    // Employee exists with inactive account
    mockExecuteQuery.mockResolvedValueOnce({
      rows: [{ ID: 5, NAME: '테스트', ACCOUNT_ID: 50, IS_ACTIVE: 0 }],
      rowCount: 1,
    });
    // Reactivate
    mockExecuteUpdate.mockResolvedValueOnce({ rowsAffected: 1 });
    // Record history
    mockExecuteUpdate.mockResolvedValueOnce({ rowsAffected: 1 });

    const req = createRequest('http://localhost:3000/api/employees/5/reactivate', {
      method: 'POST',
    });
    const res = await ReactivateAccount(req, { params: Promise.resolve({ id: '5' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toContain('활성화');
  });
});
