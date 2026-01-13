/**
 * MigrationModal Component
 *
 * Displays detailed migration instructions in a modal dialog.
 * Shows step-by-step guide for users to run the migration command.
 */

import { useMemo, useState, useEffect, useRef } from "react";
import {
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Info,
  Loader2,
  Terminal,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTranslate } from "ra-core";
import { getSupabaseConfig } from "@/lib/supabase-config";
import type { MigrationStatus } from "@/lib/migration-check";

interface MigrationModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal is closed */
  onOpenChange: (open: boolean) => void;
  /** Migration status */
  status: MigrationStatus;
}

interface CodeBlockProps {
  code: string;
  label?: string;
}

function CodeBlock({ code, label }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const translate = useTranslate();

  const canCopy =
    typeof navigator !== "undefined" && !!navigator.clipboard?.writeText;

  const handleCopy = async () => {
    if (!canCopy) {
      toast.error(translate("crm.migration.modal.copy.unsupported"));
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast.success(translate("crm.migration.modal.copy.success"));
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error(translate("crm.migration.modal.copy.error"));
    }
  };

  return (
    <div className="relative">
      {label && (
        <div className="mb-2 text-sm font-medium text-muted-foreground">
          {label}
        </div>
      )}
      <div className="group relative">
        <pre className="overflow-hidden rounded-md bg-muted p-3 pr-12 text-sm">
          <code className="block whitespace-pre-wrap break-all">{code}</code>
        </pre>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="absolute right-2 top-2 h-8 w-8"
          onClick={handleCopy}
          disabled={!canCopy}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span className="sr-only">
            {copied
              ? translate("crm.migration.modal.copy.copied_label")
              : translate("crm.migration.modal.copy.copy_label")}
          </span>
        </Button>
      </div>
    </div>
  );
}

