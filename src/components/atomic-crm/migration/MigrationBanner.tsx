/**
 * MigrationBanner Component
 *
 * Displays a dismissible top banner when database migration is required.
 * Non-blocking: allows users to continue using the app while showing the reminder.
 */

import { useState } from 'react';
import { AlertTriangle, Copy, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  dismissMigrationReminder,
  type MigrationStatus,
} from '@/lib/migration-check';

interface MigrationBannerProps {
  /** Migration status from checkMigrationStatus */
  status: MigrationStatus;
  /** Callback when banner is dismissed */
  onDismiss?: () => void;
  /** Callback when user clicks "Learn More" to open modal */
  onLearnMore?: () => void;
}

export function MigrationBanner({
  status,
  onDismiss,
  onLearnMore,
}: MigrationBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleDismiss = () => {
    dismissMigrationReminder();
    setIsVisible(false);
    onDismiss?.();
  };

  const handleCopyCommand = async () => {
    const command = 'npx realtimex-crm migrate';
    try {
      await navigator.clipboard.writeText(command);
      toast.success('Command copied to clipboard!', {
        description: 'Paste it in your terminal to run the migration.',
      });
    } catch (error) {
      console.error('Failed to copy command:', error);
      toast.error('Failed to copy command', {
        description: 'Please copy manually: npx realtimex-crm migrate',
      });
    }
  };

  return (
    <Alert className="relative border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
      <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
      <AlertTitle className="text-yellow-900 dark:text-yellow-100">
        Database Update Required (v{status.appVersion})
      </AlertTitle>
      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Your database schema needs to be updated to enable new features.
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-yellow-600 text-yellow-900 hover:bg-yellow-100 dark:border-yellow-500 dark:text-yellow-100 dark:hover:bg-yellow-900/30"
              onClick={handleCopyCommand}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Command
            </Button>
            {onLearnMore && (
              <Button
                size="sm"
                variant="default"
                className="bg-yellow-600 text-white hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600"
                onClick={onLearnMore}
              >
                Learn More
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-yellow-900 hover:bg-yellow-100 dark:text-yellow-100 dark:hover:bg-yellow-900/30"
              onClick={handleDismiss}
            >
              Remind Later
            </Button>
          </div>
        </div>
      </AlertDescription>
      <Button
        size="icon"
        variant="ghost"
        className="absolute right-2 top-2 h-6 w-6 text-yellow-900 hover:bg-yellow-100 dark:text-yellow-100 dark:hover:bg-yellow-900/30"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </Button>
    </Alert>
  );
}
