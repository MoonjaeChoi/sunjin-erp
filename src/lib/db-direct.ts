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
 * Removes circular references and oracledb metadata
 */
function toPlainObject(row: any): any {
  if (row === null || row === undefined) return row;
  if (typeof row !== 'object') return row;
  if (row instanceof Date) return row;

  // List of problematic properties that cause circular references
  const skipProps = new Set([
    'parent', 'connection', '_connection', 'client', '_client',
    '_owner', 'metadata', '_metadata', 'socket', '_socket',
    'pool', '_pool', 'parentRow', 'stmt', 'resultSet',
    'list', // NVPair circular reference
  ]);

  // Recursively build a clean object
  function stripCircular(obj: any, depth = 0, seen = new Set()): any {
    // Prevent infinite recursion
    if (depth > 10 || seen.has(obj)) {
      return undefined;
    }

    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Date) return obj;
    if (typeof obj !== 'object') return obj;

    // Skip Stream objects (LOBs from oracledb)
    if (obj.readable || obj._readableState || obj._writableState) {
      return null; // LOBs are returned as null or could be read separately
    }

    seen.add(obj);

    if (Array.isArray(obj)) {
      return obj.map((item) => stripCircular(item, depth + 1, new Set(seen)));
    }

    const clean: any = {};
    for (const key in obj) {
      try {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
        if (skipProps.has(key)) continue;

        const value = obj[key];
        if (typeof value === 'function') continue;
        if (value === null || value === undefined) {
          clean[key] = value;
        } else if (value instanceof Date) {
          clean[key] = value;
        } else if (typeof value === 'object') {
          // Check if it's a Stream/LOB object
          if (value.readable || value._readableState || value._writableState) {
            clean[key] = null;
            continue;
          }
          if (seen.has(value)) continue;
          clean[key] = stripCircular(value, depth + 1, new Set(seen));
        } else {
          clean[key] = value;
        }
      } catch (e) {
        // Skip properties that throw errors
        continue;
      }
    }
    return clean;
  }

  try {
    return stripCircular(row);
  } catch (err) {
    console.warn('[DB-Direct] Warning: Could not strip circular references:', err);
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
