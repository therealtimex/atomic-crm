/**
 * MigrationPulseIndicator Component
 *
 * Shows a pulsing dot indicator when migration is needed but notification is dismissed.
 * Provides a subtle, persistent reminder without being intrusive.
 */

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MigrationPulseIndicatorProps {
  /** Callback when user clicks the indicator */
  onClick: () => void;
}

export function MigrationPulseIndicator({
  onClick,
}: MigrationPulseIndicatorProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={onClick}
          >
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
            {/* Pulsing dot */}
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-yellow-500"></span>
            </span>
            <span className="sr-only">Database migration pending</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm font-medium">Database Update Available</p>
          <p className="text-xs text-muted-foreground">
            Click to view migration details
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
