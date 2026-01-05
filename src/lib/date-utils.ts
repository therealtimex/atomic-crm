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
import { translateWithFallback, type Translate } from "@/i18n/utils";

type RelativeDueDateOptions = {
  translate?: Translate;
  locale?: string;
};

export function parseLocalDate(
  dateString: string | null | undefined,
): Date | null {
  if (!dateString) return null;
  const datePart = dateString.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  if ([year, month, day].some((value) => Number.isNaN(value))) {
    return null;
  }
  const localDate = new Date(year, month - 1, day);
  if (Number.isNaN(localDate.getTime())) return null;
  localDate.setHours(0, 0, 0, 0);
  return localDate;
}

export function getRelativeDueDate(
  dateString: string | null | undefined,
  isCompleted: boolean = false,
  options: RelativeDueDateOptions = {},
): { text: string; isOverdue: boolean } {
  const translate = options.translate;
  const locale = options.locale;
  const formatFallback = (
    fallback: string,
    params?: Record<string, unknown>,
  ) => {
    if (!params) return fallback;
    return fallback.replace(/%\{(\w+)\}/g, (_, key) => {
      const value = params[key];
      return value === undefined ? `%{${key}}` : String(value);
    });
  };
  const t = (key: string, fallback: string, params?: Record<string, unknown>) =>
    translate
      ? translateWithFallback(translate, key, fallback, params)
      : formatFallback(fallback, params);
  if (!dateString) {
    return {
      text: t("crm.task.due.no_date", "No due date"),
      isOverdue: false,
    };
  }

  const dueDate = parseLocalDate(dateString);
  if (!dueDate) {
    return {
      text: t("crm.task.due.no_date", "No due date"),
      isOverdue: false,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysDiff = getDaysDifference(today, dueDate);

  // If task is completed, just show the date
  if (isCompleted) {
    return {
      text: dueDate.toLocaleDateString(locale, {
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
      text:
        daysOverdue === 1
          ? t("crm.task.due.overdue_one", "Overdue by 1 day")
          : t("crm.task.due.overdue_many", "Overdue by %{count} days", {
              count: daysOverdue,
            }),
      isOverdue: true,
    };
  }

  // Due today
  if (isToday(dueDate)) {
    return { text: t("crm.task.due.today", "Due today"), isOverdue: false };
  }

  // Due tomorrow
  if (isTomorrow(dueDate)) {
    return { text: t("crm.task.due.tomorrow", "Due tomorrow"), isOverdue: false };
  }

  // All future dates show "Due in X days"
  return {
    text:
      daysDiff === 1
        ? t("crm.task.due.in_days_one", "Due in 1 day")
        : t("crm.task.due.in_days_many", "Due in %{count} days", {
            count: daysDiff,
          }),
    isOverdue: false,
  };
}
