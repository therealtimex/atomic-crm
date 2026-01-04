import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslate } from "ra-core";
import { translateChoice } from "@/i18n/utils";

const priorityColors = {
  low: "bg-slate-500 hover:bg-slate-600",
  medium: "bg-blue-500 hover:bg-blue-600",
  high: "bg-orange-500 hover:bg-orange-600",
  urgent: "bg-red-500 hover:bg-red-600",
};

export const TaskPriorityBadge = ({ priority }: { priority?: string }) => {
  const translate = useTranslate();
  if (!priority) return null;
  const colorClass =
    priorityColors[priority as keyof typeof priorityColors] || "bg-slate-500";
  const label = translateChoice(
    translate,
    "crm.task.priority",
    priority,
    priority,
  );

  return (
    <Badge className={cn(colorClass)}>
      {label}
    </Badge>
  );
};
