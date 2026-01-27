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

  // Set outFormat to return objects instead of arrays
  connection.outFormat = oracledb.OUT_FORMAT_OBJECT;

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
    const result = await connection.execute(query, params);

    return {
      rows: result.rows as T[],
      rowCount: result.rows?.length || 0,
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
    const result = await connection.execute(query, params, { autoCommit: true });

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
    const results: Array<QueryResult<any>> = [];

    for (const op of operations) {
      const result = await connection.execute(op.query, op.params);
      results.push({
        rows: result.rows || [],
        rowCount: result.rowsAffected || 0,
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
