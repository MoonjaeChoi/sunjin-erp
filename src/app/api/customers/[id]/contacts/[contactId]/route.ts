// Generated: 2026-01-27 10:32:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery, executeUpdate, executeQuerySingle } from '@/lib/db-direct';

export const dynamic = 'force-dynamic';

interface UpdateContactRequest {
  name?: string;
  title?: string;
  department?: string | null;
  email?: string;
  phone?: string;
  description?: string | null;
  primaryContact?: boolean;
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

function validateUpdateContact(body: UpdateContactRequest): string[] {
  const errors: string[] = [];

  if (body.name !== undefined) {
    if (body.name.trim().length === 0) errors.push('name cannot be empty');
    if (body.name.length > 100) errors.push('name must be 100 chars or less');
  }

  if (body.title !== undefined) {
    if (body.title.trim().length === 0) errors.push('title cannot be empty');
    if (body.title.length > 50) errors.push('title must be 50 chars or less');
  }

  if (body.department !== undefined && body.department !== null && body.department.length > 50) {
    errors.push('department must be 50 chars or less');
  }

  if (body.email !== undefined && !validateEmail(body.email)) {
    errors.push('email format is invalid');
  }

  if (body.phone !== undefined && !validatePhone(body.phone)) {
    errors.push('phone format is invalid (required at least 10 digits)');
  }

  if (body.description !== undefined && body.description !== null && body.description.length > 200) {
    errors.push('description must be 200 chars or less');
  }

  return errors;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; contactId: string } }
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
  const contactId = Number(params.contactId);
  if (isNaN(customerId) || isNaN(contactId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  let body: UpdateContactRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const errors = validateUpdateContact(body);
  if (errors.length > 0) {
    return NextResponse.json(
      { error: 'Validation failed', details: errors },
      { status: 400 }
    );
  }

  try {
    const customerResult = await executeQuerySingle(
      `SELECT id FROM CUSTOMER WHERE id = :customerId AND deleted_at IS NULL`,
      { customerId }
    );

    if (!customerResult) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const contactSql = `
      SELECT id, name, title, department, email, phone, description, primary_contact as primaryContact,
             updated_at as updatedAt
      FROM CUSTOMER_CONTACT
      WHERE id = :contactId AND customer_id = :customerId AND deleted_at IS NULL
    `;
    const currentContact = await executeQuerySingle(contactSql, { contactId, customerId });

    if (!currentContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    const updateFields: any = {};
    const updateColumns: string[] = [];
    const params: any = { contactId, customerId };
    const now = new Date();
    params.now = now;

    if (body.name !== undefined) {
      const sanitized = sanitizeHtml(body.name.trim());
      updateFields.name = sanitized;
      updateColumns.push(`name = :name`);
      params.name = sanitized;
    }

    if (body.title !== undefined) {
      const sanitized = sanitizeHtml(body.title.trim());
      updateFields.title = sanitized;
      updateColumns.push(`title = :title`);
      params.title = sanitized;
    }

    if (body.department !== undefined) {
      const sanitized = body.department !== null ? sanitizeHtml(body.department.trim()) : null;
      updateFields.department = sanitized;
      updateColumns.push(`department = :department`);
      params.department = sanitized;
    }

    if (body.email !== undefined) {
      const sanitized = body.email.trim();
      updateFields.email = sanitized;
      updateColumns.push(`email = :email`);
      params.email = sanitized;
    }

    if (body.phone !== undefined) {
      const sanitized = body.phone.trim();
      updateFields.phone = sanitized;
      updateColumns.push(`phone = :phone`);
      params.phone = sanitized;
    }

    if (body.description !== undefined) {
      const sanitized = body.description !== null ? sanitizeHtml(body.description.trim()) : null;
      updateFields.description = sanitized;
      updateColumns.push(`description = :description`);
      params.description = sanitized;
    }

    if (body.primaryContact !== undefined) {
      const newPrimaryValue = body.primaryContact === true ? 1 : 0;
      updateFields.primaryContact = body.primaryContact;
      updateColumns.push(`primary_contact = :primaryContact`);
      params.primaryContact = newPrimaryValue;

      if (newPrimaryValue === 1 && (currentContact.primaryContact === 1 || currentContact.primaryContact === true) === false) {
        const existingPrimary = await executeQuerySingle(
          `SELECT id FROM CUSTOMER_CONTACT WHERE customer_id = :customerId AND primary_contact = 1 AND deleted_at IS NULL AND id != :contactId`,
          { customerId, contactId }
        );

        if (existingPrimary) {
          await executeUpdate(
            `UPDATE CUSTOMER_CONTACT SET primary_contact = 0, updated_at = :now WHERE id = :id`,
            { id: existingPrimary.id, now }
          );
        }
      }
    }

    if (updateColumns.length === 0) {
      return NextResponse.json(
        { data: { id: currentContact.id, customerId, ...currentContact }, message: '업데이트할 내용이 없습니다.' },
        { status: 200 }
      );
    }

    updateColumns.push(`updated_at = :now`);

    const updateSql = `
      UPDATE CUSTOMER_CONTACT
      SET ${updateColumns.join(', ')}
      WHERE id = :contactId AND customer_id = :customerId
    `;

    await executeUpdate(updateSql, params);

    const changedFieldsJson: any = {};

    if (updateFields.name !== undefined) {
      changedFieldsJson.name = { before: currentContact.name, after: updateFields.name };
    }
    if (updateFields.title !== undefined) {
      changedFieldsJson.title = { before: currentContact.title, after: updateFields.title };
    }
    if (updateFields.department !== undefined) {
      changedFieldsJson.department = { before: currentContact.department, after: updateFields.department };
    }
    if (updateFields.email !== undefined) {
      changedFieldsJson.email = { before: currentContact.email, after: updateFields.email };
    }
    if (updateFields.phone !== undefined) {
      changedFieldsJson.phone = { before: currentContact.phone, after: updateFields.phone };
    }
    if (updateFields.description !== undefined) {
      changedFieldsJson.description = { before: currentContact.description, after: updateFields.description };
    }
    if (updateFields.primaryContact !== undefined) {
      changedFieldsJson.primaryContact = { before: currentContact.primaryContact === 1 || currentContact.primaryContact === true, after: updateFields.primaryContact };
    }

    if (Object.keys(changedFieldsJson).length > 0) {
      await executeUpdate(
        `INSERT INTO CUSTOMER_HISTORY (customer_id, change_type, changed_fields, changed_by_id, changed_at)
         VALUES (:customerId, :changeType, :changedFields, :userId, :now)`,
        {
          customerId,
          changeType: 'CONTACT_ADD',
          changedFields: JSON.stringify(changedFieldsJson),
          userId: user.id,
          now,
        }
      );
    }

    const updatedContact = await executeQuerySingle(contactSql, { contactId, customerId });

    return NextResponse.json(
      { data: { id: updatedContact!.id, customerId, ...updatedContact, primaryContact: updatedContact!.primaryContact === 1 }, message: '담당자가 수정되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    console.error(`PUT /api/customers/${customerId}/contacts/${contactId} error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; contactId: string } }
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
  const contactId = Number(params.contactId);
  if (isNaN(customerId) || isNaN(contactId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    const customerResult = await executeQuerySingle(
      `SELECT id FROM CUSTOMER WHERE id = :customerId AND deleted_at IS NULL`,
      { customerId }
    );

    if (!customerResult) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const contactSql = `
      SELECT id, name FROM CUSTOMER_CONTACT
      WHERE id = :contactId AND customer_id = :customerId AND deleted_at IS NULL
    `;
    const contact = await executeQuerySingle(contactSql, { contactId, customerId });

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const deleteSql = `
      UPDATE CUSTOMER_CONTACT
      SET deleted_at = :now, updated_at = :now
      WHERE id = :contactId AND customer_id = :customerId
    `;

    await executeUpdate(deleteSql, {
      contactId,
      customerId,
      now,
    });

    const changedFieldsJson = {
      deleted_at: { before: null, after: now.toISOString() },
    };

    await executeUpdate(
      `INSERT INTO CUSTOMER_HISTORY (customer_id, change_type, changed_fields, changed_by_id, changed_at)
       VALUES (:customerId, :changeType, :changedFields, :userId, :now)`,
      {
        customerId,
        changeType: 'CONTACT_DELETE',
        changedFields: JSON.stringify(changedFieldsJson),
        userId: user.id,
        now,
      }
    );

    return NextResponse.json(
      {
        message: '담당자가 삭제되었습니다.',
        data: {
          id: contact.id,
          customerId,
          name: contact.name,
          deletedAt: now.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`DELETE /api/customers/${customerId}/contacts/${contactId} error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
