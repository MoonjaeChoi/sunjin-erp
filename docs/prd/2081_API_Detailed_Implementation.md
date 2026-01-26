<!-- Generated: 2026-01-28 04:00:00 KST -->

# 2081 API Route Handlers - Detailed Implementation Guide

## File-by-File Implementation Reference

### 1. src/app/api/customers/route.ts (Lines: 1-396)

#### GET Handler (Lines: 94-243)
**Purpose**: Retrieve paginated list of customers with filters

**Key Functionality**:
- Pagination: page (1+), limit (1-100, default 20)
- Search: by name or code (case-insensitive LIKE)
- Filters: classification (array), managerId
- Sort: name, code, createdAt, updatedAt (ASC/DESC)
- Admin feature: includeDeleted flag (ADMIN only)

**Query Construction** (Lines: 132-162):
```typescript
// Dynamic WHERE clause building
const whereClauses: string[] = [];
if (!showDeleted) whereClauses.push('c.deleted_at IS NULL');
if (search) whereClauses.push('(UPPER(c.name) LIKE :search OR UPPER(c.code) LIKE :search)');
if (classification.length > 0) whereClauses.push(`c.classification IN (...)`);
if (managerId) whereClauses.push('c.created_by_id = :managerId');
```

**Performance**: OFFSET/FETCH pagination (Oracle standard)

#### POST Handler (Lines: 246-396)
**Purpose**: Create new customer with validation

**Workflow**:
1. Auth check (MANAGER+) - Lines 248-256
2. Parse & validate request body - Lines 259-276
3. XSS sanitization - Lines 279-283
4. Check duplicate name - Lines 291-304
5. Generate customer code (sequence) - Lines 307-310
6. Insert into CUSTOMER - Lines 312-337
7. Record CUSTOMER_HISTORY (CREATE) - Lines 340-364
8. Return 201 response - Lines 367-385

**Unique Features**:
- Sequence-based code generation: `CUST-00001`, `CUST-00002`, etc.
- Duplicate name check (soft-delete aware)
- Full history tracking with before/after JSON

---

### 2. src/app/api/customers/[id]/route.ts (Lines: 1-560)

#### GET Handler (Lines: 78-149)
**Purpose**: Retrieve single customer detail

**Data Joins** (Lines: 97-108):
```sql
FROM CUSTOMER c
LEFT JOIN EMPLOYEE e ON c.created_by_id = e.id
LEFT JOIN EMPLOYEE cb ON c.created_by_id = cb.id
LEFT JOIN EMPLOYEE ub ON c.updated_by_id = ub.id
```

Result includes: managerName, createdByName, updatedByName

#### PUT Handler (Lines: 151-381)
**Purpose**: Update customer fields (excludes name, code)

**Partial Update Logic** (Lines: 217-256):
```typescript
// Only update provided fields
if (body.address !== undefined) {
  updateColumns.push('address = :address');
  params.address = sanitized;
}
```

**History Tracking** (Lines: 292-327):
```typescript
// Record before/after for each changed field
changedFieldsJson.address = {
  before: currentCustomer.address,
  after: updateFields.address
};
```

**Edge Cases**:
- Empty update (no fields changed) - returns 200 with current data
- Address/memo/description allow null values
- Classification is updatable

#### DELETE Handler (Lines: 384-560)
**Purpose**: Soft delete customer (ADMIN only)

**Multi-Step Process**:

1. **RBAC Check** (Lines 395-403): ADMIN only, explicit error message
2. **Existence Check** (Lines 425-439): Verify customer exists and not already deleted
3. **Dependency Validation** (Lines 451-497):
   - COUNT PROJECT records
   - COUNT TECH_SUPPORT records
   - COUNT MAINTENANCE_CONTRACTS records
   - Return detailed error if any dependencies exist

4. **Soft Delete** (Lines 499-511):
   ```sql
   UPDATE CUSTOMER SET deleted_at = :now WHERE id = :id
   ```

5. **History Recording** (Lines 522-536): Record DELETE with reason if provided

**Error Detail Response** (Lines 484-496):
```typescript
{
  error: 'Dependency Error',
  details: {
    projects: 2,
    techSupports: 1,
    maintenanceContracts: 0
  }
}
```

