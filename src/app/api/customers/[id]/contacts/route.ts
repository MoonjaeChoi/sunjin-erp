// Generated: 2026-01-27 23:55:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface CreateContactRequest {
  name: string;
  title: string;
  department?: string;
  email: string;
  phone: string;
  description?: string;
  primaryContact?: boolean;
}

interface ContactResponse {
  id: number;
  customerId: number;
  name: string;
  title: string;
  department?: string;
  email: string;
  phone: string;
  description?: string;
  primaryContact: boolean;
  createdAt: string;
  updatedAt?: string;
}

function sanitizeHtml(input: string): string {
  return input.replace(/[<>]/g, (ch) => (ch === '<' ? '&lt;' : '&gt;'));
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone: string): boolean {
  const phoneRegex = /^[0-9\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/[^\d]/g, '').length >= 10;
}

function validateCreateContact(body: CreateContactRequest): string[] {
  const errors: string[] = [];

  if (!body.name || body.name.trim().length === 0) {
    errors.push('name is required');
  }
  if (body.name && body.name.length > 100) {
    errors.push('name must be 100 chars or less');
  }

  if (!body.title || body.title.trim().length === 0) {
    errors.push('title is required');
  }
  if (body.title && body.title.length > 50) {
    errors.push('title must be 50 chars or less');
  }

  if (body.department && body.department.length > 50) {
    errors.push('department must be 50 chars or less');
  }

  if (!body.email || body.email.trim().length === 0) {
    errors.push('email is required');
  }
  if (body.email && !validateEmail(body.email)) {
    errors.push('email format is invalid');
  }

  if (!body.phone || body.phone.trim().length === 0) {
    errors.push('phone is required');
  }
  if (body.phone && !validatePhone(body.phone)) {
    errors.push('phone format is invalid (required at least 10 digits)');
  }

  if (body.description && body.description.length > 200) {
    errors.push('description must be 200 chars or less');
  }

  return errors;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const customerId = Number(params.id);
  if (isNaN(customerId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    const ds = await getDataSource();
    const queryRunner = ds.createQueryRunner();

    try {
      const customerSql = `
        SELECT id FROM CUSTOMER
        WHERE id = :customerId AND deleted_at IS NULL
      `;
      const customers = await queryRunner.query(customerSql, { customerId });

      if (!customers || customers.length === 0) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }

      const sql = `
        SELECT
          id, customer_id as customerId, name, title, department, email, phone,
          description, primary_contact as primaryContact,
          created_at as createdAt, updated_at as updatedAt
        FROM CUSTOMER_CONTACT
        WHERE customer_id = :customerId AND deleted_at IS NULL
        ORDER BY primary_contact DESC, created_at ASC
      `;

      const contacts = await queryRunner.query(sql, { customerId });

      const response: ContactResponse[] = contacts.map((contact: any) => ({
        id: contact.id,
        customerId: contact.customerId,
        name: contact.name,
        title: contact.title,
        department: contact.department,
        email: contact.email,
        phone: contact.phone,
        description: contact.description,
        primaryContact: contact.primaryContact === 1 || contact.primaryContact === true,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      }));

      return NextResponse.json({ data: response }, { status: 200 });
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error(`GET /api/customers/${customerId}/contacts error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as any;
  if (!['MANAGER', 'ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const customerId = Number(params.id);
  if (isNaN(customerId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  let body: CreateContactRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const errors = validateCreateContact(body);
  if (errors.length > 0) {
    return NextResponse.json(
      { error: 'Validation failed', details: errors },
      { status: 400 }
    );
  }

  const sanitizedName = sanitizeHtml(body.name.trim());
  const sanitizedTitle = sanitizeHtml(body.title.trim());
  const sanitizedDepartment = body.department ? sanitizeHtml(body.department.trim()) : null;
  const sanitizedEmail = body.email.trim();
  const sanitizedPhone = body.phone.trim();
  const sanitizedDescription = body.description ? sanitizeHtml(body.description.trim()) : null;
  const primaryContact = body.primaryContact === true ? 1 : 0;

  try {
    const ds = await getDataSource();
    const queryRunner = ds.createQueryRunner();

    try {
      const customerSql = `
        SELECT id FROM CUSTOMER
        WHERE id = :customerId AND deleted_at IS NULL
      `;
      const customers = await queryRunner.query(customerSql, { customerId });

      if (!customers || customers.length === 0) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }

      if (primaryContact === 1) {
        const existingPrimarySql = `
          SELECT id FROM CUSTOMER_CONTACT
          WHERE customer_id = :customerId AND primary_contact = 1 AND deleted_at IS NULL
        `;
        const existingPrimary = await queryRunner.query(existingPrimarySql, {
          customerId,
        });

        if (existingPrimary && existingPrimary.length > 0) {
          const updatePrimarySql = `
            UPDATE CUSTOMER_CONTACT
            SET primary_contact = 0, updated_at = :now
            WHERE id = :id
          `;
          await queryRunner.query(updatePrimarySql, {
            id: existingPrimary[0].id,
            now: new Date(),
          });
        }
      }

      const now = new Date();
      const insertSql = `
        INSERT INTO CUSTOMER_CONTACT (
          customer_id, name, title, department, email, phone, description,
          primary_contact, created_at, updated_at
        ) VALUES (
          :customerId, :name, :title, :department, :email, :phone, :description,
          :primaryContact, :now, :now
        )
        RETURNING id, customer_id as customerId, name, title, department, email, phone,
                  description, primary_contact as primaryContact, created_at as createdAt
      `;

      const result = await queryRunner.query(insertSql, {
        customerId,
        name: sanitizedName,
        title: sanitizedTitle,
        department: sanitizedDepartment,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        description: sanitizedDescription,
        primaryContact,
        now,
      });

      const newContact = result[0] || result;

      const changedFieldsJson = {
        name: { before: null, after: sanitizedName },
        title: { before: null, after: sanitizedTitle },
        email: { before: null, after: sanitizedEmail },
        phone: { before: null, after: sanitizedPhone },
        ...(sanitizedDepartment && { department: { before: null, after: sanitizedDepartment } }),
        ...(sanitizedDescription && { description: { before: null, after: sanitizedDescription } }),
        ...(primaryContact === 1 && { primaryContact: { before: null, after: true } }),
      };

      const historyInsertSql = `
        INSERT INTO CUSTOMER_HISTORY (
          customer_id, change_type, changed_fields, changed_by_id, changed_at
        ) VALUES (
          :customerId, :changeType, :changedFields, :userId, :now
        )
      `;

      await queryRunner.query(historyInsertSql, {
        customerId,
        changeType: 'CONTACT_ADD',
        changedFields: JSON.stringify(changedFieldsJson),
        userId: user.id,
        now,
      });

      return NextResponse.json(
        {
          data: {
            id: newContact.id,
            customerId: newContact.customerId,
            name: newContact.name,
            title: newContact.title,
            department: newContact.department,
            email: newContact.email,
            phone: newContact.phone,
            description: newContact.description,
            primaryContact: newContact.primaryContact === 1 || newContact.primaryContact === true,
            createdAt: newContact.createdAt,
          },
          message: '담당자가 추가되었습니다.',
        },
        { status: 201 }
      );
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error(`POST /api/customers/${customerId}/contacts error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
