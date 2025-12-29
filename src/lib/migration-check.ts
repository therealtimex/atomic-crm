/**
 * Migration Version Check Utility
 *
 * This module provides functions to detect if the database needs migration
 * by comparing the app version with the database schema version.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Get the current app version from package.json
 */
export const APP_VERSION = import.meta.env.VITE_APP_VERSION;

/**
 * Get the latest migration timestamp bundled with this app
 * Format: YYYYMMDDHHMMSS (e.g., "20251229213735")
 */
export const LATEST_MIGRATION_TIMESTAMP =
  import.meta.env.VITE_LATEST_MIGRATION_TIMESTAMP;

/**
 * Compare two semantic versions (e.g., "0.31.0" vs "0.30.0")
 * Returns:
 *   1 if v1 > v2
 *   0 if v1 === v2
 *  -1 if v1 < v2
 */
export function compareSemver(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;

    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  return 0;
}

/**
 * Database migration info
 */
export interface DatabaseMigrationInfo {
  version: string | null;
  latestMigrationTimestamp: string | null;
}

/**
 * Get the latest applied migration info from the database
 */
export async function getDatabaseMigrationInfo(
  supabase: SupabaseClient,
): Promise<DatabaseMigrationInfo> {
  try {
    const { data, error } = await supabase
      .from('schema_migrations')
      .select('version, latest_migration_timestamp')
      .order('applied_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      // Table might not exist yet (first run)
      console.warn('schema_migrations table not found:', error.message);
      return { version: null, latestMigrationTimestamp: null };
    }

    return {
      version: data?.version || null,
      latestMigrationTimestamp: data?.latest_migration_timestamp || null,
    };
  } catch (error) {
    console.error('Error checking database migration info:', error);
    return { version: null, latestMigrationTimestamp: null };
  }
}

/**
 * Migration status result
 */
export interface MigrationStatus {
  /** Whether migration is needed */
  needsMigration: boolean;
  /** Current app version */
  appVersion: string;
  /** Database schema version (null if unknown) */
  dbVersion: string | null;
  /** Human-readable status message */
  message: string;
}

/**
 * Check if database migration is needed
 *
 * Uses timestamp comparison for accurate migration detection:
 * - Compares app's latest migration timestamp with DB's latest migration timestamp
 * - If app timestamp > DB timestamp → new migrations available
 *
 * @param supabase - Supabase client instance
 * @returns Promise<MigrationStatus>
 */
export async function checkMigrationStatus(
  supabase: SupabaseClient,
): Promise<MigrationStatus> {
  const appVersion = APP_VERSION;
  const appMigrationTimestamp = LATEST_MIGRATION_TIMESTAMP;
  const dbInfo = await getDatabaseMigrationInfo(supabase);

  console.log('[Migration Check]', {
    appVersion,
    appMigrationTimestamp,
    dbVersion: dbInfo.version,
    dbMigrationTimestamp: dbInfo.latestMigrationTimestamp,
  });

  // If we can't determine DB migration info, assume migration is needed
  if (
    dbInfo.version === null ||
    dbInfo.latestMigrationTimestamp === null ||
    appMigrationTimestamp === 'unknown'
  ) {
    console.log('[Migration Check] Incomplete migration info - assuming migration needed');
    return {
      needsMigration: true,
      appVersion,
      dbVersion: dbInfo.version,
      message: `Database schema version unknown. Migration required to v${appVersion}.`,
    };
  }

  // Compare migration timestamps (YYYYMMDDHHMMSS format - lexicographic comparison works)
  const appTimestamp = appMigrationTimestamp;
  const dbTimestamp = dbInfo.latestMigrationTimestamp;

  console.log('[Migration Check] Timestamp comparison:', {
    appTimestamp,
    dbTimestamp,
    needsMigration: appTimestamp > dbTimestamp,
  });

  if (appTimestamp > dbTimestamp) {
    // App has newer migrations than DB
    return {
      needsMigration: true,
      appVersion,
      dbVersion: dbInfo.version,
      message: `New migrations available. Database is at ${dbTimestamp}, app has ${appTimestamp}.`,
    };
  } else if (appTimestamp < dbTimestamp) {
    // DB has newer migrations than app (unusual - user might have downgraded app)
    console.warn('[Migration Check] DB is ahead of app - possible downgrade');
    return {
      needsMigration: false,
      appVersion,
      dbVersion: dbInfo.version,
      message: `Database (${dbTimestamp}) is ahead of app (${appTimestamp}). Consider updating the app.`,
    };
  } else {
    // Timestamps match - no migration needed
    console.log('[Migration Check] Timestamps match - database is up-to-date');
    return {
      needsMigration: false,
      appVersion,
      dbVersion: dbInfo.version,
      message: `Database schema is up-to-date (v${appVersion}).`,
    };
  }
}

/**
 * LocalStorage key for migration reminder dismissal
 */
const MIGRATION_REMINDER_KEY = 'realtimex_crm_migration_reminder_dismissed_at';

/**
 * Check if user has dismissed the migration reminder recently
 *
 * @param hoursToWait - Hours to wait before showing reminder again (default: 24)
 * @returns true if reminder was dismissed within the time window
 */
export function isMigrationReminderDismissed(hoursToWait = 24): boolean {
  try {
    const dismissedAt = localStorage.getItem(MIGRATION_REMINDER_KEY);
    if (!dismissedAt) return false;

    const dismissedTime = new Date(dismissedAt).getTime();
    const now = Date.now();
    const hoursSinceDismissal = (now - dismissedTime) / (1000 * 60 * 60);

    return hoursSinceDismissal < hoursToWait;
  } catch (error) {
    console.error('Error checking migration reminder:', error);
    return false;
  }
}

/**
 * Mark the migration reminder as dismissed
 */
export function dismissMigrationReminder(): void {
  try {
    localStorage.setItem(MIGRATION_REMINDER_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Error dismissing migration reminder:', error);
  }
}

/**
 * Clear the migration reminder dismissal (useful after successful migration)
 */
export function clearMigrationReminderDismissal(): void {
  try {
    localStorage.removeItem(MIGRATION_REMINDER_KEY);
  } catch (error) {
    console.error('Error clearing migration reminder:', error);
  }
}