---

### 3. src/app/api/customers/[id]/contacts/route.ts (Lines: 1-327)

#### GET Handler (Lines: 90-159)
**Purpose**: Retrieve all contacts for customer

**Sorting** (Line 129):
```sql
ORDER BY primary_contact DESC, created_at ASC
```
Result: Primary contact first, then by creation date

**Response Transformation** (Lines 134-146):
```typescript
primaryContact: contact.primaryContact === 1 || contact.primaryContact === true
```
Handles both NUMBER (1/0) and BOOLEAN values

#### POST Handler (Lines: 161-327)
**Purpose**: Add new contact to customer

**Primary Contact Management** (Lines 224-243):
```typescript
if (primaryContact === 1) {
  // Find existing primary contact
  const existingPrimary = await queryRunner.query(...);
  if (existingPrimary.length > 0) {
    // Set existing primary to 0
    await queryRunner.query('UPDATE CUSTOMER_CONTACT SET primary_contact = 0 ...');
  }
}
```

**Constraint**: Max 1 primary contact per customer (enforced at application level)

**Field Constraints**:
- name: 1-100 chars
- title: 1-50 chars (required)
- email: required, validated format
- phone: required, 10+ digits
- description: optional, 0-200 chars
- primaryContact: optional boolean, default false

---

### 4. src/app/api/customers/[id]/contacts/[contactId]/route.ts (Lines: 1-402)

#### PUT Handler (Lines: 66-292)
**Purpose**: Update contact information

**Primary Contact Reassignment** (Lines 186-213):
```typescript
if (body.primaryContact === true && currentContact.primaryContact === false) {
  // Find other primary contact
  // Set it to 0
  // Set this one to 1
}
```

**Field Update Coverage**:
- name, title: HTML sanitized, trimmed
- department, description: nullable, HTML sanitized
- email, phone: validated, trimmed (no sanitization)
- primaryContact: boolean → 1/0

**History JSON** (Lines 233-255):
```typescript
changedFieldsJson = {
  name: { before: old, after: new },
  email: { before: old, after: new },
  // ... all changed fields
}
```

#### DELETE Handler (Lines: 294-402)
**Purpose**: Soft delete contact

**Soft Delete** (Lines 348-358):
```sql
UPDATE CUSTOMER_CONTACT
SET deleted_at = :now, updated_at = :now
WHERE id = :contactId AND customer_id = :customerId
```

**History** (Lines 360-362):
```typescript
changedFieldsJson = {
  deleted_at: { before: null, after: now.toISOString() }
}
```

---

### 5. src/app/api/customers/[id]/history/route.ts (Lines: 1-212)

#### GET Handler (Lines: 32-211)
**Purpose**: Retrieve change history with filtering

**Query Parameter Validation** (Lines 52-69):
```typescript
// Validate sortBy
if (!['changed_at', 'change_type'].includes(sortBy)) {
  return NextResponse.json({ error: 'Invalid sortBy' }, { status: 400 });
}

// Validate sortOrder
if (!['ASC', 'DESC'].includes(sortOrder)) {
  return NextResponse.json({ error: 'Invalid sortOrder' }, { status: 400 });
}
```

**Date Filtering** (Lines 104-127):
```typescript
if (fromDate) {
  try {
    new Date(fromDate); // Validate ISO format
    countSql += ` AND changed_at >= :fromDate`;
    countParams.fromDate = new Date(fromDate);
  } catch {
    return NextResponse.json(
      { error: 'Invalid fromDate format (use ISO 8601)' },
      { status: 400 }
    );
  }
}
```

**Performance** (Lines 134-176):
- Separate count query for total
- Pagination with LIMIT/OFFSET
- LEFT JOIN EMPLOYEE for changer names
- JSON parsing on retrieval

**Response Transformation** (Lines 179-189):
```typescript
changedFields: record.changedFields ? JSON.parse(record.changedFields) : {}
changedBy: {
  id: record.changedById,
  name: record.employeeName || 'Unknown User'
}
```

---

## Common Patterns

