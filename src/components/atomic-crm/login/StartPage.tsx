import { useQuery } from "@tanstack/react-query";
import { useDataProvider } from "ra-core";
import { Navigate } from "react-router-dom";
import { LoginPage } from "@/components/admin/login-page";
import { checkDatabaseHealth } from "@/lib/database-health-check";
import { getSupabaseConfig } from "@/lib/supabase-config";
import { DatabaseSetupGuide } from "../setup/DatabaseSetupGuide";

import type { CrmDataProvider } from "../providers/types";
import { LoginSkeleton } from "./LoginSkeleton";

export const StartPage = () => {
  const dataProvider = useDataProvider<CrmDataProvider>();

  // First check database health
  const {
    data: healthStatus,
    error: healthError,
    isPending: isCheckingHealth,
  } = useQuery({
    queryKey: ["database-health"],
    queryFn: checkDatabaseHealth,
  });

  // Then check if initialized (only if database is healthy)
  const {
    data: isInitialized,
    error: initError,
    isPending: isCheckingInit,
  } = useQuery({
    queryKey: ["init"],
    queryFn: async () => {
      return dataProvider.isInitialized();
    },
    enabled: healthStatus?.isHealthy === true,
  });

  // Show loading state
  if (isCheckingHealth || isCheckingInit) return <LoginSkeleton />;

  // Show error if schema is missing
  if (healthStatus && !healthStatus.isHealthy) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-4">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <svg
                  className="h-6 w-6 text-destructive"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold">Database Not Configured</h1>
            <p className="text-muted-foreground">
              Your Supabase database is missing required tables and functions.
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm font-semibold">Missing tables:</p>
            <div className="flex flex-wrap gap-2">
              {healthStatus.missingTables.map((table) => (
                <span
                  key={table}
                  className="px-2 py-1 bg-background text-xs rounded border"
                >
                  {table}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <p className="font-semibold">To fix this:</p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
              <li>
                Download{" "}
                <a
                  href="https://raw.githubusercontent.com/therealtimex/realtimex-crm/main/public/setup.sql"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-semibold"
                  download="setup.sql"
                >
                  setup.sql
                </a>
              </li>
              <li>Open your Supabase project's SQL Editor</li>
              <li>Copy all contents from setup.sql and paste into the editor</li>
              <li>Click "Run" to execute the setup</li>
              <li>Return here and reload the page</li>
            </ol>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Reload Page
          </button>

          <div className="pt-4 border-t text-center">
            <a
              href="https://github.com/therealtimex/realtimex-crm#database-setup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              View detailed setup guide →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Show login page if there's an error or already initialized
  if (healthError || initError || isInitialized) return <LoginPage />;

  // Not initialized yet, go to signup
  return <Navigate to="/sign-up" />;
};
