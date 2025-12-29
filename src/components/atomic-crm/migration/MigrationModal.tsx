/**
 * MigrationModal Component
 *
 * Displays detailed migration instructions in a modal dialog.
 * Shows step-by-step guide for users to run the migration command.
 */

import { useState } from 'react';
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy');
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
        <pre className="overflow-x-auto rounded-md bg-muted p-3 pr-12 text-sm">
          <code>{code}</code>
        </pre>
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-2 top-2 h-8 w-8"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span className="sr-only">Copy</span>
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
  const projectId = config?.url
    ? new URL(config.url).hostname.split('.')[0]
    : 'your-project-id';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
            Database Migration Required
          </DialogTitle>
          <DialogDescription>
            Your database schema needs to be updated to v{status.appVersion}.
            Follow the steps below to complete the migration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>What will happen:</strong>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                <li>Database schema will be updated to v{status.appVersion}</li>
                <li>New features and improvements will be enabled</li>
                <li>Your existing data will not be affected</li>
                <li>This process usually takes less than 2 minutes</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Step 1: Prerequisites */}
          <div>
            <h4 className="mb-3 flex items-center gap-2 font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                1
              </span>
              Prerequisites
            </h4>
            <div className="ml-8 space-y-3">
              <p className="text-sm text-muted-foreground">
                Ensure you have the following:
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>Supabase CLI installed (see installation below)</li>
                <li>
                  Your Supabase project ID:{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    {projectId}
                  </code>
                </li>
                <li>Your database password (you'll be prompted)</li>
              </ul>
            </div>
          </div>

          {/* Step 2: Install Supabase CLI */}
          <div>
            <h4 className="mb-3 flex items-center gap-2 font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                2
              </span>
              Install Supabase CLI (if not already installed)
            </h4>
            <div className="ml-8 space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">macOS / Linux:</p>
                <CodeBlock code="brew install supabase/tap/supabase" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Windows (Scoop):</p>
                <CodeBlock code="scoop bucket add supabase https://github.com/supabase/scoop-bucket.git&#10;scoop install supabase" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Windows (npm):</p>
                <CodeBlock code="npm install -g supabase" />
              </div>
              <a
                href="https://supabase.com/docs/guides/cli/getting-started"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                View all installation methods
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
              Run Migration Command
            </h4>
            <div className="ml-8 space-y-3">
              <p className="text-sm text-muted-foreground">
                Open your terminal and run:
              </p>
              <CodeBlock code="npx realtimex-crm migrate" />
              <p className="text-sm text-muted-foreground">
                The migration tool will:
              </p>
              <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                <li>Prompt you to log in to Supabase (if not already)</li>
                <li>
                  Ask for your project ID (
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    {projectId}
                  </code>
                  )
                </li>
                <li>Request your database password</li>
                <li>Apply all pending migrations automatically</li>
                <li>Deploy updated edge functions</li>
              </ol>
            </div>
          </div>

          {/* Step 4: Refresh App */}
          <div>
            <h4 className="mb-3 flex items-center gap-2 font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                4
              </span>
              Refresh the Application
            </h4>
            <div className="ml-8 space-y-3">
              <p className="text-sm text-muted-foreground">
                After the migration completes successfully, refresh this page to
                access the new features.
              </p>
            </div>
          </div>

          {/* Troubleshooting */}
          <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Troubleshooting:</strong>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                <li>
                  If login fails, run <code>supabase logout</code> then try
                  again
                </li>
                <li>
                  Ensure your database password is correct (found in Supabase
                  Dashboard)
                </li>
                <li>
                  If issues persist, report at{' '}
                  <a
                    href="https://github.com/therealtimex/realtimex-crm/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    GitHub Issues
                  </a>
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
