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
 * Get the latest applied migration version from the database
 */
export async function getDatabaseVersion(
  supabase: SupabaseClient,
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('schema_migrations')
      .select('version')
      .order('applied_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      // Table might not exist yet (first run)
      console.warn('schema_migrations table not found:', error.message);
      return null;
    }

    return data?.version || null;
  } catch (error) {
    console.error('Error checking database version:', error);
    return null;
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
 * @param supabase - Supabase client instance
 * @returns Promise<MigrationStatus>
 */
export async function checkMigrationStatus(
  supabase: SupabaseClient,
): Promise<MigrationStatus> {
  const appVersion = APP_VERSION;
  const dbVersion = await getDatabaseVersion(supabase);

  console.log('[Migration Check]', {
    appVersion,
    dbVersion,
    appVersionType: typeof appVersion,
    dbVersionType: typeof dbVersion,
  });

  // If we can't determine DB version, assume migration is needed
  if (dbVersion === null) {
    console.log('[Migration Check] DB version is null - migration needed');
    return {
      needsMigration: true,
      appVersion,
      dbVersion: null,
      message: `Database schema version unknown. Migration required to v${appVersion}.`,
    };
  }

  // Compare versions
  const comparison = compareSemver(appVersion, dbVersion);
  console.log('[Migration Check] Version comparison:', {
    appVersion,
    dbVersion,
    comparison,
    result:
      comparison > 0 ? 'app newer' : comparison < 0 ? 'db newer' : 'equal',
  });

  if (comparison > 0) {
    // App version is newer than DB version
    return {
      needsMigration: true,
      appVersion,
      dbVersion,
      message: `Database schema (v${dbVersion}) is outdated. Migration to v${appVersion} required.`,
    };
  } else if (comparison < 0) {
    // DB version is newer than app version (unusual but possible)
    return {
      needsMigration: false,
      appVersion,
      dbVersion,
      message: `Database schema (v${dbVersion}) is newer than app version (v${appVersion}). Consider updating the app.`,
    };
  } else {
    // Versions match
    console.log('[Migration Check] Versions match - no migration needed');
    return {
      needsMigration: false,
      appVersion,
      dbVersion,
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
