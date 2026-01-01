/**
 * Utilities for working with dates and relative time display
 */

/**
 * Calculate the difference in days between two dates
 */
export function getDaysDifference(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
  const diffMs = date2.getTime() - date1.getTime();
  return Math.floor(diffMs / oneDay);
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is tomorrow
 */
export function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
}

/**
 * Format a date as relative time (e.g., "Overdue", "Due today", "Due in 3 days")
 * @param dateString - ISO date string
 * @param isCompleted - Whether the task is completed (done or cancelled)
 * @returns Object with relative text and whether it's overdue
 */
export function getRelativeDueDate(
  dateString: string | null | undefined,
  isCompleted: boolean = false
): { text: string; isOverdue: boolean } {
  if (!dateString) {
    return { text: "No due date", isOverdue: false };
  }

  // Parse date as local date to avoid timezone shift
  // Extract date part (handles both "YYYY-MM-DD" and "YYYY-MM-DDTHH:MM:SS" formats)
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  const dueDate = new Date(year, month - 1, day);
  dueDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysDiff = getDaysDifference(today, dueDate);

  // If task is completed, just show the date
  if (isCompleted) {
    return {
      text: dueDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: dueDate.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
      }),
      isOverdue: false,
    };
  }

  // Check if overdue
  if (daysDiff < 0) {
    const daysOverdue = Math.abs(daysDiff);
    return {
      text: daysOverdue === 1 ? "Overdue by 1 day" : `Overdue by ${daysOverdue} days`,
      isOverdue: true,
    };
  }

  // Due today
  if (isToday(dueDate)) {
    return { text: "Due today", isOverdue: false };
  }

  // Due tomorrow
  if (isTomorrow(dueDate)) {
    return { text: "Due tomorrow", isOverdue: false };
  }

  // All future dates show "Due in X days"
  return {
    text: `Due in ${daysDiff} ${daysDiff === 1 ? 'day' : 'days'}`,
    isOverdue: false,
  };
}