### 1. Query Runner Pattern
```typescript
const ds = await getDataSource();
const queryRunner = ds.createQueryRunner();
try {
  // Execute queries
  const result = await queryRunner.query(sql, params);
} finally {
  await queryRunner.release();
}
```

### 2. Validation Pattern
```typescript
function validateXxx(body: RequestType): string[] {
  const errors: string[] = [];
  
  if (!body.name || body.name.trim().length === 0) {
    errors.push('name is required');
  }
  if (body.name && body.name.length > MAX_LENGTH) {
    errors.push(`name must be ${MAX_LENGTH} chars or less`);
  }
  
  return errors;
}

// Usage
const errors = validateXxx(body);
if (errors.length > 0) {
  return NextResponse.json(
    { error: 'Validation failed', details: errors },
    { status: 400 }
  );
}
```

### 3. Sanitization Pattern
```typescript
function sanitizeHtml(input: string): string {
  return input.replace(/[<>]/g, (ch) => (ch === '<' ? '&lt;' : '&gt;'));
}

// Usage
const sanitized = sanitizeHtml(body.name.trim());
```

### 4. History Recording Pattern
```typescript
const changedFieldsJson = {
  name: { before: old.name, after: new.name },
  email: { before: old.email, after: new.email }
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
  changeType: 'UPDATE',
  changedFields: JSON.stringify(changedFieldsJson),
  userId: user.id,
  now
});
```

---

## RBAC Authorization Matrix

```typescript
const RBAC = {
  // GET endpoints - USER+
  'GET /api/customers': ['USER', 'MANAGER', 'ADMIN'],
  'GET /api/customers/[id]': ['USER', 'MANAGER', 'ADMIN'],
  'GET /api/customers/[id]/contacts': ['USER', 'MANAGER', 'ADMIN'],
  'GET /api/customers/[id]/history': ['MANAGER', 'ADMIN'],
  
  // CREATE endpoints - MANAGER+
  'POST /api/customers': ['MANAGER', 'ADMIN'],
  'POST /api/customers/[id]/contacts': ['MANAGER', 'ADMIN'],
  
  // UPDATE endpoints - MANAGER+
  'PUT /api/customers/[id]': ['MANAGER', 'ADMIN'],
  'PUT /api/customers/[id]/contacts/[contactId]': ['MANAGER', 'ADMIN'],
  
  // DELETE endpoints
  'DELETE /api/customers/[id]': ['ADMIN'], // ADMIN ONLY
  'DELETE /api/customers/[id]/contacts/[contactId]': ['MANAGER', 'ADMIN']
};
```

---

## Performance Considerations

### Queries Optimized For:
1. **List with Filters**: LIMIT/OFFSET instead of cursor (better for pagination UI)
2. **Search**: Case-insensitive LIKE on name/code (indexed columns)
3. **Join Operations**: LEFT JOIN for optional employee data
4. **Count Queries**: Separate COUNT(*) for pagination total

### Not Optimized (By Design):
- No full-text search
- No aggregate functions
- No complex joins

---

## Error Handling by Endpoint

| Endpoint | 400 | 401 | 403 | 404 | 500 |
|----------|-----|-----|-----|-----|-----|
| GET /customers | Search error | ✓ | - | - | ✓ |
| POST /customers | Validation | ✓ | ✓ | - | ✓ |
| GET /customers/[id] | Invalid ID | ✓ | - | ✓ | ✓ |
| PUT /customers/[id] | Validation | ✓ | ✓ | ✓ | ✓ |
| DELETE /customers/[id] | Dependency | ✓ | ✓ | ✓ | ✓ |
| GET /customers/[id]/contacts | - | ✓ | - | ✓ | ✓ |
| POST /contacts | Validation | ✓ | ✓ | ✓ | ✓ |
| PUT /contacts/[id] | Validation | ✓ | ✓ | ✓ | ✓ |
| DELETE /contacts/[id] | - | ✓ | ✓ | ✓ | ✓ |
| GET /history | Date error | ✓ | ✓ | ✓ | ✓ |

---

## Testing Integration Points

Each endpoint can be tested with:
- Session mock (getServerSession)
- QueryRunner mock (database queries)
- Parameter validation
- RBAC permission checks
- Error scenarios

See `src/__tests__/api/customers/` for full test examples.

