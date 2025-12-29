/**
 * MigrationBanner Component
 *
 * Displays a compact floating notification in top-right corner when migration is required.
 * Non-blocking: allows users to continue using the app while showing the reminder.
 */

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
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
  /** Callback when user clicks to open modal */
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

  const handleClick = () => {
    if (onLearnMore) {
      onLearnMore();
    } else {
      // Fallback: copy command
      navigator.clipboard.writeText('npx realtimex-crm migrate');
      toast.success('Command copied!');
    }
  };

  return (
    <div className="fixed right-4 top-16 z-50 max-w-sm animate-in slide-in-from-top-5">
      <div className="rounded-lg border border-yellow-500 bg-yellow-50 p-4 shadow-lg dark:bg-yellow-950/90 dark:border-yellow-600">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-500 mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Database Update Available
              </p>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 -mr-1 -mt-1 text-yellow-900 hover:bg-yellow-100 dark:text-yellow-100 dark:hover:bg-yellow-900/30"
                onClick={handleDismiss}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Dismiss</span>
              </Button>
            </div>
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              Schema v{status.appVersion} is ready to install
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600"
                onClick={handleClick}
              >
                View Details
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-yellow-900 hover:bg-yellow-100 dark:text-yellow-100 dark:hover:bg-yellow-900/30"
                onClick={handleDismiss}
              >
                Later
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
