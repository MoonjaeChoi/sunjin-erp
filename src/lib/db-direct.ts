// Generated: 2026-01-27 23:30:00 KST

/**
 * Direct Oracle Database Helper
 *
 * Uses oracledb library directly instead of TypeORM to avoid decorator
 * evaluation issues in strict mode with TypeORM 0.3.28 + Next.js 14.
 *
 * All connections are closed properly and pooling is handled by oracledb.
 */

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

/**
 * Convert oracledb row objects to plain JavaScript objects
 * Uses JSON serialization with a custom replacer to handle circular references
 */
function toPlainObject(row: any): any {
  if (row === null || row === undefined) return row;
  if (typeof row !== 'object') return row;

  // Special handling for Dates - convert to ISO string then back
  if (row instanceof Date) {
    return row;
  }

  // Try to serialize and deserialize to create a plain object
  // This naturally removes circular references and oracledb internal properties
  try {
    return JSON.parse(JSON.stringify(row, (key, value) => {
      // Skip functions and problematic oracledb properties
      if (typeof value === 'function') {
        return undefined;
      }
      // Skip connection-related properties
      if (key === 'parent' || key === 'connection' || key === '_connection' ||
          key === 'client' || key === '_client' || key === 'socket' ||
          key === 'pool' || key === 'metadata' || key === 'parentRow' ||
          key === 'stmt' || key === 'resultSet' || key === '_owner' ||
          key === '_metadata' || key === '_pool' || key === '_socket') {
        return undefined;
      }
      return value;
    }));
  } catch (err) {
    // If JSON serialization fails, return as-is
    // This handles cases where the row has properties that can't be serialized
    console.warn('[DB-Direct] Warning: Could not serialize row to plain object:', err);
    return row;
  }
}

export interface ConnectionOptions {
  user?: string;
  password?: string;
  connectionString?: string;
}

/**
 * Get a direct connection to Oracle database
 */
export async function getConnection(options?: ConnectionOptions) {
  // @ts-ignore - oracledb doesn't have type definitions
  const oracledb = await import('oracledb');

  const connectionString = options?.connectionString ||
    `${process.env.ORACLE_HOST || 'localhost'}:${process.env.ORACLE_PORT || 1521}/${process.env.ORACLE_SERVICE_NAME || 'XEPDB1'}`;

  const connection = await oracledb.getConnection({
    user: options?.user || process.env.ORACLE_USERNAME || 'sunjin_admin',
    password: options?.password || process.env.ORACLE_PASSWORD || '',
    connectionString,
  });

  return connection;
}

/**
 * Execute a query and return results
 */
export async function executeQuery<T = any>(
  query: string,
  params: any[] | Record<string, any> = {},
  options?: ConnectionOptions
): Promise<QueryResult<T>> {
  let connection: any = null;

  try {
    connection = await getConnection(options);
    // @ts-ignore - oracledb doesn't have complete type definitions
    const oracledb = await import('oracledb');
    const result = await connection.execute(query, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    // Convert rows to plain objects to avoid circular reference issues
    const plainRows = (result.rows || []).map(toPlainObject) as T[];

    return {
      rows: plainRows,
      rowCount: plainRows.length,
    };
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('[DB-Direct] Error closing connection:', err);
      }
    }
  }
}

/**
 * Execute a single row query
 */
export async function executeQuerySingle<T = any>(
  query: string,
  params: any[] | Record<string, any> = {},
  options?: ConnectionOptions
): Promise<T | null> {
  const result = await executeQuery<T>(query, params, options);
  return result.rows[0] || null;
}

/**
 * Execute an insert/update/delete statement
 */
export async function executeUpdate(
  query: string,
  params: any[] | Record<string, any> = {},
  options?: ConnectionOptions
): Promise<{ rowsAffected: number }> {
  let connection: any = null;

  try {
    connection = await getConnection(options);
    // @ts-ignore - oracledb doesn't have complete type definitions
    const oracledb = await import('oracledb');
    const result = await connection.execute(query, params, {
      autoCommit: true,
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    return {
      rowsAffected: result.rowsAffected || 0,
    };
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('[DB-Direct] Error closing connection:', err);
      }
    }
  }
}

/**
 * Execute a transaction with multiple statements
 */
export async function executeTransaction(
  operations: Array<{
    query: string;
    params: any[] | Record<string, any>;
  }>,
  options?: ConnectionOptions
): Promise<Array<QueryResult<any>>> {
  let connection: any = null;

  try {
    connection = await getConnection(options);
    // @ts-ignore - oracledb doesn't have complete type definitions
    const oracledb = await import('oracledb');
    const results: Array<QueryResult<any>> = [];

    for (const op of operations) {
      const result = await connection.execute(op.query, op.params, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });

      // Convert rows to plain objects to avoid circular reference issues
      const plainRows = (result.rows || []).map(toPlainObject);

      results.push({
        rows: plainRows,
        rowCount: result.rowsAffected || plainRows.length,
      });
    }

    await connection.commit();
    return results;
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error('[DB-Direct] Error rolling back transaction:', rollbackErr);
      }
    }
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('[DB-Direct] Error closing connection:', err);
      }
    }
  }
}
