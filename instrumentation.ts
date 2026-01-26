// Generated: 2026-01-27 14:00:00 KST

/**
 * Next.js Instrumentation Hook
 * - Loads reflect-metadata BEFORE any other code
 * - Runs once per server start in production
 * - Critical for TypeORM decorators to work properly
 */

export async function register() {
  // CRITICAL: Load reflect-metadata first, before TypeORM entities are imported
  // This must happen before any decorator is applied
  try {
    await import('reflect-metadata');
    console.log('[Instrumentation] reflect-metadata loaded successfully');
  } catch (error) {
    console.error('[Instrumentation] Failed to load reflect-metadata:', error);
  }

  // Set Oracle character set for proper UTF-8 handling
  if (typeof process !== 'undefined') {
    process.env.NLS_LANG = 'KOREAN_KOREA.AL32UTF8';
    console.log('[Instrumentation] NLS_LANG set to KOREAN_KOREA.AL32UTF8');
  }
}