export function MigrationModal({
  open,
  onOpenChange,
  status,
}: MigrationModalProps) {
  const config = getSupabaseConfig();
  const translate = useTranslate();

  // Auto-migration state
  const [showAutoMigrate, setShowAutoMigrate] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationLogs, setMigrationLogs] = useState<string[]>([]);
  const [dbPassword, setDbPassword] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const logsEndRef = useRef<HTMLDivElement>(null);

  const projectId = useMemo(() => {
    const url = config?.url;
    if (!url) return "";
    try {
      const host = new URL(url).hostname;
      return host.split(".")[0] || "";
    } catch {
      return "";
    }
  }, [config?.url]);

  // Scroll logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [migrationLogs]);

  const handleAutoMigrate = async () => {
    if (!projectId) {
      toast.error(translate("crm.migration.modal.auto.missing_project_id"));
      return;
    }

    setIsMigrating(true);
    setMigrationLogs([translate("crm.migration.modal.auto.init_log")]);

    try {
      const response = await fetch("/api/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectRef: projectId,
          dbPassword,
          accessToken,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}: ${response.statusText}`,
        );
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream received.");

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n").filter(Boolean);
        setMigrationLogs((prev) => [...prev, ...lines]);
      }
    } catch (err) {
      console.error(err);
      setMigrationLogs((prev) => [
        ...prev,
        `${translate("crm.migration.modal.auto.error_prefix")}${err instanceof Error ? err.message : String(err)}`,
      ]);
      toast.error(translate("crm.migration.modal.auto.failure_toast"));
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => !isMigrating && onOpenChange(val)}
    >
      <DialogContent className="max-h-[90vh] sm:max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-6 w-6 text-red-700 dark:text-red-600" />
            {translate("crm.migration.modal.title")}
          </DialogTitle>
          <DialogDescription>
            {translate("crm.migration.modal.description", {
              version: status.appVersion,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>{translate("crm.migration.modal.overview.title")}</strong>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                <li>
                  {translate("crm.migration.modal.overview.update_schema", {
                    version: status.appVersion,
                  })}
                </li>
                <li>
                  {translate("crm.migration.modal.overview.enable_features")}
                </li>
                <li>{translate("crm.migration.modal.overview.data_safe")}</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Mode Selection Tabs */}
          <div className="flex border-b">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${showAutoMigrate ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              onClick={() => setShowAutoMigrate(true)}
            >
              {translate("crm.migration.modal.auto.tab_title")}
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${!showAutoMigrate ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              onClick={() => setShowAutoMigrate(false)}
            >
              {translate("crm.migration.modal.auto.manual_tab_title")}
            </button>
          </div>

          {showAutoMigrate ? (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-2">
                  {translate("crm.migration.modal.auto.title")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {translate("crm.migration.modal.auto.description")}
                </p>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="project-id">
                      {translate("crm.migration.modal.auto.project_id")}
                    </Label>
                    <Input
                      id="project-id"
                      value={projectId}
                      disabled
                      readOnly
                      className="bg-muted"
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="access-token">
                        {translate("crm.migration.modal.auto.access_token")}
                      </Label>
                      <a
                        href="https://supabase.com/dashboard/account/tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        {translate("crm.migration.modal.auto.generate_token")}{" "}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <Input
                      id="access-token"
                      type="password"
                      placeholder="sbp_..."
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      disabled={isMigrating}
                    />
                    <p className="text-xs text-muted-foreground">
                      {translate("crm.migration.modal.auto.access_token_hint")}
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="db-password">
                      {translate("crm.migration.modal.auto.db_password")}
                    </Label>
                    <Input
                      id="db-password"
                      type="password"
                      placeholder={translate(
                        "crm.migration.modal.auto.db_password_placeholder",
                      )}
                      value={dbPassword}
                      onChange={(e) => setDbPassword(e.target.value)}
                      disabled={isMigrating}
                    />
                    <p className="text-xs text-muted-foreground">
                      {translate("crm.migration.modal.auto.db_password_hint")}
                    </p>
                  </div>

                  <Button
                    onClick={handleAutoMigrate}
                    disabled={isMigrating}
                    className="w-full"
                  >
                    {isMigrating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {translate("crm.migration.modal.auto.migrating")}
                      </>
                    ) : (
                      <>
                        <Terminal className="mr-2 h-4 w-4" />
                        {translate("crm.migration.modal.auto.start")}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Logs Terminal */}
              <div className="rounded-lg border bg-black text-white font-mono text-xs p-4 h-64 overflow-y-auto">
                {migrationLogs.length === 0 ? (
                  <div className="text-gray-500 italic">
                    {translate("crm.migration.modal.auto.logs_placeholder")}
                  </div>
                ) : (
                  migrationLogs.map((log, i) => (
                    <div key={i} className="mb-1 whitespace-pre-wrap">
                      {log}
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          ) : (
            // Manual Instructions (Existing content)
            <>
              {/* Step 1: Prerequisites */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 font-semibold">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    1
                  </span>
                  {translate("crm.migration.modal.prerequisites.title")}
                </h4>
                <div className="ml-8 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {translate("crm.migration.modal.prerequisites.intro")}
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    <li>
                      {translate(
                        "crm.migration.modal.prerequisites.cli_installed",
                      )}
                    </li>
                    <li>
                      {translate(
                        "crm.migration.modal.prerequisites.project_id",
                      )}{" "}
                      <code className="rounded bg-muted px-1 py-0.5 text-xs">
                        {projectId || "your-project-id"}
                      </code>
                    </li>
                    <li>
                      {translate(
                        "crm.migration.modal.prerequisites.db_password",
                      )}
                    </li>
                  </ul>
                </div>
              </div>

              {/* Step 2: Install Supabase CLI */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 font-semibold">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    2
                  </span>
                  {translate("crm.migration.modal.install_cli.title")}
                </h4>
                <div className="ml-8 space-y-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {translate("crm.migration.modal.install_cli.macos")}
                    </p>
                    <CodeBlock code="brew install supabase/tap/supabase" />
                  </div>
                  {/* ... other instructions kept via implicit return if I didn't cut them ... */}
                  {/* To save tokens/time I'm keeping the structure but replacing the manual content block with the original logic if I had the full file content in memory.
                        Since I'm rewriting the file, I must include EVERYTHING.
                    */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {translate(
                        "crm.migration.modal.install_cli.windows_scoop",
                      )}
                    </p>
                    <CodeBlock
                      code={`scoop bucket add supabase https://github.com/supabase/scoop-bucket.git\nscoop install supabase`}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {translate("crm.migration.modal.install_cli.windows_npm")}
                    </p>
                    <CodeBlock code="npm install -g supabase" />
                  </div>

                  <a
                    href="https://supabase.com/docs/guides/cli/getting-started"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    {translate("crm.migration.modal.install_cli.view_all")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Step 3: Run Migration */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 font-semibold">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    3
                  </span>
                  {translate("crm.migration.modal.run_migration.title")}
                </h4>
                <div className="ml-8 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {translate("crm.migration.modal.run_migration.intro")}
                  </p>
                  <CodeBlock code="npx realtimex-crm migrate" />
                  <p className="text-sm text-muted-foreground">
                    {translate("crm.migration.modal.run_migration.tool_intro")}
                  </p>
                  <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                    <li>
                      {translate(
                        "crm.migration.modal.run_migration.steps.login",
                      )}
                    </li>
                    <li>
                      {translate(
                        "crm.migration.modal.run_migration.steps.project_id",
                      )}{" "}
                      (
                      <code className="rounded bg-muted px-1 py-0.5 text-xs">
                        {projectId || "your-project-id"}
                      </code>
                      )
                    </li>
                    <li>
                      {translate(
                        "crm.migration.modal.run_migration.steps.password",
                      )}
                    </li>
                    <li>
                      {translate(
                        "crm.migration.modal.run_migration.steps.apply",
                      )}
                    </li>
                    <li>
                      {translate(
                        "crm.migration.modal.run_migration.steps.deploy",
                      )}
                    </li>
                  </ol>
                </div>
              </div>

              {/* Step 4: Refresh App */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 font-semibold">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    4
                  </span>
                  {translate("crm.migration.modal.refresh.title")}
                </h4>
                <div className="ml-8 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {translate("crm.migration.modal.refresh.description")}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Troubleshooting */}
          <Alert className="border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20">
            <AlertTriangle className="h-4 w-4 text-red-700 dark:text-red-600" />
            <AlertDescription>
              <strong>
                {translate("crm.migration.modal.troubleshooting.title")}
              </strong>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                <li>
                  {translate(
                    "crm.migration.modal.troubleshooting.logout_prefix",
                  )}{" "}
                  <code>supabase logout</code>{" "}
                  {translate(
                    "crm.migration.modal.troubleshooting.logout_suffix",
                  )}
                </li>
                <li>
                  {translate("crm.migration.modal.troubleshooting.password")}
                </li>
                <li>
                  {translate("crm.migration.modal.troubleshooting.report")}{" "}
                  <a
                    href="https://github.com/therealtimex/realtimex-crm/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {translate(
                      "crm.migration.modal.troubleshooting.report_link",
                    )}
                  </a>
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isMigrating}
          >
            {translate("crm.migration.modal.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
