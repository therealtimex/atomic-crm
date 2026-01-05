import { formatRelative } from "date-fns";
import { useLocale } from "ra-core";
import { getDateFnsLocale } from "@/i18n/date-fns";

export function RelativeDate({ date }: { date: string }) {
  const locale = useLocale();
  return formatRelative(new Date(date), new Date(), {
    locale: getDateFnsLocale(locale),
  });
}