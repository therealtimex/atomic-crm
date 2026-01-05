/**
 * MigrationModal Component
 *
 * Displays detailed migration instructions in a modal dialog.
 * Shows step-by-step guide for users to run the migration command.
 */

import { useMemo, useState } from 'react';
import { AlertTriangle, Copy, Check, ExternalLink, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useTranslate } from 'ra-core';
import { getSupabaseConfig } from '@/lib/supabase-config';
import type { MigrationStatus } from '@/lib/migration-check';

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
    typeof navigator !== 'undefined' && !!navigator.clipboard?.writeText;

  const handleCopy = async () => {
    if (!canCopy) {
      toast.error(translate('crm.migration.modal.copy.unsupported'));
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast.success(translate('crm.migration.modal.copy.success'));
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error(translate('crm.migration.modal.copy.error'));
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
              ? translate('crm.migration.modal.copy.copied_label')
              : translate('crm.migration.modal.copy.copy_label')}
          </span>
        </Button>
      </div>
    </div>
  );
}

export function MigrationModal({ open, onOpenChange, status }: MigrationModalProps) {
  const config = getSupabaseConfig();
  const translate = useTranslate();

  const projectId = useMemo(() => {
    const url = config?.url;
    if (!url) return 'your-project-id';
    try {
      const host = new URL(url).hostname;
      return host.split('.')[0] || 'your-project-id';
    } catch {
      return 'your-project-id';
    }
  }, [config?.url]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-6 w-6 text-red-700 dark:text-red-600" />
            {translate('crm.migration.modal.title')}
          </DialogTitle>
          <DialogDescription>
            {translate('crm.migration.modal.description', {
              version: status.appVersion,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>{translate('crm.migration.modal.overview.title')}</strong>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                <li>
                  {translate('crm.migration.modal.overview.update_schema', {
                    version: status.appVersion,
                  })}
                </li>
                <li>{translate('crm.migration.modal.overview.enable_features')}</li>
                <li>{translate('crm.migration.modal.overview.data_safe')}</li>
                <li>{translate('crm.migration.modal.overview.duration')}</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Step 1: Prerequisites */}
          <div>
            <h4 className="mb-3 flex items-center gap-2 font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                1
              </span>
              {translate('crm.migration.modal.prerequisites.title')}
            </h4>
            <div className="ml-8 space-y-3">
              <p className="text-sm text-muted-foreground">
                {translate('crm.migration.modal.prerequisites.intro')}
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>{translate('crm.migration.modal.prerequisites.cli_installed')}</li>
                <li>
                  {translate('crm.migration.modal.prerequisites.project_id')}{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    {projectId}
                  </code>
                </li>
                <li>{translate('crm.migration.modal.prerequisites.db_password')}</li>
              </ul>
            </div>
          </div>

          {/* Step 2: Install Supabase CLI */}
          <div>
            <h4 className="mb-3 flex items-center gap-2 font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                2
              </span>
              {translate('crm.migration.modal.install_cli.title')}
            </h4>
            <div className="ml-8 space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {translate('crm.migration.modal.install_cli.macos')}
                </p>
                <CodeBlock code="brew install supabase/tap/supabase" />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {translate('crm.migration.modal.install_cli.windows_scoop')}
                </p>
                <CodeBlock
                  code={`scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase`}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {translate('crm.migration.modal.install_cli.windows_npm')}
                </p>
                <CodeBlock code="npm install -g supabase" />
              </div>

              <a
                href="https://supabase.com/docs/guides/cli/getting-started"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                {translate('crm.migration.modal.install_cli.view_all')}
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
              {translate('crm.migration.modal.run_migration.title')}
            </h4>
            <div className="ml-8 space-y-3">
              <p className="text-sm text-muted-foreground">
                {translate('crm.migration.modal.run_migration.intro')}
              </p>
              <CodeBlock code="npx realtimex-crm migrate" />
              <p className="text-sm text-muted-foreground">
                {translate('crm.migration.modal.run_migration.tool_intro')}
              </p>
              <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                <li>{translate('crm.migration.modal.run_migration.steps.login')}</li>
                <li>
                  {translate('crm.migration.modal.run_migration.steps.project_id')}{' '}
                  (
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    {projectId}
                  </code>
                  )
                </li>
                <li>{translate('crm.migration.modal.run_migration.steps.password')}</li>
                <li>{translate('crm.migration.modal.run_migration.steps.apply')}</li>
                <li>{translate('crm.migration.modal.run_migration.steps.deploy')}</li>
              </ol>
            </div>
          </div>

          {/* Step 4: Refresh App */}
          <div>
            <h4 className="mb-3 flex items-center gap-2 font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                4
              </span>
              {translate('crm.migration.modal.refresh.title')}
            </h4>
            <div className="ml-8 space-y-3">
              <p className="text-sm text-muted-foreground">
                {translate('crm.migration.modal.refresh.description')}
              </p>
            </div>
          </div>

          {/* Troubleshooting (kept informative, not "error happened" alarming) */}
          <Alert className="border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20">
            <AlertTriangle className="h-4 w-4 text-red-700 dark:text-red-600" />
            <AlertDescription>
              <strong>{translate('crm.migration.modal.troubleshooting.title')}</strong>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                <li>
                  {translate('crm.migration.modal.troubleshooting.logout_prefix')}{' '}
                  <code>supabase logout</code>{' '}
                  {translate('crm.migration.modal.troubleshooting.logout_suffix')}
                </li>
                <li>
                  {translate('crm.migration.modal.troubleshooting.password')}
                </li>
                <li>
                  {translate('crm.migration.modal.troubleshooting.report')}{' '}
                  <a
                    href="https://github.com/therealtimex/realtimex-crm/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {translate('crm.migration.modal.troubleshooting.report_link')}
                  </a>
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {translate('crm.migration.modal.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
