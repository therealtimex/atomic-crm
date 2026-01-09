import { useEffect, useState } from "react";
import { type DataProvider, useTranslate } from "ra-core";
import {
  checkDatabaseHealth,
  DatabaseHealthStatus,
} from "@/lib/database-health-check";
import { getSupabaseConfig } from "@/lib/supabase-config";
import { DatabaseSetupGuide } from "../setup/DatabaseSetupGuide";
import { useMigrationContextSafe } from "@/contexts/MigrationContext";

interface DatabaseHealthCheckProps {
  children: React.ReactNode;
  dataProvider: DataProvider;
}

export function DatabaseHealthCheck({
  children,
  dataProvider,
}: DatabaseHealthCheckProps) {
  const [healthStatus, setHealthStatus] = useState<DatabaseHealthStatus | null>(
    null,
  );
  const [isChecking, setIsChecking] = useState(true);
  const translate = useTranslate();
  const migrationContext = useMigrationContextSafe();

  useEffect(() => {
    let cancelled = false;

    async function checkHealth() {
      try {
        const status = await checkDatabaseHealth(dataProvider);
        if (!cancelled) {
          setHealthStatus(status);
          setIsChecking(false);

          // If database is not healthy, suppress the migration banner
          // because we will be showing the full-page Setup Guide instead.
          if (!status.isHealthy && migrationContext) {
            migrationContext.setSuppressMigrationBanner(true);
          } else if (status.isHealthy && migrationContext) {
            migrationContext.setSuppressMigrationBanner(false);
          }
        }
      } catch (error) {
        console.error(
          "[DatabaseHealthCheck] Failed to check database health:",
          error,
        );
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    }

    checkHealth();

    return () => {
      cancelled = true;
    };
  }, [dataProvider, migrationContext]);

  // Show loading state
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">
            {translate("crm.root.database_checking")}
          </p>
        </div>
      </div>
    );
  }

  // Show setup guide if database is not healthy
  if (healthStatus && !healthStatus.isHealthy) {
    const config = getSupabaseConfig();
    if (config) {
      return (
        <DatabaseSetupGuide
          missingTables={healthStatus.missingTables}
          supabaseUrl={config.url}
        />
      );
    }
  }

  // Database is healthy, render children
  return <>{children}</>;
}
