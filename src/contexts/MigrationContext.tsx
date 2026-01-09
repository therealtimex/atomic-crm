import { createContext, useContext, type ReactNode } from 'react';
import type { MigrationStatus } from '@/lib/migration-check';

interface MigrationContextValue {
  /** Current migration status */
  migrationStatus: MigrationStatus | null;
  /** Whether the migration banner is currently showing */
  showMigrationBanner: boolean;
  /** Whether the migration modal is currently showing */
  showMigrationModal: boolean;
  /** Open the migration modal */
  openMigrationModal: () => void;
  /** Whether the migration banner should be suppressed (e.g., when showing Setup Guide) */
  suppressMigrationBanner: boolean;
  /** Set whether to suppress the migration banner */
  setSuppressMigrationBanner: (suppress: boolean) => void;
}

const MigrationContext = createContext<MigrationContextValue | undefined>(
  undefined,
);

export function MigrationProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: MigrationContextValue;
}) {
  return (
    <MigrationContext.Provider value={value}>
      {children}
    </MigrationContext.Provider>
  );
}

export function useMigrationContext() {
  const context = useContext(MigrationContext);
  if (context === undefined) {
    throw new Error(
      'useMigrationContext must be used within a MigrationProvider',
    );
  }
  return context;
}

/**
 * Safe version that returns null if used outside provider
 * Useful for components that may render outside the provider
 */
export function useMigrationContextSafe() {
  return useContext(MigrationContext);
}